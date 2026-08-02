import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resumes as resumesTable } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, notFoundResponse } from "@/lib/auth-policy";

export async function DELETE(
    req: NextRequest,
    { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
    const params = await paramsPromise;
    try {
        const { auth: authCtx, errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

        const deleted = await db
            .delete(resumesTable)
            .where(
                and(
                    eq(resumesTable.id, params.id),
                    eq(resumesTable.userId, authCtx.user.id)
                )
            )
            .returning();

        if (deleted.length === 0) {
            return notFoundResponse("Resume");
        }

        return NextResponse.json({ success: true, message: "Resume deleted" });
    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
    }
}
