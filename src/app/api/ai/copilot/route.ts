import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { section, context, currentText } = await req.json();

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
            You are a world-class ATS-optimization expert and professional resume writer (Zebra AI Copilot).
            
            TASK: Suggest improvements for the following resume section: "${section}".
            CURRENT CONTENT: "${currentText || "Empty"}"
            OVERALL CONTEXT: ${JSON.stringify(context)}

            GUIDELINES:
            1. Use high-impact action verbs (Engineered, Orchestrated, Spearheaded).
            2. Quantify achievements where possible (%, $, Time).
            3. Keep it minimalist and stealthy.
            4. Return a list of 3 concise, powerful bullet point suggestions.
            
            FORMAT: Just the bullet points, no preamble.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse bullet points
        const suggestions = text
            .split('\n')
            .map(s => s.replace(/^[*-•\d.]\s*/, '').trim())
            .filter(s => s.length > 0)
            .slice(0, 3);

        return NextResponse.json({ suggestions });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
