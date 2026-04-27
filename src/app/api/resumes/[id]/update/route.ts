import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { resumes as resumesTable } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
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

        const body = await req.json();
        const { title, content, status } = body;

        // Verify ownership and update
        const updated = await db
            .update(resumesTable)
            .set({
                title,
                content,
                status,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(resumesTable.id, params.id),
                    eq(resumesTable.userId, session.user.id)
                )
            )
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: "Resume not found or access denied" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updated[0] });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
