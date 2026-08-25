import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
    applications as applicationsTable
} from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";
import { handleApiError } from "@/lib/api-error";
import { z } from "zod";
import {
    requireAuth,
    getUserOwnedApplication,
    getUserOwnedResume,
    getUserOwnedResumeVersion,
    validateSelectedWorkIds,
    validateSelectedCertIds,
    notFoundResponse
} from "@/lib/auth-policy";
import { validateStatusTransition, ApplicationStatus } from "@/lib/application-state-machine";
import { testStore, type TestApplication } from "@/lib/test-store";

const createApplicationSchema = z.object({
    company: z.string().min(1, "Company is required"),
    position: z.string().min(1, "Position is required"),
    status: z.string().optional().default("Draft"),
    jobDescription: z.string().optional(),
    url: z.url().or(z.literal("")).optional(),
    selectedResumeId: z.string().optional(),
    selectedWorkIds: z.array(z.string()).optional(),
    selectedCertIds: z.array(z.string()).optional(),
    deadline: z.string().optional(),
    notes: z.string().optional(),
});

async function validateLinkedResourcesOwnership({
    userId,
    selectedResumeId,
    resumeVersionId,
    selectedWorkIds,
    selectedCertIds,
}: {
    userId: string;
    selectedResumeId?: string | null;
    resumeVersionId?: string | null;
    selectedWorkIds?: string[] | null;
    selectedCertIds?: string[] | null;
}) {
    if (selectedResumeId) {
        const res = await getUserOwnedResume(userId, selectedResumeId);
        if (!res) return "Selected resume not found";
    }

    if (resumeVersionId) {
        const ver = await getUserOwnedResumeVersion(userId, resumeVersionId);
        if (!ver) return "Selected resume version not found";
    }

    if (selectedWorkIds && selectedWorkIds.length > 0) {
        const valid = await validateSelectedWorkIds(userId, selectedWorkIds);
        if (!valid) return "One or more selected work items not found";
    }

    if (selectedCertIds && selectedCertIds.length > 0) {
        const valid = await validateSelectedCertIds(userId, selectedCertIds);
        if (!valid) return "One or more selected certifications not found";
    }

    return null;
}

