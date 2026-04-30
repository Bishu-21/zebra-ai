import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable, resumes as resumesTable, coverLetters as coverLettersTable } from "@/lib/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { handleApiError } from "@/lib/api-error";
import crypto from "crypto";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ 
  model: process.env.GEMINI_MODEL || "gemini-2.0-flash" 
});

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

        const { resumeId, jobDescription, title } = validation.data;

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
                where: and(eq(resumesTable.id, resumeId), eq(resumesTable.userId, session.user.id))
            });
            resumeText = resume?.content || "";
        }

        // 3. AI Prompt Construction
        const prompt = `
          You are a world-class Professional Career Coach and Expert Copywriter. 
          Your goal is to write a tailored, high-conversion cover letter that secures an interview at a top-tier firm.

          CANDIDATE PROFILE (RESUME):
          "${resumeText}"
          
          TARGET ROLE (JOB DESCRIPTION):
          "${jobDescription}"
          
          STRICT EDITORIAL GUIDELINES (FAILURE TO FOLLOW REDUCES QUALITY):
          1. STRUCTURE: Use the AIDA framework (Attention, Interest, Desire, Action).
          2. HOOK: Start with a powerful, non-generic opening. Mention something specific about the role/company or a relevant high-impact achievement from the resume that matches the job needs.
          3. QUANTIFICATION: You MUST prioritize and quantify achievements found in the resume (e.g., "reduced latency by 40%", "improved DB query efficiency by 30%", "98% OCR accuracy"). If the resume mentions specific projects like 'Mystic' or 'CivicOS', leverage them.
          4. TONE: Confident, professional, and surgically precise. Eliminate all fluff, generic adjectives, and passive voice.
          5. SKILL MAPPING: Directly map the candidate's technical skills (e.g., Python, Azure AI, Gemini LLMs, Power BI, SQL) to the specific requirements of the job. Show, don't just tell.
          6. FORMATTING: Use professional business letter formatting. Include a placeholder for the hiring manager's name if not provided.
          7. LENGTH: Maximum impact in 300-400 words.

          Return ONLY the cover letter content. Do not include any meta-talk, markdown code blocks (unless for formatting bold text), or conversational filler.
        `;

        // 4. Generate AI Content
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const letterContent = response.text();

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
