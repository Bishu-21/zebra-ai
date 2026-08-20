import { db } from "@/lib/db";
import { evidenceNodes } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { testStore } from "@/lib/test-store";
import { isTestStoreActive } from "@/lib/auth-policy";

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
    confidence?: "verified" | "asserted" | "imported";
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

    const now = new Date();
    const id = input.id || `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

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

    await db.insert(evidenceNodes)
        .values({
            ...nodeData,
            createdAt: now,
            updatedAt: now,
        })
        .onConflictDoUpdate({
            target: evidenceNodes.id,
            set: {
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
            },
        });

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
        const skills = item.tools && item.tools.length > 0 ? item.tools : ["General Engineering"];
        for (const skill of skills) {
            const node = await upsertEvidenceNode(userId, {
                workItemId: item.id,
                companyOrProject: item.title,
                skill: skill,
                action: item.description || `Developed project using ${skill}`,
                measurableOutcome: item.result || null,
                proofUrl: item.proofUrl || null,
                confidence: item.proofUrl ? "verified" : "asserted",
                source: "work_item",
            });
            createdNodes.push(node);
        }
    }

    return createdNodes;
}
