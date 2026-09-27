import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-policy";
import { checkDistributedRateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { workItems } from "@/lib/schema";
import { confirmProofProposal, type ProofRepository } from "@/lib/zebu-proof-execution";
import { parseProofDraft, signProofProposal } from "@/lib/zebu-proof-policy";

const requestSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("prepare"), draft: z.unknown() }),
  z.object({ mode: z.literal("confirm"), token: z.string().min(1).max(8_000) }),
]);

function repository(): ProofRepository {
  return {
    async find(userId, id) {
      const row = await db.query.workItems.findFirst({
        where: and(eq(workItems.userId, userId), eq(workItems.id, id)),
        columns: { id: true, userId: true, title: true, proofUrl: true },
      });
      return row ?? null;
    },
    async create(input) {
      const now = new Date();
      await db.insert(workItems).values({
        id: input.id, userId: input.userId, title: input.title, category: "Project",
        description: input.description || null, proofUrl: input.proofUrl, tools: [], isPublic: false,
        lastReviewedAt: now, createdAt: now, updatedAt: now,
      }).onConflictDoNothing({ target: workItems.id });
    },
    async updateProof(userId, id, proofUrl) {
      await db.update(workItems).set({ proofUrl, updatedAt: new Date() })
        .where(and(eq(workItems.userId, userId), eq(workItems.id, id)));
    },
  };
}

export async function POST(request: Request) {
  const { auth, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  const rate = await checkDistributedRateLimit(`zebu-proof:${auth.user.id}`, 20, 60_000);
  if (!rate.success) return NextResponse.json({ error: "Too many proof requests. Retry shortly." }, { status: 429 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid proof request." }, { status: 400 });
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) return NextResponse.json({ error: "Proof confirmation is unavailable." }, { status: 503 });

  try {
    const repo = repository();
    if (parsed.data.mode === "prepare") {
      const draft = parseProofDraft(parsed.data.draft);
      let targetTitle = draft.title;
      if (draft.workItemId) {
        const owned = await repo.find(auth.user.id, draft.workItemId);
        if (!owned) return NextResponse.json({ error: "The selected work item is unavailable." }, { status: 404 });
        targetTitle = owned.title;
      }
      const token = signProofProposal({ userId: auth.user.id, draft, secret });
      return NextResponse.json({ proposal: { title: targetTitle, proofUrl: draft.proofUrl, createsWorkItem: !draft.workItemId, description: draft.description ?? null }, token });
    }
    const saved = await confirmProofProposal({ token: parsed.data.token, userId: auth.user.id, secret, repository: repo });
    return NextResponse.json({ verified: true, item: { id: saved.id, title: saved.title, proofUrl: saved.proofUrl } });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid proof details." }, { status: 400 });
    const safeMessages = new Set([
      "The selected work item is unavailable.",
      "The proof change could not be verified. Check Work before retrying.",
      "Invalid confirmation.",
      "Confirmation expired or belongs to another account.",
    ]);
    const message = error instanceof Error && safeMessages.has(error.message)
      ? error.message : "The proof change could not be completed. Retry in a moment.";
    if (message.startsWith("The proof change could not be completed")) console.error("[Zebu proof] Unexpected execution failure", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
