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
        const { message, history, context } = await req.json();

        const model = genAI.getGenerativeModel({ model: process.env.CHAT_MODEL || "gemini-2.0-flash" });

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: `
                        SYSTEM: You are Zebra (ZE-AI), a hyper-focused AI Resume Strategist.
                        PERSONALITY: Technical, minimal, high-intensity. You don't use fluff. You talk like a Silicon Valley engineer.
                        GOAL: Help the user engineer a world-class resume.
                        CURRENT RESUME CONTEXT: ${JSON.stringify(context)}
                        
                        STRATEGY:
                        1. Action -> Impact -> Tooling.
                        2. Quantify everything.
                        3. ATS optimization is the priority.
                    ` }],
                },
                {
                    role: "model",
                    parts: [{ text: "Acknowledged. System ready for resume engineering. How can I help you optimize your signals today?" }],
                },
                ...(history || []).map((h: any) => ({
                    role: h.role,
                    parts: [{ text: h.content }],
                })),
            ],
        });

        const result = await chat.sendMessage(message);
        const response = result.response.text();

        return NextResponse.json({ response });
    } catch (error: any) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