export async function GET(req: NextRequest) {
    try {
        const { auth: authCtx, errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (id) {
            const app = await getUserOwnedApplication(authCtx.user.id, id);
            if (!app) return notFoundResponse("Application");
            return NextResponse.json({ application: app });
        }

        if (process.env.NODE_ENV !== "production" && process.env.TEST_AUTH_USER_ID) {
            const userApps = Array.from(testStore.applications.values()).filter(a => a.userId === authCtx.user.id);
            return NextResponse.json({ applications: userApps });
        }

        const apps = await db.query.applications.findMany({
            where: eq(applicationsTable.userId, authCtx.user.id),
            orderBy: [desc(applicationsTable.createdAt)],
            with: {
                selectedResume: true,
                resumeVersion: true,
                changes: true,
            }
        });

        return NextResponse.json({ applications: apps });
    } catch (error: unknown) {
        return handleApiError(error, "GET /api/applications");
    }
}

export async function POST(req: NextRequest) {
    try {
        const { auth: authCtx, errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

        const body = await req.json();
        const parsed = createApplicationSchema.parse(body);

        const ownershipError = await validateLinkedResourcesOwnership({
            userId: authCtx.user.id,
            selectedResumeId: parsed.selectedResumeId,
            selectedWorkIds: parsed.selectedWorkIds,
            selectedCertIds: parsed.selectedCertIds,
        });
        if (ownershipError) {
            return NextResponse.json({ error: ownershipError }, { status: 404 });
        }

        // Validate state transition on creation
        const transitionCheck = validateStatusTransition(null, parsed.status, {
            company: parsed.company,
            position: parsed.position,
            selectedResumeId: parsed.selectedResumeId,
        });
        if (!transitionCheck.valid) {
            return NextResponse.json({ error: transitionCheck.error }, { status: 400 });
        }

        const id = `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const now = new Date();

        const applicationPayload = {
            id,
            userId: authCtx.user.id,
            company: parsed.company,
            position: parsed.position,
            jobDescription: parsed.jobDescription || null,
            url: parsed.url || null,
            status: parsed.status as ApplicationStatus,
            selectedResumeId: parsed.selectedResumeId || null,
            selectedWorkIds: parsed.selectedWorkIds || [],
            selectedCertIds: parsed.selectedCertIds || [],
            deadline: parsed.deadline ? new Date(parsed.deadline) : null,
            notes: parsed.notes || null,
            createdAt: now,
            updatedAt: now,
        };

        if (process.env.NODE_ENV !== "production" && process.env.TEST_AUTH_USER_ID) {
            testStore.applications.set(id, applicationPayload);
            return NextResponse.json({ application: applicationPayload });
        }

        const [newApp] = await db.insert(applicationsTable).values(applicationPayload).returning();

        return NextResponse.json({ application: newApp });
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues?.[0]?.message || "Validation failed" }, { status: 400 });
        }
        return handleApiError(error, "POST /api/applications");
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { auth: authCtx, errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

        const body = await req.json();
        const { id, status, company, position, jobDescription, url, selectedResumeId, selectedWorkIds, selectedCertIds, resumeVersionId, deadline, notes, outcome } = body;

        if (!id) {
            return NextResponse.json({ error: "Application ID required" }, { status: 400 });
        }

        const existingApp = await getUserOwnedApplication(authCtx.user.id, id);
        if (!existingApp) {
            return notFoundResponse("Application");
        }

        const ownershipError = await validateLinkedResourcesOwnership({
            userId: authCtx.user.id,
            selectedResumeId,
            resumeVersionId,
            selectedWorkIds,
            selectedCertIds,
        });
        if (ownershipError) {
            return NextResponse.json({ error: ownershipError }, { status: 404 });
        }

        // State Machine transition validation
        if (status !== undefined) {
            const combinedData = {
                company: company !== undefined ? company : existingApp.company,
                position: position !== undefined ? position : existingApp.position,
                selectedResumeId: selectedResumeId !== undefined ? selectedResumeId : existingApp.selectedResumeId,
                resumeVersionId: resumeVersionId !== undefined ? resumeVersionId : existingApp.resumeVersionId,
            };

            const transitionCheck = validateStatusTransition(
                existingApp.status as ApplicationStatus,
                status,
                combinedData
            );

            if (!transitionCheck.valid) {
                return NextResponse.json({ error: transitionCheck.error }, { status: 400 });
            }
        }

        const now = new Date();
        const updateData: Record<string, unknown> = { updatedAt: now };

        if (status !== undefined) updateData.status = status;
        if (company !== undefined) updateData.company = company;
        if (position !== undefined) updateData.position = position;
        if (jobDescription !== undefined) updateData.jobDescription = jobDescription;
        if (url !== undefined) updateData.url = url;
        if (selectedResumeId !== undefined) updateData.selectedResumeId = selectedResumeId;
        if (selectedWorkIds !== undefined) updateData.selectedWorkIds = selectedWorkIds;
        if (selectedCertIds !== undefined) updateData.selectedCertIds = selectedCertIds;
        if (resumeVersionId !== undefined) updateData.resumeVersionId = resumeVersionId;
        if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;
        if (outcome !== undefined) updateData.outcome = outcome;

        if (notes !== undefined) {
            updateData.notes = notes;
        } else if (status !== undefined && status !== existingApp.status) {
            // Append timestamp audit note for status transitions
            const auditEntry = `[${now.toISOString()}] Status updated: ${existingApp.status} -> ${status}`;
            updateData.notes = existingApp.notes ? `${existingApp.notes}\n${auditEntry}` : auditEntry;
        }

        if (process.env.NODE_ENV !== "production" && process.env.TEST_AUTH_USER_ID) {
            const updatedApp = { ...existingApp, ...updateData };
            testStore.applications.set(id, updatedApp as unknown as TestApplication);
            return NextResponse.json({ success: true, application: updatedApp });
        }

        const [updated] = await db.update(applicationsTable)
            .set(updateData)
            .where(and(eq(applicationsTable.id, id), eq(applicationsTable.userId, authCtx.user.id)))
            .returning();

        if (!updated) {
            return notFoundResponse("Application");
        }

        return NextResponse.json({ success: true, application: updated });
    } catch (error: unknown) {
        return handleApiError(error, "PATCH /api/applications");
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { auth: authCtx, errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

        const { searchParams } = new URL(req.url);
        let id = searchParams.get("id");

        if (!id) {
            try {
                const body = await req.json();
                id = body.id;
            } catch {
                // fallthrough
            }
        }

        if (!id) {
            return NextResponse.json({ error: "Application ID required" }, { status: 400 });
        }

        if (process.env.NODE_ENV !== "production" && process.env.TEST_AUTH_USER_ID) {
            const app = testStore.applications.get(id);
            if (!app || app.userId !== authCtx.user.id) {
                return notFoundResponse("Application");
            }
            testStore.applications.delete(id);
            return NextResponse.json({ success: true, id });
        }

        const [deleted] = await db.delete(applicationsTable)
            .where(and(eq(applicationsTable.id, id), eq(applicationsTable.userId, authCtx.user.id)))
            .returning();

        if (!deleted) {
            return notFoundResponse("Application");
        }

        return NextResponse.json({ success: true, id: deleted.id });
    } catch (error: unknown) {
        return handleApiError(error, "DELETE /api/applications");
    }
}
