import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable, resumes as resumesTable, atsOptimisations as atsTable } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import crypto from "crypto";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ 
  model: process.env.GEMINI_MODEL || "gemma-4-31b-it" 
});

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { resumeId, jobDescription } = await req.json();

        if (!resumeId || !jobDescription) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Check credits
        const userData = await db.query.user.findFirst({
            where: eq(userTable.id, session.user.id)
        });

        if (!userData || userData.credits <= 0) {
            return NextResponse.json({ error: "Insufficient credits" }, { status: 403 });
        }

        // 2. Fetch Resume
        const resume = await db.query.resumes.findFirst({
            where: eq(resumesTable.id, resumeId)
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
        } catch (e) {
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

    } catch (error: any) {
        console.error("Tailor API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
