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
            
            OUTPUT: Exactly 3 bullet points, one per line. No markdown formatting, no headers.
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Robust parsing of bullet points
        const suggestions = text
            .split('\n')
            .map(s => s.replace(/^[-*•\d.\s]+/, '').trim())
            .filter(s => s.length > 5)
            .slice(0, 3);

        return NextResponse.json({ suggestions });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
