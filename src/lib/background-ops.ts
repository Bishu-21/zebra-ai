import { db } from "@/lib/db";
import { backgroundJobs } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { testStore } from "@/lib/test-store";
import { isTestStoreActive } from "@/lib/auth-policy";

export interface BackgroundJobRecord {
    id: string;
    userId: string;
    applicationId: string | null;
    operationType: string;
    status: "pending" | "processing" | "completed" | "failed";
    progressPercent: number;
    payload: unknown;
    result: unknown;
    errorMessage: string | null;
    startedAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Dispatch a durable background operation.
 */
export async function dispatchBackgroundJob(
    userId: string,
    operationType: "job_extraction" | "evidence_mapping" | "tailored_compilation" | "preflight_validation",
    payload: unknown,
    applicationId?: string
): Promise<BackgroundJobRecord> {
    const id = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();

    const record: BackgroundJobRecord = {
        id,
        userId,
        applicationId: applicationId || null,
        operationType,
        status: "pending",
        progressPercent: 0,
        payload,
        result: null,
        errorMessage: null,
        startedAt: null,
        completedAt: null,
        createdAt: now,
        updatedAt: now,
    };

    if (isTestStoreActive()) {
        testStore.backgroundJobs.set(id, record);
    } else {
        await db.insert(backgroundJobs).values({
            id,
            userId,
            applicationId: record.applicationId,
            operationType,
            status: "pending",
            progressPercent: 0,
            payload,
            createdAt: now,
            updatedAt: now,
        });
    }

    return record;
}

/**
 * Update background operation progress or completion.
 */
export async function updateBackgroundJobStatus(
    userId: string,
    jobId: string,
    status: "pending" | "processing" | "completed" | "failed",
    progressPercent: number,
    result?: unknown,
    errorMessage?: string
): Promise<void> {
    const now = new Date();
    const updates: Partial<BackgroundJobRecord> = {
        status,
        progressPercent,
        updatedAt: now,
    };

    if (status === "processing" && !updates.startedAt) {
        updates.startedAt = now;
    }
    if (status === "completed" || status === "failed") {
        updates.completedAt = now;
    }
    if (result !== undefined) updates.result = result;
    if (errorMessage !== undefined) updates.errorMessage = errorMessage;

    if (isTestStoreActive()) {
        const existing = testStore.backgroundJobs.get(jobId);
        if (existing?.userId === userId) {
            testStore.backgroundJobs.set(jobId, { ...existing, ...updates });
        }
    } else {
        await db.update(backgroundJobs)
            .set({
                status,
                progressPercent,
                result: result ?? undefined,
                errorMessage: errorMessage || null,
                updatedAt: now,
                startedAt: status === "processing" ? now : undefined,
                completedAt: (status === "completed" || status === "failed") ? now : undefined,
            })
            .where(and(eq(backgroundJobs.id, jobId), eq(backgroundJobs.userId, userId)));
    }
}

/**
 * Fetch status of a background job.
 */
export async function getBackgroundJob(userId: string, jobId: string): Promise<BackgroundJobRecord | null> {
    if (isTestStoreActive()) {
        const job = testStore.backgroundJobs.get(jobId);
        return (job && job.userId === userId) ? job as BackgroundJobRecord : null;
    }

    const job = await db.query.backgroundJobs.findFirst({
        where: and(eq(backgroundJobs.id, jobId), eq(backgroundJobs.userId, userId)),
    });

    return job as BackgroundJobRecord | null;
}
