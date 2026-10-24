import { createHash } from "node:crypto";
import { verifyProofProposal } from "./zebu-proof-policy";

export type SavedProofItem = { id: string; userId: string; title: string; proofUrl: string | null };

export type ProofRepository = {
  find(userId: string, id: string): Promise<SavedProofItem | null>;
  create(input: SavedProofItem & { description?: string }): Promise<void>;
  updateProof(userId: string, id: string, proofUrl: string): Promise<void>;
};

export async function confirmProofProposal(input: {
  token: string; userId: string; secret: string; repository: ProofRepository; now?: number;
}): Promise<SavedProofItem> {
  const proposal = verifyProofProposal(input.token, input);
  const draft = proposal.draft;
  let id = draft.workItemId;
  if (id) {
    const owned = await input.repository.find(input.userId, id);
    if (!owned) throw new Error("The selected work item is unavailable.");
    await input.repository.updateProof(input.userId, id, draft.proofUrl);
  } else {
    id = `work_${createHash("sha256").update(`${input.userId}:${proposal.nonce}`).digest("hex").slice(0, 20)}`;
    const existing = await input.repository.find(input.userId, id);
    if (!existing) {
      await input.repository.create({ id, userId: input.userId, title: draft.title!, description: draft.description, proofUrl: draft.proofUrl });
    }
  }
  const saved = await input.repository.find(input.userId, id);
  if (!saved || saved.proofUrl !== draft.proofUrl || (!draft.workItemId && saved.title !== draft.title)) {
    throw new Error("The proof change could not be verified. Check Work before retrying.");
  }
  return saved;
}
