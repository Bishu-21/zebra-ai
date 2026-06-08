import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { MAX_CONTENT_LENGTH, MAX_JOB_DESC_LENGTH } from "@/lib/validation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const auditSchema = z.object({
  resumeText: z.string().min(1, "Resume text is required").max(MAX_CONTENT_LENGTH),
  jobDescription: z.string().min(1, "Job description is required").max(MAX_JOB_DESC_LENGTH),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = await db.query.user.findFirst({
      where: eq(userTable.id, session.user.id),
    });

    if (!userData || userData.credits <= 0) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 403 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const validation = auditSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    const { resumeText, jobDescription } = validation.data;

    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-3.1-flash-lite" });

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

    // Deduct 1 credit from user
    await db.update(userTable)
      .set({ credits: sql`${userTable.credits} - 1` })
      .where(eq(userTable.id, session.user.id));
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            controller.enqueue(new TextEncoder().encode(chunkText));
          }
          controller.close();
        } catch (streamError) {
          console.error("Audit stream error:", streamError);
          controller.error(new Error("Stream aborted"));
        }
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
    return NextResponse.json({ error: "Failed to generate audit" }, { status: 500 });
  }
}
