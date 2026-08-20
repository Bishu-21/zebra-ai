import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-policy";
import { checkDistributedRateLimit } from "@/lib/rate-limit";
import { generateAiResponse } from "@/lib/azure-foundry";
import { resumeContentToPrompt } from "@/lib/resume-content";

export async function POST(req: NextRequest) {
    try {
        const { auth: authCtx, errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

        const rateCheck = await checkDistributedRateLimit(`ai-chat:${authCtx.user.id}`, 20, 60_000);
        if (!rateCheck.success) {
            return NextResponse.json(
                { error: "Chat rate limit exceeded. Please wait a minute." },
                { status: 429 },
            );
        }

        const body = await req.json().catch(() => null);
        if (!body || typeof body !== "object") {
            return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const { message, history, context } = body as Record<string, unknown>;
        if (typeof message !== "string" || !message.trim()) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }
        if (message.length > 12_000) {
            return NextResponse.json({ error: "Message is too long" }, { status: 400 });
        }

        const storedContext = typeof context === "string"
            ? context
            : JSON.stringify(context ?? {});
        const serializedContext = resumeContentToPrompt(storedContext).slice(0, 20_000);

        const systemPrompt = `You are Zebra (ZE-AI), a hyper-focused AI Resume Strategist.
PERSONALITY: Technical, minimal, high-intensity. You don't use fluff. You talk like a Silicon Valley engineer.
GOAL: Help the user engineer a world-class resume.
CURRENT RESUME CONTEXT: ${serializedContext}

        RULES:
        1. Use only facts present in the resume or the user's message.
        2. Never invent employers, dates, skills, achievements, or metrics. Ask for missing evidence.
        3. Prefer Action -> verified Impact -> Tooling when the evidence supports it.
        4. Clearly label advice versus proposed wording.
        5. Never imply that a suggestion was applied; the user must approve every edit.
        6. Keep answers concise and ATS-aware.
        7. Format replies for scanning: short Markdown headings, bullets, and blank lines. Never return a dense wall of text.`;

        const response = await generateAiResponse({
            task: "chat",
            prompt: message.trim(),
            systemPrompt,
            history,
        });

        return NextResponse.json({ response });
    } catch (error: unknown) {
        const errorName = error instanceof Error ? error.name : "UnknownError";
        const errorMessage = error instanceof Error ? error.message : "Unknown failure";
        console.error(`[AI] Chat request failed (${errorName}): ${errorMessage}`);
        return NextResponse.json(
            { error: "ZE-AI could not finish that response. Your message was not lost; please retry." },
            { status: 502 },
        );
    }
}
