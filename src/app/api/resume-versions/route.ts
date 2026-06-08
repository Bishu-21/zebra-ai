import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { resumes as resumesTable, resumeVersions as resumeVersionsTable } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { saveVersionSchema } from "@/lib/validation";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });
    
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    
        let body;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const validation = saveVersionSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }

        const { resumeId, title, company, targetRole, jobDescription, content, matchScore, feedback } = validation.data;

        const resume = await db.query.resumes.findFirst({
            where: and(
                eq(resumesTable.id, resumeId),
                eq(resumesTable.userId, session.user.id)
            )
        });

        if (!resume) {
            return NextResponse.json({ error: "Base resume not found or unauthorized" }, { status: 403 });
        }

        const versionId = crypto.randomUUID();
        
        await db.insert(resumeVersionsTable).values({
            id: versionId,
            userId: session.user.id,
            resumeId,
            title,
            company: company || null,
            targetRole: targetRole || null,
            jobDescription: jobDescription || null,
            content,
            matchScore: matchScore || null,
            feedback: feedback || null,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return NextResponse.json({ success: true, versionId });
    } catch (error: unknown) {
        console.error("Save Resume Version Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
