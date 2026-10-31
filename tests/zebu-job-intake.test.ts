import assert from "node:assert/strict";
import test from "node:test";
import { zebuPlanSchema } from "../src/lib/zebu-contract";
import { extractJobUrlFromZebuMessage } from "../src/lib/zebu-job-intake";

test("Zebu recognizes an HTTPS job link in a role matching request", () => {
  assert.equal(
    extractJobUrlFromZebuMessage("Match my resume to https://example.com/jobs/frontend?ref=home, please"),
    "https://example.com/jobs/frontend?ref=home",
  );
});

test("Zebu ignores unsafe or unrelated URLs", () => {
  assert.equal(extractJobUrlFromZebuMessage("Match me to http://example.com/jobs/1"), null);
  assert.equal(extractJobUrlFromZebuMessage("Open https://example.com/jobs/1"), null);
  assert.equal(extractJobUrlFromZebuMessage("Tailor my resume from https://user:pass@example.com/jobs/1"), null);
});

test("role match action can carry a bounded job URL into the workspace", () => {
  assert.equal(zebuPlanSchema.safeParse({
    spokenResponse: "I’ll import the job and let you review it.",
    action: { type: "open_tool", tool: "role_match", jobUrl: "https://example.com/jobs/1" },
  }).success, true);
  assert.equal(zebuPlanSchema.safeParse({
    spokenResponse: "Working on it.",
    action: { type: "open_tool", tool: "role_match", jobUrl: "javascript:alert(1)" },
  }).success, false);
});
