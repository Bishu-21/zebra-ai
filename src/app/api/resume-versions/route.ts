import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resumeVersions as resumeVersionsTable } from "@/lib/schema";
import { saveVersionSchema } from "@/lib/validation";
import crypto from "crypto";
import { requireAuth, getUserOwnedResume, notFoundResponse } from "@/lib/auth-policy";

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

        const validation = saveVersionSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }

        const { resumeId, title, company, targetRole, jobDescription, content, matchScore, feedback } = validation.data;

        const resume = await getUserOwnedResume(authCtx.user.id, resumeId);
        if (!resume) {
            return notFoundResponse("Base resume");
        }

        const versionId = crypto.randomUUID();
        
        await db.insert(resumeVersionsTable).values({
            id: versionId,
            userId: authCtx.user.id,
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
