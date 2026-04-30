import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable, resumes as resumesTable, atsOptimisations as atsTable } from "@/lib/schema";
import { eq, and, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { handleApiError } from "@/lib/api-error";
import crypto from "crypto";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ 
  model: process.env.GEMINI_MODEL || "gemma-4-31b-it" 
});

import { tailorSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const validation = tailorSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }

        const { resumeId, jobDescription } = validation.data;

        // 1. Check credits
        const userData = await db.query.user.findFirst({
            where: eq(userTable.id, session.user.id)
        });

        if (!userData || userData.credits <= 0) {
            return NextResponse.json({ error: "Insufficient credits" }, { status: 403 });
        }

        // 2. Fetch Resume — ownership check: only allow user's own resumes
        const resume = await db.query.resumes.findFirst({
            where: and(eq(resumesTable.id, resumeId), eq(resumesTable.userId, session.user.id))
        });

        if (!resume) {
            return NextResponse.json({ error: "Resume not found" }, { status: 404 });
        }

        // 3. AI Prompt: Elite ATS Comparison
        const prompt = `
          SYSTEM: You are an Elite Talent Acquisition Specialist and ATS (Applicant Tracking System) Architect. 
          Your mission is to perform a deep-dive comparison between the provided Resume and Job Description.

          RESUME CONTENT:
          """
          ${resume.content}
          """

          JOB DESCRIPTION:
          """
          ${jobDescription}
          """

          TASK:
          1. Calculate a highly accurate ATS Match Score (0-100).
          2. Identify critical keywords found and those missing.
          3. Analyze "Role Fit" based on experience and hard skills.
          4. Pinpoint "Critical Gaps" that would cause immediate rejection.
          5. Provide explicit, high-impact "Tailoring Suggestions" for the summary, skills, and experience sections.

          OUTPUT CONSTRAINT:
          - Return ONLY a valid JSON object.
          - NO conversational preamble, NO closing remarks, NO markdown code block wrappers (e.g., \`\`\`json).
          - Ensure all fields are professionally worded and actionable.

          REQUIRED JSON SCHEMA:
          {
            "matchScore": number,
            "keywordsFound": string[],
            "keywordsMissing": string[],
            "roleFit": string,
            "criticalGaps": string[],
            "tailoringSuggestions": string[],
            "executiveSummary": string
          }

          OUTPUT:
        `;

        // 4. Generate AI Content
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text().trim();
        
        let analysis;
        try {
            // Find the start and end of the JSON object
            const start = textResponse.indexOf("{");
            const end = textResponse.lastIndexOf("}");
            
            if (start === -1 || end === -1) {
                throw new Error("No JSON object found in response");
            }
            
            const jsonString = textResponse.substring(start, end + 1);
            analysis = JSON.parse(jsonString);
        } catch {
            console.error("AI returned malformed JSON or text:", textResponse);
            return NextResponse.json({ 
                error: "Failed to parse AI analysis. The model returned non-JSON data.",
                details: textResponse.slice(0, 500) // Include snippet for debugging
            }, { status: 500 });
        }

        // 5. Atomic Update: Use Credits & Save Optimization
        await db.transaction(async (tx) => {
            await tx.update(userTable)
                .set({ credits: sql`${userTable.credits} - 1` })
                .where(eq(userTable.id, session.user.id));

            await tx.insert(atsTable).values({
                id: crypto.randomUUID(),
                userId: session.user.id,
                resumeId: resumeId,
                jobDescription: jobDescription,
                matchScore: analysis.matchScore,
                feedback: analysis,
                createdAt: new Date(),
            });
        });

        return NextResponse.json({ success: true, analysis });

    } catch (error: unknown) {
        return handleApiError(error, "POST /api/ai/tailor");
    }
}
