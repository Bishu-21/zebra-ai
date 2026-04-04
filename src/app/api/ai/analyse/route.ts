import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable, resumes as resumesTable, analysis as analysisTable } from "@/lib/schema";
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

    const { resumeId, content, title } = await req.json();

    if (!content) {
      return NextResponse.json({ error: "Resume content is required" }, { status: 400 });
    }

    // 1. Check user credits
    const userData = await db.query.user.findFirst({
        where: eq(userTable.id, session.user.id)
    });

    if (!userData || userData.credits <= 0) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 403 });
    }

    // 2. Prepare or fetch Resume ID
    let activeResumeId = resumeId;
    if (!activeResumeId) {
        // Create a temporary resume record if none exists
        activeResumeId = crypto.randomUUID();
        await db.insert(resumesTable).values({
            id: activeResumeId,
            userId: session.user.id,
            title: title || "Untitled Analysis",
            content: content,
            status: "Draft",
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }

    // 3. AI Prompt Construction: Executive Level Analysis
    const prompt = `
      SYSTEM: You are a World-Class Executive Career Coach and Senior Talent Acquisition Consultant. 
      Your mission is to perform a high-impact audit of the provided Resume.

      RESUME CONTENT:
      """
      ${content}
      """

      TASK:
      1. Calculate an Overall ATS Score (0-100) based on real-world hiring criteria.
      2. Provide a 4-point Metric Breakdown:
         - IMPACT: Quantifiable achievements and leadership value.
         - FORMATTING: Readability, structure, and white space.
         - ATS: Keyword density and structural parsing.
         - BRANDING: Unique value proposition and professional voice.
      3. Identify core Strengths and Weaknesses.
      4. Provide concrete Action Items for immediate improvement.
      5. Suggest high-impact Bullet Point rewrites for the experience section.

      OUTPUT CONSTRAINT:
      - Return ONLY a valid JSON object.
      - NO conversational preamble, NO closing remarks, NO markdown code block wrappers (e.g., \`\`\`json).
      - Ensure all content is professionally worded and highly actionable.

      REQUIRED JSON SCHEMA:
      {
        "score": number,
        "summary": string,
        "metrics": {
          "impact": number,
          "formatting": number,
          "ats": number,
          "branding": number
        },
        "strengths": string[],
        "weaknesses": string[],
        "actionItems": string[],
        "suggestedBulletPoints": string[]
      }

      OUTPUT:
    `;

    // 4. Generate AI Content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Robust JSON extraction
    let jsonFeedback;
    try {
        // Find the first occurrence of { and the last occurrence of }
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        
        if (start === -1 || end === -1) {
            throw new Error("No JSON object found in response");
        }
        
        const jsonString = text.substring(start, end + 1);
        jsonFeedback = JSON.parse(jsonString);
    } catch (e) {
        console.error("AI returned malformed JSON or text:", text);
        return NextResponse.json({ 
            error: "Analysis engine failed to generate structured data. Please try again.",
            details: text.slice(0, 500) 
        }, { status: 500 });
    }

    // 5. Atomic Update: Use Credits & Save Analysis
    await db.transaction(async (tx) => {
        // Deduct credit
        await tx.update(userTable)
            .set({ credits: sql`${userTable.credits} - 1` })
            .where(eq(userTable.id, session.user.id));

        // Save analysis record
        await tx.insert(analysisTable).values({
            id: crypto.randomUUID(),
            resumeId: activeResumeId,
            score: jsonFeedback.score,
            feedback: jsonFeedback,
            createdAt: new Date(),
        });
        
        // Update resume title if it was "Untitled"
        if (!title || title === "Untitled Analysis") {
            await tx.update(resumesTable)
                .set({ title: jsonFeedback.summary.split(".")[0].slice(0, 50) + "..." })
                .where(eq(resumesTable.id, activeResumeId));
        }
    });

    return NextResponse.json({ 
        success: true, 
        analysis: jsonFeedback,
        resumeId: activeResumeId
    });

  } catch (error: any) {
    console.error("Analysis Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
