import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
    calculateResumeAuditScores,
    RESUME_AUDIT_CATEGORIES,
    RESUME_AUDIT_RUBRIC,
    RESUME_AUDIT_TOTAL_WEIGHT,
} from "../src/lib/resume-audit-rubric";

describe("45-check resume audit rubric", () => {
    test("has exactly 45 unique checks weighted to 100 points", () => {
        assert.equal(RESUME_AUDIT_RUBRIC.length, 45);
        assert.equal(new Set(RESUME_AUDIT_RUBRIC.map((item) => item.id)).size, 45);
        assert.equal(RESUME_AUDIT_TOTAL_WEIGHT, 100);
        assert.deepEqual(
            [...new Set(RESUME_AUDIT_RUBRIC.map((item) => item.category))],
            [...RESUME_AUDIT_CATEGORIES],
        );
    });

    test("calculates the score from rubric results instead of trusting the model", () => {
        const allPass = RESUME_AUDIT_RUBRIC.map((item) => ({ id: item.id, status: "Pass" as const }));
        assert.equal(calculateResumeAuditScores(allPass).overall, 100);

        const allFail = RESUME_AUDIT_RUBRIC.map((item) => ({ id: item.id, status: "Fail" as const }));
        assert.equal(calculateResumeAuditScores(allFail).overall, 0);
    });

    test("does not penalize checks that cannot be assessed from available evidence", () => {
        const results = RESUME_AUDIT_RUBRIC.map((item) => ({
            id: item.id,
            status: item.assessability === "text" ? "Pass" as const : "Not Assessed" as const,
        }));

        assert.equal(calculateResumeAuditScores(results).overall, 100);
    });
});
