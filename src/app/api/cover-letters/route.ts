import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable, resumes as resumesTable, coverLetters as coverLettersTable } from "@/lib/schema";
import { eq, desc, sql } from "drizzle-orm";
import { headers } from "next/headers";
import crypto from "crypto";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ 
  model: process.env.GEMINI_MODEL || "gemma-4-31b-it" 
});

export async function GET(req: NextRequest) {
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
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { resumeId, jobDescription, title } = await req.json();

        if (!jobDescription) {
            return NextResponse.json({ error: "Job description is required" }, { status: 400 });
        }

        // 1. Check credits
        const userData = await db.query.user.findFirst({
            where: eq(userTable.id, session.user.id)
        });

        if (!userData || userData.credits <= 0) {
            return NextResponse.json({ error: "Insufficient credits" }, { status: 403 });
        }

        // 2. Fetch Resume content if resumeId is provided
        let resumeText = "";
        if (resumeId) {
            const resume = await db.query.resumes.findFirst({
                where: eq(resumesTable.id, resumeId)
            });
            resumeText = resume?.content || "";
        }

        // 3. AI Prompt Construction
        const prompt = `
          You are a professional career coach and expert copywriter.
          Write a tailored, high-conversion cover letter based on the following information.
          
          RESUME CONTEXT:
          "${resumeText}"
          
          JOB DESCRIPTION:
          "${jobDescription}"
          
          GUIDELINES:
          - Use a modern, professional tone.
          - Focus on specific achievements from the resume that match the job description.
          - Ensure the letter is concise (approx 300-400 words).
          - Use standard business letter formatting.
          - If resume context is missing, write a high-quality template based on the job description.
          
          Return ONLY the cover letter text. No markdown formatting like "Here is your letter".
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

    } catch (error: any) {
        console.error("Cover Letter Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
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
            .where(sql`${coverLettersTable.id} = ${id} AND ${coverLettersTable.userId} = ${session.user.id}`);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
