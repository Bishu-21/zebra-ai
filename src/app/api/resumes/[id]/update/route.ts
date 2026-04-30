import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { resumes as resumesTable } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { handleApiError } from "@/lib/api-error";

import { resumeSchema } from "@/lib/validation";

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
        const validation = resumeSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }

        const { title, content, status } = validation.data;

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
    } catch (error: unknown) {
        return handleApiError(error, "Resume Update PATCH");
    }
}
