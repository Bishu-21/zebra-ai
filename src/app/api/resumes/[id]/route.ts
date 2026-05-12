import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { resumes as resumesTable } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(
    req: NextRequest,
    { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
    const params = await paramsPromise;
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const deleted = await db
            .delete(resumesTable)
            .where(
                and(
                    eq(resumesTable.id, params.id),
                    eq(resumesTable.userId, session.user.id)
                )
            )
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: "Resume not found or access denied" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Resume deleted" });
    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
    }
}
