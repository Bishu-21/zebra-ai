import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Note: Using a professional prompt engineering approach for the RAG agent
export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { message, resumeContext, chatHistory } = await req.json();

        // Undercover Professional Prompt Engineering
        const systemPrompt = `
            STRATEGIC IDENTITY: ZEBRA-RAG-AGENT-X1 (Model: Gemma-3-27B-IT)
            OBJECTIVE: Provide hyper-specialized, Quantifiable, and Competitive career strategy.
            CONTEXT: Current user resume JSON structure: ${JSON.stringify(resumeContext)}
            
            OPERATIONAL GUIDELINES:
            1. REASONING: Always analyze the resume before answering. Identify gaps in technical density, impact metrics, or structural flow.
            2. STRATEGY: Use the "XaaS" (Career Partner) mindset. Don't just answer questions; provide "Next Steps" to win interviews.
            3. ATS-ENGINEERING: Ensure every suggestion is 100% parseable by modern ATS systems (Workday, Greenhouse, Lever).
            4. TONE: High-Performance Minimalism. Sharp, analytical, and professional.
            
            TASKS:
            - If user asks to "fix" or "improve", suggest specific action verbs and metrics.
            - If user asks about "Matching", compare their resume against hidden industry standard job descriptions.
            - If user asks "What's missing?", identify missing technical tooling or certifications for their specific role.
        `;

        // Mocking the completion for now while the SDK is configured for Gemma-3
        // In production, this would call the Vertex AI or specialized Gemma endpoint
        return NextResponse.json({ 
            response: `As your ZEBRA-RAG Strategist, I've analyzed your current trajectory. 
            
            CRITICAL OBSERVATION: Your "Experience" section lacks high-frequency tech tooling. 
            ACTION: I recommend architecting your bullet points using the [Action -> Impact -> Tooling] formula. 
            
            Would you like me to rewrite your most recent role to emphasize strategic technical leadership?`,
            model: "gemma-3-27b-it"
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
