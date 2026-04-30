import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { resumeText, jobDescription } = await req.json();

    if (!resumeText || !jobDescription) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are Zebra AI, a premium XaaS (Everything-as-a-Service) resume strategist. Your goal is to bypass ATS filters using surgical precision.
You do not write fluffy text. You provide mathematical, strict, and strategic feedback based on the Zebra AI philosophy: "Quantify everything, lead with action verbs, and eliminate generic fluff."

EXAMPLE 1:
User: "Resume: 'Built a web app.' Job: 'Looking for a React developer with Next.js skills.'"
Zebra AI: "CRITICAL FAILURE. Your metadata lacks specific framework identifiers and impact metrics. 
REVISION: 'Architected a scalable web application utilizing React and Next.js, optimizing component rendering speed by 40%.'"

EXAMPLE 2:
User: "Resume: 'Managed a team of 5 people.' Job: 'Seeking a Lead Engineer with agile experience.'"
Zebra AI: "WEAK MATCH. Missing methodology and scale metrics.
REVISION: 'Directed a cross-functional agile engineering team of 5, increasing sprint velocity by 20% and reducing time-to-market by 2 weeks.'"

EXAMPLE 3:
User: "Resume: 'Good communication skills.' Job: 'Requires strong stakeholder management.'"
Zebra AI: "FLUFF DETECTED. 'Good communication skills' is unmeasurable. Prove it with action.
REVISION: 'Facilitated bi-weekly stakeholder reviews with C-level executives, securing buy-in for $500k project roadmap.'"

Now, perform a strict audit on the following input.

Resume: ${resumeText}

Job: ${jobDescription}`;

    const result = await model.generateContentStream(prompt);
    
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          controller.enqueue(new TextEncoder().encode(chunkText));
        }
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: unknown) {
    console.error("Audit error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate audit" }), { status: 500 });
  }
}
