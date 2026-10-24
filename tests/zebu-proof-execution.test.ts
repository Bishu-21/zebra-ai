import assert from "node:assert/strict";
import test from "node:test";
import { confirmProofProposal, type ProofRepository } from "../src/lib/zebu-proof-execution";
import { parseProofDraft, signProofProposal } from "../src/lib/zebu-proof-policy";

const secret = "a-secret-long-enough-for-the-proof-proposal-tests";

function repository() {
  const items = new Map<string, { id: string; userId: string; title: string; proofUrl: string | null }>();
  let creates = 0;
  const repo: ProofRepository = {
    find: async (userId, id) => {
      const item = items.get(id);
      return item?.userId === userId ? item : null;
    },
    create: async (input) => { creates++; if (!items.has(input.id)) items.set(input.id, input); },
    updateProof: async (userId, id, proofUrl) => {
      const item = items.get(id);
      if (item?.userId === userId) item.proofUrl = proofUrl;
    },
  };
  return { repo, items, getCreates: () => creates };
}

test("confirmed new proof is idempotent and verified from saved state", async () => {
  const data = repository();
  const token = signProofProposal({ userId: "A", secret, now: 1_000, nonce: "once", draft: parseProofDraft({ title: "Project", proofUrl: "https://example.com/proof" }) });
  const first = await confirmProofProposal({ token, userId: "A", secret, now: 1_500, repository: data.repo });
  const again = await confirmProofProposal({ token, userId: "A", secret, now: 1_500, repository: data.repo });
  assert.equal(first.id, again.id);
  assert.equal(first.proofUrl, "https://example.com/proof");
  assert.equal(data.items.size, 1);
  assert.equal(data.getCreates(), 1);
});

test("confirmed proof cannot change another user's item", async () => {
  const data = repository();
  data.items.set("work_1", { id: "work_1", userId: "B", title: "Private", proofUrl: null });
  const token = signProofProposal({ userId: "A", secret, now: 1_000, draft: parseProofDraft({ workItemId: "work_1", proofUrl: "https://example.com/proof" }) });
  await assert.rejects(confirmProofProposal({ token, userId: "A", secret, now: 1_500, repository: data.repo }));
  assert.equal(data.items.get("work_1")?.proofUrl, null);
});

test("write without matching readback is not reported complete", async () => {
  const data = repository();
  data.items.set("work_1", { id: "work_1", userId: "A", title: "Project", proofUrl: null });
  data.repo.updateProof = async () => undefined;
  const token = signProofProposal({ userId: "A", secret, now: 1_000, draft: parseProofDraft({ workItemId: "work_1", proofUrl: "https://example.com/proof" }) });
  await assert.rejects(confirmProofProposal({ token, userId: "A", secret, now: 1_500, repository: data.repo }), /could not be verified/);
});
