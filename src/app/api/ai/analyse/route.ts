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

    // 3. AI Prompt Construction: High-Fidelity Strategic Audit
    const prompt = `
      SYSTEM: You are a World-Class Executive Career Coach and Senior Talent Acquisition Consultant with 20+ years of experience auditing resumes for Fortune 500 companies, high-growth startups, and elite academic programs.
      Your mission is to perform a high-fidelity, high-density, data-driven audit of the provided Resume based on 45+ premium global metrics.

      RESUME CONTENT:
      """
      ${content}
      """

      STRATEGIC DIRECTIVES (45+ POINT AUDIT):
      
      1. THE "STUDENT PROTOCOL" (STRICT FOR INDIVIDUALS < 3 YEARS EXPERIENCE):
         - PROFESSIONAL SUMMARY: Recommendation: "REMOVE". Students do not have enough history for a summary—it takes up valuable A4 real estate. Flag if present.
         - PROJECT TECH STACKS: Mandatory. Every project must specify its stack (e.g., "MERN, OpenAI, Docker") directly next to the heading.
         - LIVE LINKS: Mandatory. Every project must have a GitHub or Demo URL. Flag as "CRITICAL" if missing.
         - SINGLE PAGE RULE: 1-page limit is hard. Flags for students with > 1 page.
         - BULLET IMPACT: No "Topic: Description" styles. Use impact-first bullets: [Action Verb] + [Quantitative Metric] + [Outcome].

      2. FORMATTING & ATS RIGOR:
         - HEADINGS: Use standard "EXPERIENCE", "PROJECTS", "SKILLS", "EDUCATION".
         - TYPOGRAPHY: Flag inconsistent font sizes or non-standard professional fonts.
         - MARGINS: Check for claustrophobic or excessive spacing (0.5" - 1.0" range).
         - FILE NAMES: Must follow "Firstname_Lastname_Resume.pdf" format.

      3. IMPACT & VERIFICATION:
         - QUANTIFIABLE METRICS: Every bullet point MUST contain a number, %, or $ value. "Improved speed" (FAIL) -> "Optimized latency by 45%" (PASS).
         - "SO WHAT?" TEST: For every line, ask "Does this show value or just a chore?".
         - REVERSE CHRONOLOGY: Mandatory for experience/education.

      TASK:
      1. Calculate an Overall Score (0-100).
      2. Construct a 'audit' object with specific, ACTIONABLE "fix" messages for every Fail.
      3. For every category, provide AT LEAST 3 check points. If the resume is perfect, state it as a "Pass".
      4. Provide 'recruiterInsights' mirroring a 7-second high-density scan.
      5. Suggest 6 High-Impact Bullet Rewrites focusing on quantifiable metrics.

      REQUIRED JSON SCHEMA (STRICT):
      {
        "score": number,
        "summary": "2-3 sentences of high-level strategic overview (professional, no placeholders)",
        "metrics": { "impact": number, "formatting": number, "ats": number, "branding": number },
        "audit": {
          "formatting": [ { "checkpoint": string, "status": "Pass" | "Fail", "fix": string } ],
          "contact": [ { "checkpoint": string, "status": "Pass" | "Fail", "fix": string } ],
          "summary": [ { "checkpoint": string, "status": "Pass" | "Fail", "fix": string } ],
          "experience": [ { "checkpoint": string, "status": "Pass" | "Fail", "fix": string } ],
          "skills": [ { "checkpoint": string, "status": "Pass" | "Fail", "fix": string } ],
          "general": [ { "checkpoint": string, "status": "Pass" | "Fail", "fix": string } ]
        },
        "recruiterInsights": {
          "sevenSecondScan": "Direct feedback on what catches the eye first.",
          "soWhatTest": "Critique of the value proposition.",
          "readability": "Feedback on layout density and visual flow."
        },
        "suggestedBulletPoints": ["Impact-driven rewrite 1", "Impact-driven rewrite 2", "Impact-driven rewrite 3", "Impact-driven rewrite 4", "Impact-driven rewrite 5", "Impact-driven rewrite 6"]
      }

      OUTPUT CONSTRAINT: Return ONLY a valid JSON object. No markdown wrappers.
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
