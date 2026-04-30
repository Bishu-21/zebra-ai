import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { section, context, currentText } = await req.json();

        const model = genAI.getGenerativeModel({ model: process.env.COPILOT_MODEL || "gemini-2.5-flash-lite" });

        const prompt = `
            SYSTEM: You are Zebra (ZE-AI), a hyper-focused AI Resume Strategist.
            STYLE: Silicon Valley / High-Performance Minimalism.
            STRATEGY: Action -> Quantifiable Impact -> Technical Tooling.
            
            SECTION: "${section}"
            CURRENT CONTENT: "${currentText || "Empty"}"
            USER CONTEXT: ${JSON.stringify(context)}

            INSTRUCTIONS:
            1. Suggest 3 high-impact, ATS-optimized bullet points specifically for this section.
            2. For EXPERIENCE: Use the formula [Action Verb] + [Quantifiable Result] + [Tech Used].
            3. For PROJECTS: Highlight the "Problem Solved" and "Tech Stack" integration.
            4. For SKILLS: Group by category (e.g., "Languages", "Frameworks") and ensure modern tooling is prioritized.
            5. ELIMINATE FLUFF: No "Responsible for", no "Assisted in". Use "Spearheaded", "Architected", "Optimized".
            6. ONE-PAGE RULE: Keep each suggestion under 120 characters including spaces.
            
            OUTPUT: A JSON array of 3 objects with these keys:
            - "original": The text being replaced (use empty string if adding new).
            - "problem": 1-sentence critique of why the original is weak.
            - "after": The high-impact suggestion.
            - "rationale": Brief explanation of the improvement strategy.

            Return ONLY the JSON array. No markdown.
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Extract JSON
        let suggestions = [];
        try {
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                suggestions = JSON.parse(jsonMatch[0]);
            } else {
                // Fallback parsing if JSON fails but lines are provided
                suggestions = text.split('\n')
                    .map(s => s.replace(/^[-*•\d.\s]+/, '').trim())
                    .filter(s => s.length > 5)
                    .slice(0, 3)
                    .map(s => ({
                        original: currentText || "",
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
        return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
    }
}
