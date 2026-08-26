import { db } from "@/lib/db";
import { evidenceNodes, workItems } from "@/lib/schema";
import { and, desc, eq, inArray, lt, or } from "drizzle-orm";
import { createHash, randomUUID } from "node:crypto";
import { testStore } from "@/lib/test-store";
import { isTestStoreActive } from "@/lib/auth-policy";
import type { PageCursor } from "@/lib/pagination";

export interface CandidateEvidenceInput {
    id?: string;
    workItemId?: string | null;
    companyOrProject: string;
    roleOrContext?: string | null;
    skill: string;
    action: string;
    measurableOutcome?: string | null;
    startDate?: Date | null;
    endDate?: Date | null;
    durationMonths?: number | null;
    proofUrl?: string | null;
    confidence?: "asserted" | "imported" | "externally_checked";
    source?: "work_item" | "manual" | "git" | "resume";
}

export interface CandidateEvidenceNode {
    id: string;
    userId: string;
    workItemId?: string | null;
    companyOrProject: string;
    roleOrContext?: string | null;
    skill: string;
    action: string;
    measurableOutcome?: string | null;
    startDate?: Date | null;
    endDate?: Date | null;
    durationMonths?: number | null;
    proofUrl?: string | null;
    confidence: string;
    source: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Fetch all candidate evidence nodes for a given user.
 */
export async function getCandidateEvidenceGraph(userId: string): Promise<CandidateEvidenceNode[]> {
    if (isTestStoreActive()) {
        const userNodes = Array.from(testStore.evidenceNodes.values()).filter(n => n.userId === userId);
        return userNodes as CandidateEvidenceNode[];
    }

    const records = await db.query.evidenceNodes.findMany({
        where: eq(evidenceNodes.userId, userId),
    });

    return records as CandidateEvidenceNode[];
}

/** Fetch only evidence explicitly selected through user-owned work items. */
export async function getEvidenceForWorkItems(userId: string, workItemIds: string[]): Promise<CandidateEvidenceNode[]> {
    const ids = Array.from(new Set(workItemIds)).slice(0, 50);
    if (ids.length === 0) return [];
    if (isTestStoreActive()) {
        const selected = new Set(ids);
        return Array.from(testStore.evidenceNodes.values())
            .filter((node) => node.userId === userId && Boolean(node.workItemId && selected.has(node.workItemId))) as CandidateEvidenceNode[];
    }
    return await db.query.evidenceNodes.findMany({
        where: and(eq(evidenceNodes.userId, userId), inArray(evidenceNodes.workItemId, ids)),
    }) as CandidateEvidenceNode[];
}

export async function getCandidateEvidencePage(userId: string, limit: number, cursor: PageCursor | null) {
    if (isTestStoreActive()) {
        return Array.from(testStore.evidenceNodes.values())
            .filter(node => node.userId === userId)
            .filter(node => !cursor || node.updatedAt < cursor.timestamp || (node.updatedAt.getTime() === cursor.timestamp.getTime() && node.id < cursor.id))
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime() || b.id.localeCompare(a.id))
            .slice(0, limit + 1) as CandidateEvidenceNode[];
    }
    const cursorCondition = cursor ? or(
        lt(evidenceNodes.updatedAt, cursor.timestamp),
        and(eq(evidenceNodes.updatedAt, cursor.timestamp), lt(evidenceNodes.id, cursor.id)),
    ) : undefined;
    return await db.select().from(evidenceNodes)
        .where(and(eq(evidenceNodes.userId, userId), cursorCondition))
        .orderBy(desc(evidenceNodes.updatedAt), desc(evidenceNodes.id))
        .limit(limit + 1) as CandidateEvidenceNode[];
}

/**
 * Add or update an evidence node in the user's evidence graph.
 * Ensures that action and skill are provided.
 */
