import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  LINKEDIN_AUDIT_CATEGORIES, LINKEDIN_AUDIT_RESPONSE_FORMAT, LINKEDIN_AUDIT_RUBRIC,
  calculateLinkedInAuditScores, normalizeLinkedInAudit,
} from "../src/lib/linkedin-audit-rubric";

const rawAudit = Object.fromEntries(LINKEDIN_AUDIT_CATEGORIES.map(category => [category,
  Object.fromEntries(LINKEDIN_AUDIT_RUBRIC.filter(item => item.category === category).map(item => [item.id, {
    status: "Pass" as const, evidence: "Sample evidence", fix: "",
  }]))
]));

describe("LinkedIn profile rubric", () => {
  test("defines 45 unique checks in nine categories and exact provider keys", () => {
    assert.equal(LINKEDIN_AUDIT_RUBRIC.length, 45);
    assert.equal(new Set(LINKEDIN_AUDIT_RUBRIC.map(item => item.id)).size, 45);
    assert.equal(LINKEDIN_AUDIT_CATEGORIES.length, 9);
    assert.equal(LINKEDIN_AUDIT_RESPONSE_FORMAT.strict, true);
    for (const category of LINKEDIN_AUDIT_CATEGORIES) {
      assert.deepEqual(LINKEDIN_AUDIT_RESPONSE_FORMAT.schema.properties.audit.properties[category].required,
        LINKEDIN_AUDIT_RUBRIC.filter(item => item.category === category).map(item => item.id));
    }
  });

  test("excludes unverifiable and persona-inapplicable checks from score", () => {
    const items = normalizeLinkedInAudit(rawAudit, "student");
    assert.equal(items.find(item => item.id === "LI-ID-01")?.status, "Not Assessed");
    assert.equal(items.find(item => item.id === "LI-EX-06")?.status, "Not Applicable");
    const scores = calculateLinkedInAuditScores(items);
    assert.equal(scores.overall, 100);
    assert.ok(scores.assessed < 45);
    assert.equal(scores.categories.network, null);
  });

  test("scores a failed text criterion without penalizing unassessed checks", () => {
    const items = normalizeLinkedInAudit(rawAudit, "professional");
    const headline = items.find(item => item.id === "LI-HL-01")!;
    const modified = items.map(item => item.id === headline.id ? { ...item, status: "Fail" as const } : item);
    const scores = calculateLinkedInAuditScores(modified);
    assert.ok(scores.overall !== null && scores.overall < 100);
    assert.ok(scores.categories.headline !== null && scores.categories.headline < 100);
  });

  test("does not accept a positive judgment backed by invented evidence", () => {
    const profile = "Headline: Frontend Developer. I build React dashboards for university clubs.";
    const audit = structuredClone(rawAudit);
    audit.headline["LI-HL-01"].evidence = "Frontend Developer";
    const items = normalizeLinkedInAudit(audit, "student", profile);
    assert.equal(items.find(item => item.id === "LI-HL-01")?.status, "Pass");
    assert.equal(items.find(item => item.id === "LI-HL-02")?.status, "Not Assessed");
  });
});
