import "server-only";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { linkedinAudits } from "@/lib/schema";
import { updateLinkedInDraftDecision, type LinkedInDraft } from "@/lib/linkedin-workflow";

async function scoped<T>(userId: string, operation: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<T>): Promise<T> {
  if (!userId) throw new Error("User scope is required.");
  return db.transaction(async tx => {
    await tx.execute(sql`SELECT set_config('app.user_id', ${userId}, true)`);
    return operation(tx);
  });
}

export interface CreateLinkedInAuditRecord {
  id: string;
  userId: string;
  score: number | null;
  feedback: unknown;
  linkedinUrl: string | null;
  sourceText: string;
  targetRole: string | null;
}

export function createLinkedInAuditRecord(record: CreateLinkedInAuditRecord) {
  return scoped(record.userId, tx => tx.insert(linkedinAudits).values({ ...record, createdAt: new Date(), updatedAt: new Date() }));
}

export function getLatestLinkedInAudit(userId: string) {
  return scoped(userId, async tx => {
    const [record] = await tx.select({ id: linkedinAudits.id, feedback: linkedinAudits.feedback, drafts: linkedinAudits.drafts, linkedinUrl: linkedinAudits.linkedinUrl, targetRole: linkedinAudits.targetRole })
      .from(linkedinAudits).where(eq(linkedinAudits.userId, userId)).orderBy(desc(linkedinAudits.createdAt)).limit(1);
    return record || null;
  });
}

export function getLinkedInAudit(userId: string, auditId: string) {
  return scoped(userId, async tx => {
    const [record] = await tx.select().from(linkedinAudits)
      .where(and(eq(linkedinAudits.userId, userId), eq(linkedinAudits.id, auditId))).limit(1);
    return record || null;
  });
}

export function saveLinkedInDrafts(userId: string, auditId: string, drafts: LinkedInDraft[]) {
  return scoped(userId, async tx => {
    const [updated] = await tx.update(linkedinAudits).set({ drafts, updatedAt: new Date() })
      .where(and(eq(linkedinAudits.userId, userId), eq(linkedinAudits.id, auditId), isNull(linkedinAudits.drafts)))
      .returning({ drafts: linkedinAudits.drafts });
    return updated?.drafts as LinkedInDraft[] | undefined;
  });
}

export function decideLinkedInDraft(userId: string, auditId: string, draftId: string, status: "accepted" | "dismissed", editedText?: string) {
  return scoped(userId, async tx => {
    const [record] = await tx.select({ drafts: linkedinAudits.drafts, sourceText: linkedinAudits.sourceText })
      .from(linkedinAudits).where(and(eq(linkedinAudits.userId, userId), eq(linkedinAudits.id, auditId))).for("update").limit(1);
    if (!record || !record.sourceText || !Array.isArray(record.drafts)) return null;
    const drafts = updateLinkedInDraftDecision(record.drafts as LinkedInDraft[], draftId, status, editedText, record.sourceText);
    await tx.update(linkedinAudits).set({ drafts, updatedAt: new Date() })
      .where(and(eq(linkedinAudits.userId, userId), eq(linkedinAudits.id, auditId)));
    return drafts;
  });
}
