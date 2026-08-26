import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resumes as resumesTable } from "@/lib/schema";
import { eq, and, sql } from "drizzle-orm";
import { handleApiError } from "@/lib/api-error";
import { resumeUpdateSchema } from "@/lib/validation";
import { requireAuth, notFoundResponse } from "@/lib/auth-policy";
import { normalizeResumeContentForStorage } from "@/lib/resume-content";

export async function PATCH(
    req: NextRequest,
    { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
    const params = await paramsPromise;
    try {
        const { auth: authCtx, errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

        const body = await req.json();
        const validation = resumeUpdateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }

        const { title, content, status, expectedRevision } = validation.data;
        let normalizedContent = content;
        if (content !== undefined) {
            try {
                normalizedContent = normalizeResumeContentForStorage(content);
            } catch (error) {
                return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid resume content" }, { status: 400 });
            }
        }

        // Verify ownership and update
        const updated = await db
            .update(resumesTable)
            .set({
                title,
                content: normalizedContent,
                status,
                revision: sql`${resumesTable.revision} + 1`,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(resumesTable.id, params.id),
                    eq(resumesTable.userId, authCtx.user.id),
                    eq(resumesTable.revision, expectedRevision!)
                )
            )
            .returning();

        if (updated.length === 0) {
            const owned = await db.query.resumes.findFirst({
                columns: { id: true },
                where: and(eq(resumesTable.id, params.id), eq(resumesTable.userId, authCtx.user.id)),
            });
            return owned
                ? NextResponse.json({ error: "This resume was updated elsewhere. Refresh before saving again." }, { status: 409 })
                : notFoundResponse("Resume");
        }

        return NextResponse.json({ success: true, data: updated[0] });
    } catch (error: unknown) {
        return handleApiError(error, "Resume Update PATCH");
    }
}
