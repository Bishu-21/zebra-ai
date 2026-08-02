import { NextResponse } from "next/server";
import { getSafeSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { 
    resumes as resumesTable,
    applications as applicationsTable,
    resumeVersions as resumeVersionsTable,
    workItems as workItemsTable,
    certifications as certificationsTable
} from "@/lib/schema";
import { eq, and, inArray } from "drizzle-orm";
import { testStore } from "@/lib/test-store";

export function unauthorizedResponse() {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function notFoundResponse(resourceName: string = "Resource") {
    return NextResponse.json({ error: `${resourceName} not found` }, { status: 404 });
}

export interface AuthContext {
    session: NonNullable<Awaited<ReturnType<typeof getSafeSession>>>;
    user: NonNullable<Awaited<ReturnType<typeof getSafeSession>>>["user"];
}

/**
 * Require an authenticated user session.
 * Uses getSafeSession() to handle transient Neon serverless connection resets cleanly.
 */
export async function requireAuth(): Promise<
    { auth: AuthContext; errorResponse: null } | { auth: null; errorResponse: NextResponse }
> {
    const session = await getSafeSession();
    if (!session || !session.user) {
        return { auth: null, errorResponse: unauthorizedResponse() };
    }
    return { auth: { session, user: session.user }, errorResponse: null };
}

/**
 * Check whether test store mock policies are active (disabled in production).
 */
export function isTestStoreActive(): boolean {
    return process.env.NODE_ENV !== "production" && Boolean(process.env.TEST_AUTH_USER_ID);
}

/**
 * Get a user-owned resume record. Returns null if not found or owned by another user.
 */
export async function getUserOwnedResume(userId: string, resumeId: string) {
    if (!resumeId || !userId) return null;
    if (process.env.NODE_ENV !== "production" && process.env.TEST_AUTH_USER_ID) {
        const res = testStore.resumes.get(resumeId);
        return (res && res.userId === userId) ? res : null;
    }
    return await db.query.resumes.findFirst({
        where: and(eq(resumesTable.id, resumeId), eq(resumesTable.userId, userId)),
    });
}

/**
 * Get a user-owned job application record. Returns null if not found or owned by another user.
 */
export async function getUserOwnedApplication(userId: string, applicationId: string) {
    if (!applicationId || !userId) return null;
    if (process.env.NODE_ENV !== "production" && process.env.TEST_AUTH_USER_ID) {
        const app = testStore.applications.get(applicationId);
        if (!app || app.userId !== userId) return null;
        const selectedResume = app.selectedResumeId ? testStore.resumes.get(app.selectedResumeId) : null;
        const resumeVersion = app.resumeVersionId ? testStore.resumeVersions.get(app.resumeVersionId) : null;
        const changes = Array.from(testStore.applicationChanges.values()).filter(c => c.applicationId === app.id);
        return { ...app, selectedResume, resumeVersion, changes };
    }
    return await db.query.applications.findFirst({
        where: and(eq(applicationsTable.id, applicationId), eq(applicationsTable.userId, userId)),
        with: {
            selectedResume: true,
            resumeVersion: true,
            changes: true,
        }
    });
}

/**
 * Get a user-owned resume version record. Returns null if not found or owned by another user.
 */
export async function getUserOwnedResumeVersion(userId: string, versionId: string) {
    if (!versionId || !userId) return null;
    if (process.env.NODE_ENV !== "production" && process.env.TEST_AUTH_USER_ID) {
        const ver = testStore.resumeVersions.get(versionId);
        return (ver && ver.userId === userId) ? ver : null;
    }
    return await db.query.resumeVersions.findFirst({
        where: and(eq(resumeVersionsTable.id, versionId), eq(resumeVersionsTable.userId, userId)),
    });
}

/**
 * Validate that all provided work IDs belong to the authenticated user.
 */
export async function validateSelectedWorkIds(userId: string, workIds?: string[] | null): Promise<boolean> {
    if (!workIds || workIds.length === 0) return true;
    if (process.env.NODE_ENV !== "production" && process.env.TEST_AUTH_USER_ID) {
        return workIds.every(id => {
            const item = testStore.workItems.get(id);
            return item && item.userId === userId;
        });
    }
    const items = await db.query.workItems.findMany({
        where: and(eq(workItemsTable.userId, userId), inArray(workItemsTable.id, workIds)),
        columns: { id: true },
    });
    return items.length === workIds.length;
}

/**
 * Validate that all provided certification IDs belong to the authenticated user.
 */
export async function validateSelectedCertIds(userId: string, certIds?: string[] | null): Promise<boolean> {
    if (!certIds || certIds.length === 0) return true;
    if (process.env.NODE_ENV !== "production" && process.env.TEST_AUTH_USER_ID) {
        return certIds.every(id => {
            const cert = testStore.certifications.get(id);
            return cert && cert.userId === userId;
        });
    }
    const certs = await db.query.certifications.findMany({
        where: and(eq(certificationsTable.userId, userId), inArray(certificationsTable.id, certIds)),
        columns: { id: true },
    });
    return certs.length === certIds.length;
}
