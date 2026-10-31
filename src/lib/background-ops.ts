import { db } from "@/lib/db";
import { backgroundJobs, user } from "@/lib/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
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
    operationType: "job_extraction" | "evidence_mapping" | "tailored_compilation" | "preflight_validation" | "resume_audit",
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
 * Claim a pending job for processing. Returns true only for the winner so a
 * Kafka worker and the in-request runner cannot both execute the audit.
 */
export async function claimProcessingBackgroundJob(
    userId: string,
    jobId: string,
): Promise<boolean> {
    const now = new Date();

    if (isTestStoreActive()) {
        const existing = testStore.backgroundJobs.get(jobId);
        if (!existing || existing.userId !== userId || existing.status !== "pending") {
            return false;
        }
        testStore.backgroundJobs.set(jobId, {
            ...existing,
            status: "processing",
            progressPercent: 10,
            startedAt: existing.startedAt ?? now,
            updatedAt: now,
        });
        return true;
    }

    const [updated] = await db.update(backgroundJobs)
        .set({
            status: "processing",
            progressPercent: 10,
            startedAt: now,
            updatedAt: now,
        })
        .where(and(
            eq(backgroundJobs.id, jobId),
            eq(backgroundJobs.userId, userId),
            eq(backgroundJobs.status, "pending"),
        ))
        .returning({ id: backgroundJobs.id });

    return Boolean(updated);
}

/**
 * Mark a still-pending job failed. Returns true only if this caller won the
 * pending → failed race, so a credit refund can run once.
 */
export async function failPendingBackgroundJob(
    userId: string,
    jobId: string,
    errorMessage: string,
): Promise<boolean> {
    const now = new Date();

    if (isTestStoreActive()) {
        const existing = testStore.backgroundJobs.get(jobId);
        if (!existing || existing.userId !== userId || existing.status !== "pending") {
            return false;
        }
        testStore.backgroundJobs.set(jobId, {
            ...existing,
            status: "failed",
            errorMessage,
            completedAt: now,
            updatedAt: now,
        });
        return true;
    }

    const [updated] = await db.update(backgroundJobs)
        .set({
            status: "failed",
            errorMessage,
            completedAt: now,
            updatedAt: now,
        })
        .where(and(
            eq(backgroundJobs.id, jobId),
            eq(backgroundJobs.userId, userId),
            eq(backgroundJobs.status, "pending"),
        ))
        .returning({ id: backgroundJobs.id });

    return Boolean(updated);
}

/**
 * Finish a job only if it is still processing. Returns false when the job was
 * abandoned, failed, or completed by another runner.
 */
export async function completeProcessingBackgroundJob(
    userId: string,
    jobId: string,
    result: unknown,
): Promise<boolean> {
    const now = new Date();

    if (isTestStoreActive()) {
        const existing = testStore.backgroundJobs.get(jobId);
        if (!existing || existing.userId !== userId || existing.status !== "processing") {
            return false;
        }
        testStore.backgroundJobs.set(jobId, {
            ...existing,
            status: "completed",
            progressPercent: 100,
            result,
            completedAt: now,
            updatedAt: now,
        });
        return true;
    }

    const [updated] = await db.update(backgroundJobs)
        .set({
            status: "completed",
            progressPercent: 100,
            result,
            completedAt: now,
            updatedAt: now,
        })
        .where(and(
            eq(backgroundJobs.id, jobId),
            eq(backgroundJobs.userId, userId),
            eq(backgroundJobs.status, "processing"),
        ))
        .returning({ id: backgroundJobs.id });

    return Boolean(updated);
}

/**
 * Fail a pending or processing job once. The winner refunds the reserved credit.
 */
export async function failOpenBackgroundJob(
    userId: string,
    jobId: string,
    errorMessage: string,
): Promise<boolean> {
    const now = new Date();

    if (isTestStoreActive()) {
        const existing = testStore.backgroundJobs.get(jobId);
        if (
            !existing
            || existing.userId !== userId
            || (existing.status !== "pending" && existing.status !== "processing")
        ) {
            return false;
        }
        testStore.backgroundJobs.set(jobId, {
            ...existing,
            status: "failed",
            errorMessage,
            completedAt: now,
            updatedAt: now,
        });
        return true;
    }

    const [updated] = await db.update(backgroundJobs)
        .set({
            status: "failed",
            errorMessage,
            completedAt: now,
            updatedAt: now,
        })
        .where(and(
            eq(backgroundJobs.id, jobId),
            eq(backgroundJobs.userId, userId),
            inArray(backgroundJobs.status, ["pending", "processing"]),
        ))
        .returning({ id: backgroundJobs.id });

    return Boolean(updated);
}

/**
 * Fetch status of a background job.
 */
/** Failure and its credit return commit together, or neither commits. */
export async function failResumeAuditAndRefund(userId: string, jobId: string, errorMessage: string, pendingOnly = false): Promise<boolean> {
    if (isTestStoreActive()) {
        const job = testStore.backgroundJobs.get(jobId);
        if (!job || job.userId !== userId || job.operationType !== "resume_audit") return false;
        const claimed = pendingOnly
            ? await failPendingBackgroundJob(userId, jobId, errorMessage)
            : await failOpenBackgroundJob(userId, jobId, errorMessage);
        if (claimed) {
            testStore.credits.set(userId, (testStore.credits.get(userId) ?? 0) + 1);
            testStore.creditRefunds.set(userId, (testStore.creditRefunds.get(userId) ?? 0) + 1);
        }
        return claimed;
    }
    return db.transaction(async (tx) => {
        const now = new Date();
        const [claimed] = await tx.update(backgroundJobs)
            .set({ status: "failed", errorMessage, completedAt: now, updatedAt: now })
            .where(and(eq(backgroundJobs.id, jobId), eq(backgroundJobs.userId, userId),
                eq(backgroundJobs.operationType, "resume_audit"),
                inArray(backgroundJobs.status, pendingOnly ? ["pending"] : ["pending", "processing"])))
            .returning({ id: backgroundJobs.id });
        if (!claimed) return false;
        const [refunded] = await tx.update(user).set({ credits: sql`${user.credits} + 1`, updatedAt: now })
            .where(eq(user.id, userId)).returning({ id: user.id });
        if (!refunded) throw new Error("Refund recipient not found");
        return true;
    });
}

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
