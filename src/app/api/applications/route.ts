import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { applications as applicationsTable } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

const createApplicationSchema = z.object({
    company: z.string().min(1, "Company is required"),
    position: z.string().min(1, "Position is required"),
    jobDescription: z.string().optional(),
    url: z.string().url().or(z.literal("")).optional(),
    selectedResumeId: z.string().optional(),
    selectedWorkIds: z.array(z.string()).optional(),
    selectedCertIds: z.array(z.string()).optional(),
    deadline: z.string().optional(),
    notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const apps = await db.query.applications.findMany({
            where: eq(applicationsTable.userId, session.user.id),
            orderBy: [desc(applicationsTable.createdAt)],
            with: {
                selectedResume: true,
                changes: true,
            }
        });

        return NextResponse.json({ applications: apps });
    } catch (error: any) {
        console.error("GET /api/applications Error:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch applications" }, { status: 500 });
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
        const parsed = createApplicationSchema.parse(body);

        const id = `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const now = new Date();

        const [newApp] = await db.insert(applicationsTable).values({
            id,
            userId: session.user.id,
            company: parsed.company,
            position: parsed.position,
            jobDescription: parsed.jobDescription || null,
            url: parsed.url || null,
            status: "Draft",
            selectedResumeId: parsed.selectedResumeId || null,
            selectedWorkIds: parsed.selectedWorkIds || [],
            selectedCertIds: parsed.selectedCertIds || [],
            deadline: parsed.deadline ? new Date(parsed.deadline) : null,
            notes: parsed.notes || null,
            createdAt: now,
            updatedAt: now,
        }).returning();

        return NextResponse.json({ application: newApp });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues?.[0]?.message || "Validation failed" }, { status: 400 });
        }
        console.error("POST /api/applications Error:", error);
        return NextResponse.json({ error: error.message || "Failed to create application" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { id, status, notes, outcome, resumeVersionId } = body;

        if (!id) {
            return NextResponse.json({ error: "Application ID required" }, { status: 400 });
        }

        const updateData: Record<string, any> = { updatedAt: new Date() };
        if (status) updateData.status = status;
        if (notes !== undefined) updateData.notes = notes;
        if (outcome !== undefined) updateData.outcome = outcome;
        if (resumeVersionId !== undefined) updateData.resumeVersionId = resumeVersionId;

        const [updated] = await db.update(applicationsTable)
            .set(updateData)
            .where(and(eq(applicationsTable.id, id), eq(applicationsTable.userId, session.user.id)))
            .returning();

        return NextResponse.json({ application: updated });
    } catch (error: any) {
        console.error("PATCH /api/applications Error:", error);
        return NextResponse.json({ error: error.message || "Failed to update application" }, { status: 500 });
    }
}
