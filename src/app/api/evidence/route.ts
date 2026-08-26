import { NextResponse } from "next/server";
import { withRequestPolicy } from "@/lib/request-policy";
import { getCandidateEvidencePage, upsertEvidenceNode } from "@/lib/evidence-graph";
import { z } from "zod";
import { paginateRows, parsePagination } from "@/lib/pagination";

export const GET = withRequestPolicy(
    { requireAuth: true },
    async (req, ctx) => {
        const userId = ctx.auth!.user.id;
        const { limit, cursor } = parsePagination(req);
        const evidenceGraph = await getCandidateEvidencePage(userId, limit, cursor);
        const page = paginateRows(evidenceGraph, limit, node => ({ id: node.id, timestamp: node.updatedAt }));
        return NextResponse.json({ evidence: page.items, page: page.page });
    }
);

const upsertSchema = z.object({
    workItemId: z.string().nullable().optional(),
    companyOrProject: z.string().min(1, "Company or Project name is required"),
    roleOrContext: z.string().nullable().optional(),
    skill: z.string().min(1, "Skill name is required"),
    action: z.string().min(1, "Action description is required"),
    measurableOutcome: z.string().nullable().optional(),
    proofUrl: z.string().nullable().optional(),
});

export const POST = withRequestPolicy(
    { requireAuth: true, bodySchema: upsertSchema },
    async (req, ctx) => {
        const userId = ctx.auth!.user.id;
        const node = await upsertEvidenceNode(userId, ctx.body);
        return NextResponse.json({ evidenceNode: node });
    }
);