export async function upsertEvidenceNode(
    userId: string,
    input: CandidateEvidenceInput
): Promise<CandidateEvidenceNode> {
    if (!input.skill || input.skill.trim().length === 0) {
        throw new Error("Evidence node requires a valid skill.");
    }
    if (!input.action || input.action.trim().length === 0) {
        throw new Error("Evidence node requires a descriptive action.");
    }

    if (input.workItemId) {
        const ownedWorkItem = isTestStoreActive()
            ? testStore.workItems.get(input.workItemId)?.userId === userId
            : Boolean(await db.query.workItems.findFirst({
                where: and(eq(workItems.id, input.workItemId), eq(workItems.userId, userId)),
                columns: { id: true },
            }));
        if (!ownedWorkItem) throw new Error("Linked work item does not belong to this user.");
    }

    const now = new Date();
    const id = input.id || `ev_${randomUUID()}`;

    const existing = input.id ? (isTestStoreActive()
            ? testStore.evidenceNodes.get(input.id)
            : await db.query.evidenceNodes.findFirst({
                where: eq(evidenceNodes.id, input.id),
            })) : undefined;
    if (existing && existing.userId !== userId) {
        throw new Error("Evidence node not found.");
    }

    const nodeData: CandidateEvidenceNode = {
        id,
        userId,
        workItemId: input.workItemId || null,
        companyOrProject: input.companyOrProject.trim(),
        roleOrContext: input.roleOrContext ? input.roleOrContext.trim() : null,
        skill: input.skill.trim(),
        action: input.action.trim(),
        measurableOutcome: input.measurableOutcome ? input.measurableOutcome.trim() : null,
        startDate: input.startDate || null,
        endDate: input.endDate || null,
        durationMonths: input.durationMonths || null,
        proofUrl: input.proofUrl ? input.proofUrl.trim() : null,
        confidence: input.confidence || "asserted",
        source: input.source || "manual",
        createdAt: now,
        updatedAt: now,
    };

    if (isTestStoreActive()) {
        testStore.evidenceNodes.set(id, nodeData);
        return nodeData;
    }

    if (!existing) {
        await db.insert(evidenceNodes).values({
            ...nodeData,
            createdAt: now,
            updatedAt: now,
        });
    } else {
        await db.update(evidenceNodes)
            .set({
                companyOrProject: nodeData.companyOrProject,
                roleOrContext: nodeData.roleOrContext,
                skill: nodeData.skill,
                action: nodeData.action,
                measurableOutcome: nodeData.measurableOutcome,
                startDate: nodeData.startDate,
                endDate: nodeData.endDate,
                durationMonths: nodeData.durationMonths,
                proofUrl: nodeData.proofUrl,
                confidence: nodeData.confidence,
                source: nodeData.source,
                updatedAt: now,
            })
            .where(and(eq(evidenceNodes.id, id), eq(evidenceNodes.userId, userId)));
    }

    return nodeData;
}

/**
 * Automatically sync work items into candidate evidence nodes.
 */
export async function syncWorkItemsToEvidenceGraph(userId: string, items: Array<{
    id: string;
    title: string;
    description?: string | null;
    tools?: string[] | null;
    result?: string | null;
    proofUrl?: string | null;
}>): Promise<CandidateEvidenceNode[]> {
    const createdNodes: CandidateEvidenceNode[] = [];

    for (const item of items) {
        // An absent source description is unknown, not evidence. Do not fabricate it.
        if (!item.description?.trim()) continue;
        const skills = item.tools && item.tools.length > 0 ? item.tools : ["General Engineering"];
        for (const skill of skills) {
            const deterministicId = `ev_work_${createHash("sha256")
                .update(`${userId}\0${item.id}\0${skill.trim().toLowerCase()}`)
                .digest("hex")
                .slice(0, 32)}`;
            const node = await upsertEvidenceNode(userId, {
                id: deterministicId,
                workItemId: item.id,
                companyOrProject: item.title,
                skill: skill,
                action: item.description,
                measurableOutcome: item.result || null,
                proofUrl: item.proofUrl || null,
                confidence: "asserted",
                source: "work_item",
            });
            createdNodes.push(node);
        }
    }

    return createdNodes;
}
