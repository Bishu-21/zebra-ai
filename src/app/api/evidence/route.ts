import { NextResponse } from "next/server";
import { withRequestPolicy } from "@/lib/request-policy";
import { getCandidateEvidenceGraph, upsertEvidenceNode } from "@/lib/evidence-graph";
import { z } from "zod";

export const GET = withRequestPolicy(
    { requireAuth: true },
    async (req, ctx) => {
        const userId = ctx.auth!.user.id;
        const evidenceGraph = await getCandidateEvidenceGraph(userId);
        return NextResponse.json({ evidence: evidenceGraph });
    }
);

const upsertSchema = z.object({
    id: z.string().optional(),
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
