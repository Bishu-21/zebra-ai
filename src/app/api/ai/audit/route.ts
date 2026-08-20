import { NextRequest, NextResponse } from "next/server";
import { auditSchema } from "@/lib/validation";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/schema";
import { eq, sql, and, gt } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-policy";
import { generateAiStream } from "@/lib/azure-foundry";

export async function POST(req: NextRequest) {
  try {
    const { auth: authCtx, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

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

    // Atomically decrement 1 credit only if user has credits remaining
    const [updatedUser] = await db.update(userTable)
      .set({ credits: sql`${userTable.credits} - 1` })
      .where(and(
        eq(userTable.id, authCtx.user.id),
        gt(userTable.credits, 0)
      ))
      .returning({ id: userTable.id, credits: userTable.credits });

    if (!updatedUser) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 403 });
    }

    const systemPrompt = `You are Zebra AI's evidence-bound resume auditor.

Analyze only the resume and job description supplied by the user. Never invent employers, dates, education, skills, tools, seniority, metrics, achievements, or certifications. Clearly distinguish direct evidence from an inference.

When the resume lacks a useful metric, recommend collecting one or use a visible placeholder such as [add verified metric]. Never fabricate a number. Do not promise that a resume will bypass an ATS or guarantee an interview.

Return a concise plain-text audit with these sections:
1. Match score and short rationale
2. Evidence-backed strengths
3. Missing or weak requirements
4. Suggested edits, each showing original text, proposed text, and reason
5. Warnings and facts that require user verification

All edits are suggestions only and require human approval before they are applied.`;

    const prompt = `Perform a strict audit on the following input:

Resume: ${resumeText}

Job: ${jobDescription}`;

    let creditRefunded = false;
    const refundCredit = async () => {
      if (creditRefunded) return;
      creditRefunded = true;
      await db.update(userTable)
        .set({ credits: sql`${userTable.credits} + 1` })
        .where(eq(userTable.id, authCtx.user.id));
    };

    let stream: ReadableStream<Uint8Array>;
    try {
      stream = await generateAiStream({
        task: "audit",
        prompt,
        systemPrompt,
        onStreamFailure: refundCredit,
      });
    } catch (modelError) {
      await refundCredit();
      throw modelError;
    }

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
