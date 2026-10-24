import { NextResponse } from "next/server";
import { z } from "zod";
import { withRequestPolicy } from "@/lib/request-policy";
import { checkDistributedRateLimit } from "@/lib/rate-limit";
import { evidenceFromRepository, toAcceptResponse, type Authorship } from "@/lib/github-app";
import { loadRepositoriesForAccept } from "@/lib/github-install-store";
import { upsertEvidenceNode } from "@/lib/evidence-graph";

const bodySchema = z.object({
    repoIds: z.array(z.string().regex(/^\d{1,20}$/)).min(1).max(50),
});

const AUTHORSHIP = new Set<Authorship>(["owner", "commit_author", "not_confirmed"]);

export const POST = withRequestPolicy({ requireAuth: true, bodySchema, operationName: "github-accept" }, async (_req, ctx) => {
    const userId = ctx.auth!.user.id;
    const rate = await checkDistributedRateLimit(`github-accept:${userId}`, 20, 60 * 60_000);
    if (!rate.success) return NextResponse.json({ error: "Too many evidence updates. Try again later." }, { status: 429 });
    const repoIds = Array.from(new Set(ctx.body.repoIds));
    const rows = await loadRepositoriesForAccept(userId, repoIds);
    if (rows.length !== repoIds.length || rows.some((row) => row.removedAt)) {
        return NextResponse.json({ error: "Choose current repositories from your installation." }, { status: 400 });
    }
    const drafts = [];
    for (const row of rows) {
        const authorship = AUTHORSHIP.has(row.authorship as Authorship) ? row.authorship as Authorship : "not_confirmed";
        const draft = evidenceFromRepository(userId, {
            repoId: row.repoId,
            fullName: row.fullName,
            name: row.fullName.split("/")[1] || row.fullName,
            language: row.language,
            description: row.description,
            htmlUrl: row.htmlUrl,
            authorship,
        });
        if (!draft) {
            return NextResponse.json({ error: "Only confirmed repositories with a language can become evidence." }, { status: 400 });
        }
        drafts.push(draft);
    }
    for (const draft of drafts) {
        await upsertEvidenceNode(userId, draft);
    }
    return NextResponse.json(toAcceptResponse(drafts));
});
