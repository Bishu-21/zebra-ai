import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const proofUrlSchema = z.url().max(2_048).refine((value) => {
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  return url.protocol === "https:" && !url.username && !url.password && host !== "localhost" && !host.endsWith(".localhost") && !host.endsWith(".local") && !/^\d+\.\d+\.\d+\.\d+$/.test(host);
}, "Use a public HTTPS proof link without credentials.");

const draftSchema = z.object({
  workItemId: z.string().trim().min(1).max(160).optional(),
  title: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(2_000).optional(),
  proofUrl: proofUrlSchema,
}).strict().superRefine((draft, context) => {
  if (draft.workItemId && (draft.title !== undefined || draft.description !== undefined)) {
    context.addIssue({ code: "custom", message: "An existing work item can only receive a proof link." });
  }
  if (!draft.workItemId && !draft.title) {
    context.addIssue({ code: "custom", message: "A new work item needs a title." });
  }
});

export type ProofDraft = z.infer<typeof draftSchema>;

export function parseProofDraft(input: unknown): ProofDraft {
  const draft = draftSchema.parse(input);
  return { workItemId: draft.workItemId, title: draft.title, description: draft.description, proofUrl: draft.proofUrl };
}

const tokenPayloadSchema = z.object({
  userId: z.string().min(1), draft: draftSchema, nonce: z.string().min(1), expiresAt: z.number().int().positive(),
});

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function signProofProposal(input: { userId: string; draft: ProofDraft; secret: string; now?: number; nonce?: string }): string {
  if (input.secret.length < 32) throw new Error("Proof confirmation is not configured.");
  const payload = Buffer.from(JSON.stringify({
    userId: input.userId, draft: input.draft, nonce: input.nonce ?? randomUUID(), expiresAt: (input.now ?? Date.now()) + 10 * 60_000,
  })).toString("base64url");
  return `${payload}.${signature(payload, input.secret)}`;
}

export function verifyProofProposal(token: string, input: { userId: string; secret: string; now?: number }) {
  if (input.secret.length < 32) throw new Error("Proof confirmation is not configured.");
  const [payload, mac, extra] = token.split(".");
  if (!payload || !mac || extra || payload.length > 8_000) throw new Error("Invalid confirmation.");
  const expected = Buffer.from(signature(payload, input.secret));
  const received = Buffer.from(mac);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) throw new Error("Invalid confirmation.");
  const value = tokenPayloadSchema.parse(JSON.parse(Buffer.from(payload, "base64url").toString("utf8")));
  if (value.userId !== input.userId || value.expiresAt < (input.now ?? Date.now())) throw new Error("Confirmation expired or belongs to another account.");
  return { ...value, draft: parseProofDraft(value.draft) };
}
