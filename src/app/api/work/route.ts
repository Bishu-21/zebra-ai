import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { workItems as workItemsTable } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

const createWorkItemSchema = z.object({
    title: z.string().min(1, "Title is required"),
    category: z.enum(["Project", "Internship", "Hackathon", "Course", "Award", "Other"]).default("Project"),
    description: z.string().optional(),
    tools: z.array(z.string()).optional(),
    result: z.string().optional(),
    proofUrl: z.string().url().or(z.literal("")).optional(),
    isPublic: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const items = await db.query.workItems.findMany({
            where: eq(workItemsTable.userId, session.user.id),
            orderBy: [desc(workItemsTable.createdAt)],
        });

        return NextResponse.json({ items });
    } catch (error: any) {
        console.error("GET /api/work Error:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch work items" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const parsed = createWorkItemSchema.parse(body);

        const id = `work_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const now = new Date();

        const [newItem] = await db.insert(workItemsTable).values({
            id,
            userId: session.user.id,
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
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues?.[0]?.message || "Validation failed" }, { status: 400 });
        }
        console.error("POST /api/work Error:", error);
        return NextResponse.json({ error: error.message || "Failed to create work item" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Item ID required" }, { status: 400 });
        }

        await db.delete(workItemsTable).where(
            and(
                eq(workItemsTable.id, id),
                eq(workItemsTable.userId, session.user.id)
            )
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("DELETE /api/work Error:", error);
        return NextResponse.json({ error: error.message || "Failed to delete work item" }, { status: 500 });
    }
}
