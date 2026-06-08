import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable, resumes as resumesTable, coverLetters as coverLettersTable } from "@/lib/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { headers } from "next/headers";
import { handleApiError } from "@/lib/api-error";
import crypto from "crypto";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);


export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const letters = await db.query.coverLetters.findMany({
            where: eq(coverLettersTable.userId, session.user.id),
            orderBy: [desc(coverLettersTable.createdAt)],
        });

        return NextResponse.json({ success: true, data: letters });
    } catch (error: unknown) {
        return handleApiError(error, "GET /api/cover-letters");
    }
}

import { generateCoverLetterSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const validation = generateCoverLetterSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }

        const { resumeId, jobDescription, title, intelligence } = validation.data;

        // 1. Check credits
        const userData = await db.query.user.findFirst({
            where: eq(userTable.id, session.user.id)
        });

        if (!userData || userData.credits <= 0) {
            return NextResponse.json({ error: "Insufficient credits" }, { status: 403 });
        }

        // 2. Fetch Resume content if resumeId is provided — ownership check
        let resumeText = "";
        if (resumeId) {
            const resume = await db.query.resumes.findFirst({
                where: and(
                    eq(resumesTable.id, resumeId),
                    eq(resumesTable.userId, session.user.id)
                )
            });
            resumeText = resume?.content || "";
        }

        // 3. AI Prompt Construction
        const systemInstruction = `You are a world-class Professional Career Coach and Expert Copywriter. Your ONLY purpose is to output the final, polished cover letter.
CRITICAL RULE: DO NOT output any drafting notes, thought processes, candidate summaries, or meta-talk.
DO NOT output phrases like "Professional Career Coach and Expert Copywriter."
START IMMEDIATELY with the cover letter text (e.g., Name/Contact info or Date).`;

        const userPrompt = `
          Write a tailored, high-conversion cover letter that secures an interview at a top-tier firm.

          <CANDIDATE_PROFILE>
          ${resumeText}
          </CANDIDATE_PROFILE>
          
          <TARGET_ROLE>
          ${jobDescription}
          </TARGET_ROLE>
          
          ${intelligence ? `
          <EXTRACTED_INTELLIGENCE>
          - KEY SKILLS: ${intelligence.skills.join(", ")}
          - COMPANY SIGNALS: ${intelligence.companySignals.join(", ")}
          - CORE REQUIREMENTS: ${intelligence.requirements.join(", ")}
          </EXTRACTED_INTELLIGENCE>
          ` : ""}

          STRICT EDITORIAL GUIDELINES (FAILURE TO FOLLOW REDUCES QUALITY):
          1. STRUCTURE: Use the AIDA framework (Attention, Interest, Desire, Action).
          2. HOOK: Start with a powerful, non-generic opening. Mention something specific about the role/company or a relevant high-impact achievement from the resume that matches the job needs.
          3. QUANTIFICATION: You MUST prioritize and quantify achievements found in the resume (e.g., "reduced latency by 40%", "improved DB query efficiency by 30%", "98% OCR accuracy"). If the resume mentions specific projects like 'Mystic' or 'CivicOS', leverage them.
          4. TONE: Confident, professional, and surgically precise. Eliminate all fluff, generic adjectives, and passive voice.
          5. SKILL MAPPING: Directly map the candidate's technical skills (e.g., Python, Azure AI, Gemini LLMs, Power BI, SQL) to the specific requirements of the job. Show, don't just tell.
          ${intelligence ? "6. FOCUS: Pay special attention to the core requirements and skills identified in the enrichment data above." : "6. ANALYSIS: Infer core requirements from the job description and match them with resume strengths."}
          7. FORMATTING: Use professional business letter formatting. Include a placeholder for the hiring manager's name if not provided.
          8. LENGTH: Maximum impact in 300-400 words.

          OUTPUT FORMAT:
          Return ONLY the final cover letter content. Do not include your drafting process, bullet points of the candidate's skills, or any other meta-text.
        `;

        // 4. Generate AI Content
        const generationModel = genAI.getGenerativeModel({ 
            model: process.env.GEMINI_MODEL || "gemini-3.1-flash-lite",
            systemInstruction: systemInstruction
        });
        const result = await generationModel.generateContent(userPrompt);
        const response = await result.response;
        const letterContent = response.text().replace(/^```[\s\S]*?\n/, '').replace(/```$/, '').trim();

        // 5. Save to Database & Deduct Credit
        const newLetterId = crypto.randomUUID();
        await db.transaction(async (tx) => {
            await tx.update(userTable)
                .set({ credits: sql`${userTable.credits} - 1` })
                .where(eq(userTable.id, session.user.id));

            await tx.insert(coverLettersTable).values({
                id: newLetterId,
                userId: session.user.id,
                resumeId: resumeId || null,
                title: title || "Cover Letter - " + new Date().toLocaleDateString(),
                jobDescription: jobDescription,
                content: letterContent,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        });

        return NextResponse.json({ success: true, id: newLetterId, content: letterContent });

    } catch (error: unknown) {
        return handleApiError(error, "POST /api/cover-letters");
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await req.json();

        await db.delete(coverLettersTable)
            .where(and(eq(coverLettersTable.id, id), eq(coverLettersTable.userId, session.user.id)));

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return handleApiError(error, "DELETE /api/cover-letters");
    }
}
