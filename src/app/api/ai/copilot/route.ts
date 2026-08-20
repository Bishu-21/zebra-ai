import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-policy";
import { checkDistributedRateLimit } from "@/lib/rate-limit";
import { sanitizeSecretText } from "@/lib/db";
import { generateAiResponse } from "@/lib/azure-foundry";
import { resumeContentToPrompt } from "@/lib/resume-content";

const copilotSuggestionsSchema = z.array(z.object({
    original: z.string().max(10_000),
    problem: z.string().min(1).max(500),
    after: z.string().min(1).max(1_000),
    rationale: z.string().min(1).max(500),
})).min(1).max(3);

export async function POST(req: NextRequest) {
    try {
        const { auth: authCtx, errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

        const rateCheck = await checkDistributedRateLimit(`ai-copilot:${authCtx.user.id}`, 15, 60_000);
        if (!rateCheck.success) {
            return NextResponse.json(
                { error: "Rate limit exceeded for AI copilot. Please wait a minute." },
                { status: 429 },
            );
        }

        const body = await req.json().catch(() => null);
        if (!body || typeof body !== "object") {
            return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const { section, context, currentText } = body as Record<string, unknown>;
        const cleanSection = String(section || "general").slice(0, 100);
        const cleanText = String(currentText || "").slice(0, 10_000);
        const storedContext = typeof context === "string"
            ? context
            : JSON.stringify(context ?? {});
        const cleanContext = resumeContentToPrompt(storedContext).slice(0, 12_000);

        const systemPrompt = `You are Zebra (ZE-AI), an evidence-bound resume editor.
SECTION: "${cleanSection}"
CURRENT CONTENT: "${cleanText}"
RESUME CONTEXT: ${cleanContext}

Use only facts present in CURRENT CONTENT or RESUME CONTEXT. Never invent an employer, date, skill, achievement, or metric. If a metric is missing, use [add verified metric] or explain what evidence the user should provide. Every rewrite is a proposal requiring user approval.`;

        const prompt = `INSTRUCTIONS:
1. Return up to 3 concise, ATS-aware rewrites specifically for this section.
2. Prefer [Action Verb] + [verified Impact] + [Tech Used] when supported by the resume.
3. Preserve the meaning of the source and never add an unsupported claim.

OUTPUT: A JSON array of objects with keys:
- "original": text being replaced
- "problem": one-sentence critique
- "after": evidence-grounded proposed wording
- "rationale": brief explanation

Return ONLY the JSON array.`;

        const text = (await generateAiResponse({
            task: "copilot",
            prompt,
            systemPrompt,
        })).trim();

        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error("Copilot returned an invalid response shape.");
        const suggestions = copilotSuggestionsSchema.parse(JSON.parse(jsonMatch[0]));

        return NextResponse.json({ suggestions });
    } catch (error: unknown) {
        const sanitizedMsg = sanitizeSecretText(error instanceof Error ? error.message : String(error));
        console.error("Fatal Copilot Error:", sanitizedMsg);
        return NextResponse.json(
            { error: "Failed to generate evidence-grounded copilot suggestions." },
            { status: 502 },
        );
    }
}
