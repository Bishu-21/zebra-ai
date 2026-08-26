import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workItems as workItemsTable } from "@/lib/schema";
import { eq, and, desc, lt, or } from "drizzle-orm";
import { handleApiError } from "@/lib/api-error";
import { z } from "zod";
import { requireAuth, notFoundResponse } from "@/lib/auth-policy";
import { paginateRows, parsePagination } from "@/lib/pagination";

const createWorkItemSchema = z.object({
    title: z.string().min(1, "Title is required"),
    category: z.enum(["Project", "Internship", "Hackathon", "Course", "Award", "Other"]).default("Project"),
    description: z.string().optional(),
    tools: z.array(z.string()).optional(),
    result: z.string().optional(),
    proofUrl: z.url().or(z.literal("")).optional(),
    isPublic: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
    try {
        const { auth: authCtx, errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

        const { limit, cursor } = parsePagination(req);
        const cursorCondition = cursor ? or(
            lt(workItemsTable.createdAt, cursor.timestamp),
            and(eq(workItemsTable.createdAt, cursor.timestamp), lt(workItemsTable.id, cursor.id)),
        ) : undefined;
        const rows = await db.select().from(workItemsTable)
            .where(and(eq(workItemsTable.userId, authCtx.user.id), cursorCondition))
            .orderBy(desc(workItemsTable.createdAt), desc(workItemsTable.id))
            .limit(limit + 1);
        const page = paginateRows(rows, limit, item => ({ id: item.id, timestamp: item.createdAt }));

        return NextResponse.json({ items: page.items, page: page.page });
    } catch (error: unknown) {
        return handleApiError(error, "GET /api/work");
    }
}

export async function POST(req: NextRequest) {
    try {
        const { auth: authCtx, errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

        const body = await req.json();
        const parsed = createWorkItemSchema.parse(body);

        const id = `work_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const now = new Date();

        const [newItem] = await db.insert(workItemsTable).values({
            id,
            userId: authCtx.user.id,
            title: parsed.title,
            category: parsed.category,
            description: parsed.description || null,
            tools: parsed.tools || [],
            result: parsed.result || null,
            proofUrl: parsed.proofUrl || null,
            isPublic: parsed.isPublic,
            lastReviewedAt: now,
            createdAt: now,
            updatedAt: now,
        }).returning();

        return NextResponse.json({ item: newItem });
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues?.[0]?.message || "Validation failed" }, { status: 400 });
        }
        return handleApiError(error, "POST /api/work");
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { auth: authCtx, errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Item ID required" }, { status: 400 });
        }

        const [deleted] = await db.delete(workItemsTable).where(
            and(
                eq(workItemsTable.id, id),
                eq(workItemsTable.userId, authCtx.user.id)
            )
        ).returning({ id: workItemsTable.id });

        if (!deleted) {
            return notFoundResponse("Work item");
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return handleApiError(error, "DELETE /api/work");
    }
}
