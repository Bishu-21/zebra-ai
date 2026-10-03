import assert from "node:assert/strict";
import test from "node:test";
import { parseProofDraft, signProofProposal, verifyProofProposal } from "../src/lib/zebu-proof-policy";

const secret = "a-secret-long-enough-for-the-proof-proposal-tests";

test("new proof proposal requires a real title and public HTTPS evidence", () => {
  assert.deepEqual(parseProofDraft({ title: "Portfolio project", description: "Built a prototype", proofUrl: "https://github.com/example/project" }), {
    title: "Portfolio project", description: "Built a prototype", proofUrl: "https://github.com/example/project", workItemId: undefined,
  });
  assert.throws(() => parseProofDraft({ title: "", proofUrl: "https://github.com/example/project" }));
  assert.throws(() => parseProofDraft({ title: "Project", proofUrl: "http://localhost:3000/private" }));
  assert.throws(() => parseProofDraft({ title: "Project", proofUrl: "https://user:pass@example.com/proof" }));
});

test("existing proof proposal binds the item and does not invent project text", () => {
  assert.deepEqual(parseProofDraft({ workItemId: "work_123", proofUrl: "https://example.com/demo" }), {
    workItemId: "work_123", proofUrl: "https://example.com/demo", title: undefined, description: undefined,
  });
  assert.throws(() => parseProofDraft({ workItemId: "work_123", title: "Changed title", proofUrl: "https://example.com" }));
});

test("proof confirmation is owner-bound, expires, and detects changed content", () => {
  const draft = parseProofDraft({ title: "Project", proofUrl: "https://example.com/proof" });
  const token = signProofProposal({ userId: "user-A", draft, secret, now: 1_000, nonce: "request-1" });
  assert.deepEqual(verifyProofProposal(token, { userId: "user-A", secret, now: 1_500 }).draft, draft);
  assert.throws(() => verifyProofProposal(token, { userId: "user-B", secret, now: 1_500 }));
  assert.throws(() => verifyProofProposal(token, { userId: "user-A", secret, now: 601_001 }));
  const tampered = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;
  assert.throws(() => verifyProofProposal(tampered, { userId: "user-A", secret, now: 1_500 }));
});
