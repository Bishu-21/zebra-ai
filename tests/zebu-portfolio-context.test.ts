import assert from "node:assert/strict";
import test from "node:test";
import { summarizePortfolioProofContext } from "../src/lib/zebu-portfolio-context";

test("Portfolio context distinguishes an empty workspace from missing proof", () => {
  assert.deepEqual(summarizePortfolioProofContext([]), { listedWorkItemCount: 0, moreAvailable: false, items: [], nextStep: "collect_new_project" });
  assert.deepEqual(summarizePortfolioProofContext([{ id: "work_1", title: "Project", proofUrl: null }]), {
    listedWorkItemCount: 1, moreAvailable: false, items: [{ id: "work_1", title: "Project", hasProof: false }], nextStep: "choose_existing_or_new",
  });
});
