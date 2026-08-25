import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
    calculateResumeAuditScores,
    inferResumeAuditContext,
    normalizeResumeQualityAuditItems,
    RESUME_AUDIT_CATEGORIES,
    RESUME_AUDIT_RESPONSE_FORMAT,
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

    test("awards partial credit and excludes not-applicable checks", () => {
        const results = RESUME_AUDIT_RUBRIC.map((item, index) => ({
            id: item.id,
            status: index === 0 ? "Partial" as const : index === 1 ? "Not Applicable" as const : "Pass" as const,
        }));

        const expected = Math.round(((RESUME_AUDIT_TOTAL_WEIGHT - 3 - 3 + 1.5) / (RESUME_AUDIT_TOTAL_WEIGHT - 3)) * 100);
        assert.equal(calculateResumeAuditScores(results).overall, expected);
    });

    test("publishes a strict schema with the established report fields", () => {
        assert.equal(RESUME_AUDIT_RESPONSE_FORMAT.strict, true);
        assert.deepEqual(
            RESUME_AUDIT_RESPONSE_FORMAT.schema.required,
            ["score", "summary", "metrics", "audit", "recruiterInsights", "suggestedBulletPoints"],
        );
        assert.equal(RESUME_AUDIT_RESPONSE_FORMAT.schema.properties.suggestedBulletPoints.maxItems, 6);
    });

    test("normalizes unavailable JD, rendering, and external evidence before scoring", () => {
        const raw = RESUME_AUDIT_RUBRIC.map((item) => ({
            id: item.id,
            status: "Fail" as const,
            fix: "fix",
            evidence: "raw",
        }));
        const normalized = normalizeResumeQualityAuditItems(raw);

        for (const criterion of RESUME_AUDIT_RUBRIC) {
            const item = normalized.find((candidate) => candidate.id === criterion.id)!;
            if (criterion.applicability === "target-dependent") assert.equal(item.status, "Not Applicable");
            if (criterion.assessability !== "text") assert.equal(item.status, "Not Assessed");
        }
    });

    test("treats first-third placement as rendered evidence instead of rejecting the audit", () => {
        const criterion = RESUME_AUDIT_RUBRIC.find((item) => item.id === "TAR-05");
        assert.equal(criterion?.assessability, "rendered");

        const raw = RESUME_AUDIT_RUBRIC.map((item) => ({
            id: item.id,
            status: item.id === "TAR-05" ? "Not Assessed" as const : "Pass" as const,
            fix: "",
            evidence: "",
        }));
        const normalized = normalizeResumeQualityAuditItems(raw);
        assert.equal(normalized.find((item) => item.id === "TAR-05")?.status, "Not Assessed");
    });

    test("does not reject a complete audit when the provider declines a text checkpoint", () => {
        const raw = RESUME_AUDIT_RUBRIC.map((item) => ({
            id: item.id,
            status: item.id === "DOC-05" ? "Not Assessed" as const : "Pass" as const,
            fix: "",
            evidence: "",
        }));

        const normalized = normalizeResumeQualityAuditItems(raw);
        const documentHeadingCheck = normalized.find((item) => item.id === "DOC-05");
        assert.equal(documentHeadingCheck?.status, "Not Assessed");
        assert.match(documentHeadingCheck?.evidence || "", /did not make a reliable determination/i);
    });

    test("normalizes an impossible always-applicable status without failing the report", () => {
        const raw = RESUME_AUDIT_RUBRIC.map((item) => ({
            id: item.id,
            status: item.id === "TAR-04" ? "Not Applicable" as const : "Pass" as const,
            fix: "",
            evidence: "",
        }));

        const normalized = normalizeResumeQualityAuditItems(raw);
        assert.equal(normalized.find((item) => item.id === "TAR-04")?.status, "Not Assessed");
    });

    test("does not penalize a student for having no professional experience", () => {
        const context = inferResumeAuditContext(JSON.stringify({
            education: [{ institution: "University" }],
            experience: [],
            projects: [{ name: "Capstone" }],
        }));
        assert.equal(context.hasProfessionalExperience, false);

        const raw = RESUME_AUDIT_RUBRIC.map((item) => ({
            id: item.id,
            status: item.category === "experience" ? "Fail" as const : "Pass" as const,
            fix: "Add employment history",
            evidence: "No experience section",
        }));
        const normalized = normalizeResumeQualityAuditItems(raw, context);
        const experienceItems = normalized.filter((item) => item.id.startsWith("EXP-"));
        assert.ok(experienceItems.every((item) => item.status === "Not Applicable"));
        assert.equal(calculateResumeAuditScores(normalized).overall, 100);
        assert.equal(calculateResumeAuditScores(normalized).impact, 100);
    });

    test("continues assessing experience checks when roles are present", () => {
        const context = inferResumeAuditContext(JSON.stringify({
            experience: [{ company: "Example", position: "Intern" }],
        }));
        assert.equal(context.hasProfessionalExperience, true);

        const raw = RESUME_AUDIT_RUBRIC.map((item) => ({
            id: item.id,
            status: item.category === "experience" ? "Fail" as const : "Pass" as const,
            fix: "",
            evidence: "",
        }));
        const normalized = normalizeResumeQualityAuditItems(raw, context);
        assert.ok(normalized.filter((item) => item.id.startsWith("EXP-")).every((item) => item.status === "Fail"));
    });
});
