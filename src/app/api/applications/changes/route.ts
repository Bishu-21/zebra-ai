import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { 
    applicationChanges as applicationChangesTable,
    applications as applicationsTable,
    resumes as resumesTable,
    resumeVersions as resumeVersionsTable
} from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";
import { handleApiError } from "@/lib/api-error";
import { z } from "zod";
import crypto from "crypto";
import { requireAuth, getUserOwnedApplication, notFoundResponse } from "@/lib/auth-policy";
import { testStore, type TestApplicationChange, type TestApplication } from "@/lib/test-store";
import { compileTailoredResumeContent } from "@/lib/tailored-resume-compiler";

const createChangeSchema = z.object({
    applicationId: z.string().min(1, "applicationId is required"),
    section: z.string().max(100).default("General"),
    changeType: z.string().max(50).default("modify"),
    originalText: z.string().max(10000).nullable().optional(),
    suggestedText: z.string().min(1, "suggestedText is required").max(10000, "suggestedText exceeds maximum length"),
});

const patchChangeSchema = z.object({
    id: z.string().min(1, "Change ID is required"),
    status: z.enum(["pending", "approved", "rejected"]).optional(),
    userEdits: z.string().max(10000, "userEdits exceeds maximum length").nullable().optional(),
});

export async function GET(req: NextRequest) {
    try {
        const { auth: authCtx, errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

        const { searchParams } = new URL(req.url);
        const applicationId = searchParams.get("applicationId");

        if (!applicationId) {
            return NextResponse.json({ error: "applicationId is required" }, { status: 400 });
        }

        const app = await getUserOwnedApplication(authCtx.user.id, applicationId);
        if (!app) return notFoundResponse("Application");

        if (process.env.NODE_ENV !== "production" && process.env.TEST_AUTH_USER_ID) {
            const changes = Array.from(testStore.applicationChanges.values())
                .filter(c => c.applicationId === applicationId && c.userId === authCtx.user.id);
            return NextResponse.json({ success: true, changes });
        }

        const changes = await db.query.applicationChanges.findMany({
            where: and(
                eq(applicationChangesTable.applicationId, applicationId),
                eq(applicationChangesTable.userId, authCtx.user.id)
            ),
            orderBy: [desc(applicationChangesTable.createdAt)],
        });

        return NextResponse.json({ success: true, changes });
    } catch (error: unknown) {
        return handleApiError(error, "GET /api/applications/changes");
    }
}

export async function POST(req: NextRequest) {
    try {
        const { auth: authCtx, errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

        const body = await req.json();
        const parsed = createChangeSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
        }

        const { applicationId, section, changeType, originalText, suggestedText } = parsed.data;

        // Verify application ownership
        const app = await getUserOwnedApplication(authCtx.user.id, applicationId);
        if (!app) {
            return notFoundResponse("Application");
        }

        const id = crypto.randomUUID();
        const changePayload = {
            id,
            applicationId,
            userId: authCtx.user.id,
            section,
            changeType,
            originalText: originalText || null,
            suggestedText,
            userEdits: null,
            status: "pending" as const,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        if (process.env.NODE_ENV !== "production" && process.env.TEST_AUTH_USER_ID) {
            testStore.applicationChanges.set(id, changePayload);
            return NextResponse.json({ success: true, change: changePayload });
        }

        const [newChange] = await db.insert(applicationChangesTable).values(changePayload).returning();

        return NextResponse.json({ success: true, change: newChange });
    } catch (error: unknown) {
        return handleApiError(error, "POST /api/applications/changes");
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { auth: authCtx, errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

        const body = await req.json();
        const parsed = patchChangeSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
        }

        const { id, status, userEdits } = parsed.data;

        const updateData: Record<string, unknown> = { updatedAt: new Date() };
        if (status) updateData.status = status;
        if (userEdits !== undefined) updateData.userEdits = userEdits;

        let updated: TestApplicationChange;
        if (process.env.NODE_ENV !== "production" && process.env.TEST_AUTH_USER_ID) {
            const existingChange = testStore.applicationChanges.get(id);
            if (!existingChange || existingChange.userId !== authCtx.user.id) {
                return notFoundResponse("Change suggestion");
            }
            updated = { ...existingChange, ...updateData };
            testStore.applicationChanges.set(id, updated);
        } else {
            const [dbUpdated] = await db.update(applicationChangesTable)
                .set(updateData)
                .where(and(eq(applicationChangesTable.id, id), eq(applicationChangesTable.userId, authCtx.user.id)))
                .returning();

            if (!dbUpdated) {
                return notFoundResponse("Change suggestion");
            }
            updated = dbUpdated as TestApplicationChange;
        }

        // AUTO-COMPILE TAILORED RESUME VERSION UPON APPROVAL OR UNDO
        if (status === "approved" || status === "pending" || userEdits !== undefined) {
            let app: TestApplication | undefined;
            if (process.env.NODE_ENV !== "production" && process.env.TEST_AUTH_USER_ID) {
                app = testStore.applications.get(updated.applicationId);
            } else {
                app = await db.query.applications.findFirst({
                    where: and(eq(applicationsTable.id, updated.applicationId), eq(applicationsTable.userId, authCtx.user.id))
                }) as TestApplication | undefined;
            }

            if (app && app.selectedResumeId) {
                let approvedChanges: Array<{ section: string; changeType: string; originalText: string | null; suggestedText: string; userEdits: string | null }>;
                if (process.env.NODE_ENV !== "production" && process.env.TEST_AUTH_USER_ID) {
                    approvedChanges = Array.from(testStore.applicationChanges.values())
                        .filter(c => c.applicationId === app!.id && c.status === "approved")
                        .map(c => ({
                            section: c.section,
                            changeType: c.changeType,
                            originalText: c.originalText ?? null,
                            suggestedText: c.suggestedText,
                            userEdits: c.userEdits ?? null
                        }));
                } else {
                    approvedChanges = await db.query.applicationChanges.findMany({
                        where: and(eq(applicationChangesTable.applicationId, app.id), eq(applicationChangesTable.status, "approved"))
                    });
                }

                let baseResumeContent = "";
                if (process.env.NODE_ENV !== "production" && process.env.TEST_AUTH_USER_ID) {
                    const baseResume = testStore.resumes.get(app.selectedResumeId);
                    if (baseResume) baseResumeContent = baseResume.content || "";
                } else {
                    const baseResume = await db.query.resumes.findFirst({
                        where: and(
                            eq(resumesTable.id, app.selectedResumeId),
                            eq(resumesTable.userId, authCtx.user.id)
                        )
                    });
                    if (baseResume) baseResumeContent = baseResume.content || "";
                }

                const compiledContent = compileTailoredResumeContent(baseResumeContent, approvedChanges);
                const versionTitle = `${app.company} Tailored Version (${new Date().toLocaleDateString()})`;

                if (process.env.NODE_ENV !== "production" && process.env.TEST_AUTH_USER_ID) {
                    if (app.resumeVersionId) {
                        const existingVer = testStore.resumeVersions.get(app.resumeVersionId);
                        if (existingVer) {
                            testStore.resumeVersions.set(app.resumeVersionId, {
                                ...existingVer,
                                title: versionTitle,
                                content: compiledContent,
                                updatedAt: new Date()
                            });
                        }
                    } else if (approvedChanges.length > 0) {
                        const versionId = crypto.randomUUID();
                        testStore.resumeVersions.set(versionId, {
                            id: versionId,
                            userId: authCtx.user.id,
                            resumeId: app.selectedResumeId,
                            title: versionTitle,
                            company: app.company,
                            targetRole: app.position,
                            content: compiledContent,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        });
                        app.resumeVersionId = versionId;
                        app.status = "Preparing";
                        testStore.applications.set(app.id, app);
                    }
                } else {
                    const now = new Date();
                    const changeNotes = approvedChanges.map(c => `${c.section}: ${c.userEdits || c.suggestedText}`).join("\n");

                    if (app.resumeVersionId) {
                        await db.update(resumeVersionsTable)
                            .set({
                                title: versionTitle,
                                company: app.company,
                                targetRole: app.position,
                                content: compiledContent,
                                feedback: { approvedChanges: approvedChanges.length, notes: changeNotes },
                                updatedAt: now,
                            })
                            .where(and(eq(resumeVersionsTable.id, app.resumeVersionId), eq(resumeVersionsTable.userId, authCtx.user.id)));
                    } else if (approvedChanges.length > 0) {
                        const versionId = crypto.randomUUID();
                        await db.insert(resumeVersionsTable).values({
                            id: versionId,
                            userId: authCtx.user.id,
                            resumeId: app.selectedResumeId,
                            title: versionTitle,
                            company: app.company,
                            targetRole: app.position,
                            jobDescription: app.jobDescription || undefined,
                            content: compiledContent,
                            feedback: { approvedChanges: approvedChanges.length, notes: changeNotes },
                            createdAt: now,
                            updatedAt: now,
                        });

                        await db.update(applicationsTable)
                            .set({
                                resumeVersionId: versionId,
                                status: "Preparing",
                                updatedAt: now,
                            })
                            .where(and(eq(applicationsTable.id, app.id), eq(applicationsTable.userId, authCtx.user.id)));
                    }
                }
            }
        }

        return NextResponse.json({ success: true, change: updated });
    } catch (error: unknown) {
        return handleApiError(error, "PATCH /api/applications/changes");
    }
}
