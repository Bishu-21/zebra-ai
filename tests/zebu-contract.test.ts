import assert from "node:assert/strict";
import test from "node:test";
import { isAllowedZebuRoute, zebuPlanSchema, zebuTurnSchema } from "../src/lib/zebu-contract";
import { containsZebuWakeWord } from "../src/lib/zebu-wake-word";

test("Zebu accepts bounded turns and safe actions", () => {
  assert.equal(zebuTurnSchema.safeParse({ message: "Open my latest resume" }).success, true);
  assert.equal(zebuPlanSchema.safeParse({
    spokenResponse: "Opening your resume.",
    action: { type: "navigate", route: "/dashboard/resumes/resume_123" },
  }).success, true);
});

test("Zebu route allow-list blocks external and malformed destinations", () => {
  assert.equal(isAllowedZebuRoute("/dashboard"), true);
  assert.equal(isAllowedZebuRoute("/dashboard/applications/app_123"), true);
  assert.equal(isAllowedZebuRoute("/dashboard/resumes/resume-123"), true);
  assert.equal(isAllowedZebuRoute("https://example.com"), false);
  assert.equal(isAllowedZebuRoute("/api/applications"), false);
  assert.equal(isAllowedZebuRoute("/dashboard/applications/../../settings"), false);
});

test("Zebu rejects unsupported tools and oversized commands", () => {
  assert.equal(zebuPlanSchema.safeParse({
    spokenResponse: "Doing that now.",
    action: { type: "open_tool", tool: "delete_everything" },
  }).success, false);
  assert.equal(zebuTurnSchema.safeParse({ message: "x".repeat(2_001) }).success, false);
});

test("Zebu recognizes the wake phrase without triggering on ordinary brand mentions", () => {
  assert.equal(containsZebuWakeWord("Hey Zebu, show my deadlines"), true);
  assert.equal(containsZebuWakeWord("okay   zeebu!"), true);
  assert.equal(containsZebuWakeWord("I opened Zebu yesterday"), false);
  assert.equal(containsZebuWakeWord("Hey Zebra, open my resume"), false);
});

test("Zebu rejects model-proposed writes until deterministic confirmation exists", () => {
  assert.equal(zebuPlanSchema.safeParse({
    spokenResponse: "I’ll add that draft.",
    action: { type: "create_application", company: "Acme", position: "Product Intern" },
  }).success, false);
  assert.equal(zebuPlanSchema.safeParse({
    spokenResponse: "I’ll mark it applied.",
    action: { type: "update_application_status", applicationId: "app_123", status: "Applied" },
  }).success, false);
  assert.equal(zebuPlanSchema.safeParse({
    spokenResponse: "I’ll update it.",
    action: { type: "update_application_status", applicationId: "app_123", status: "Deleted" },
  }).success, false);
});
