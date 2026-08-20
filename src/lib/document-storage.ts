import { db } from "@/lib/db";
import { documentArtifacts } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { testStore } from "@/lib/test-store";
import { isTestStoreActive } from "@/lib/auth-policy";
import crypto from "crypto";

export interface DocumentArtifactRecord {
    id: string;
    userId: string;
    applicationId: string | null;
    resumeVersionId: string | null;
    documentType: "ats_html" | "ats_txt" | "pdf_export";
    contentHash: string;
    content: string;
    storagePath: string | null;
    evidenceLineage: Record<string, string> | null;
    isCanonical: boolean;
    createdAt: Date;
}

/**
 * Stores a canonical document artifact with content hash & lineage mapping.
 */
export async function storeCanonicalDocument(
    userId: string,
    documentType: "ats_html" | "ats_txt" | "pdf_export",
    content: string,
    evidenceLineage?: Record<string, string>,
    applicationId?: string,
    resumeVersionId?: string
): Promise<DocumentArtifactRecord> {
    const contentHash = crypto.createHash("sha256").update(content).digest("hex");
    const id = `doc_${Date.now()}_${contentHash.substring(0, 8)}`;
    const now = new Date();

    const artifact: DocumentArtifactRecord = {
        id,
        userId,
        applicationId: applicationId || null,
        resumeVersionId: resumeVersionId || null,
        documentType,
        contentHash,
        content,
        storagePath: null,
        evidenceLineage: evidenceLineage || null,
        isCanonical: true,
        createdAt: now,
    };

    if (isTestStoreActive()) {
        testStore.documentArtifacts.set(id, artifact);
    } else {
        await db.insert(documentArtifacts).values({
            id,
            userId,
            applicationId: artifact.applicationId,
            resumeVersionId: artifact.resumeVersionId,
            documentType,
            contentHash,
            content,
            evidenceLineage: evidenceLineage ? JSON.stringify(evidenceLineage) : null,
            isCanonical: true,
            createdAt: now,
        });
    }

    return artifact;
}

/**
 * Fetch canonical documents for an application.
 */
export async function getCanonicalDocuments(userId: string, applicationId: string): Promise<DocumentArtifactRecord[]> {
    if (isTestStoreActive()) {
        const docs = Array.from(testStore.documentArtifacts.values())
            .filter(d => d.userId === userId && d.applicationId === applicationId);
        return docs as DocumentArtifactRecord[];
    }

    const docs = await db.query.documentArtifacts.findMany({
        where: and(eq(documentArtifacts.userId, userId), eq(documentArtifacts.applicationId, applicationId)),
    });

    return docs as DocumentArtifactRecord[];
}
