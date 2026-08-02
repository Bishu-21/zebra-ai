import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-policy";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeSecretText } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy");

export async function POST(req: NextRequest) {
    try {
        const { auth: authCtx, errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

        // Rate limiting boundary (max 15 copilot requests per minute per user)
        const rateCheck = checkRateLimit(`ai-copilot:${authCtx.user.id}`, 15, 60000);
        if (!rateCheck.success) {
            return NextResponse.json({ 
                error: "Rate limit exceeded for AI copilot. Please wait a minute." 
            }, { status: 429 });
        }

        const body = await req.json().catch(() => ({}));
        const { section, context, currentText } = body;

        const cleanSection = String(section || "general").slice(0, 100);
        const cleanText = String(currentText || "").slice(0, 10000);

        const model = genAI.getGenerativeModel({ model: process.env.COPILOT_MODEL || "gemini-3.1-flash-lite" });

        const prompt = `
            SYSTEM: You are Zebra (ZE-AI), a hyper-focused AI Resume Strategist.
            SECTION: "${cleanSection}"
            CURRENT CONTENT: "${cleanText}"
            USER CONTEXT: ${JSON.stringify(context || {}).slice(0, 2000)}

            INSTRUCTIONS:
            1. Suggest 3 high-impact, ATS-optimized bullet points specifically for this section.
            2. Use formula: [Action Verb] + [Quantifiable Result] + [Tech Used].
            3. Keep each suggestion under 120 characters including spaces.
            
            OUTPUT: A JSON array of 3 objects with keys:
            - "original": text being replaced
            - "problem": 1-sentence critique
            - "after": High-impact suggestion
            - "rationale": Brief explanation

            Return ONLY the JSON array.
        `;

        const result = await model.generateContent(prompt);
        const textText = result.response.text();

        let suggestions = [];
        try {
            const jsonMatch = textText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                suggestions = JSON.parse(jsonMatch[0]);
            } else {
                suggestions = textText.split('\n')
                    .map(s => s.replace(/^[-*•\d.\s]+/, '').trim())
                    .filter(s => s.length > 5)
                    .slice(0, 3)
                    .map(s => ({
                        original: cleanText,
                        problem: "Lacks quantification and action verbs.",
                        after: s,
                        rationale: "Used action verbs and focused on impact."
                    }));
            }
        } catch (e) {
            console.error("JSON Parse error in copilot:", e);
        }

        return NextResponse.json({ suggestions });
    } catch (error: unknown) {
        const sanitizedMsg = sanitizeSecretText(error instanceof Error ? error.message : String(error));
        console.error("Fatal Copilot Error:", sanitizedMsg);
        return NextResponse.json({ error: "Failed to generate copilot suggestions safely." }, { status: 500 });
    }
}
