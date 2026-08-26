import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { aiParsedResumeSchema, aiResumeAnalysisSchema, resumeSchema, resumeUpdateSchema } from "../src/lib/validation";

describe("Resume validation", () => {
    test("accepts create payloads with an omitted or legacy null id", () => {
        const payload = { title: "New resume", content: "{}" };

        assert.equal(resumeSchema.safeParse(payload).success, true);
        assert.equal(resumeSchema.safeParse({ ...payload, id: null }).success, true);
    });

    test("accepts content-only autosave patches", () => {
        const result = resumeUpdateSchema.safeParse({ content: "{}", expectedRevision: 0 });

        assert.equal(result.success, true);
    });

    test("requires a revision for autosave patches", () => {
        assert.equal(resumeUpdateSchema.safeParse({ content: "{}" }).success, false);
    });

    test("rejects empty autosave patches", () => {
        const result = resumeUpdateSchema.safeParse({});

        assert.equal(result.success, false);
    });

    test("normalizes safe string-array variations from model JSON", () => {
        const result = aiParsedResumeSchema.parse({
            basics: { name: ["Bishal", "Sarkar"], summary: ["Builder", "Engineer"] },
            experience: [{
                company: "Zebra",
                role: "Engineer",
                highlights: "Built a resume parser",
                techStack: ["TypeScript", "Azure"],
            }],
            skills: [{ category: "Languages", items: ["TypeScript", "Python"] }],
            certifications: ["Azure AI Fundamentals"],
        });

        assert.equal(result.basics.name, "Bishal Sarkar");
        assert.equal(result.basics.summary, "Builder\nEngineer");
        assert.deepEqual(result.experience[0].highlights, ["Built a resume parser"]);
        assert.equal(result.experience[0].techStack, "TypeScript, Azure");
        assert.equal(result.skills[0].items, "TypeScript, Python");
        assert.equal(result.certifications[0].items, "Azure AI Fundamentals");
    });

    test("normalizes category maps and null collections from model JSON", () => {
        const result = aiParsedResumeSchema.parse({
            basics: { name: "Bishal Sarkar" },
            experience: null,
            education: null,
            projects: null,
            skills: { Languages: ["TypeScript", "Python"] },
            certifications: { Cloud: ["Azure AI Fundamentals", "Google AI Essentials"] },
        });

        assert.deepEqual(result.experience, []);
        assert.deepEqual(result.education, []);
        assert.deepEqual(result.projects, []);
        assert.equal(result.skills[0].category, "Languages");
        assert.equal(result.skills[0].items, "TypeScript, Python");
        assert.equal(result.certifications[0].items, "Azure AI Fundamentals, Google AI Essentials");
    });

    test("still rejects objects where a text field is required", () => {
        const result = aiParsedResumeSchema.safeParse({
            basics: { name: { invented: true } },
        });

        assert.equal(result.success, false);
    });

    test("normalizes omitted optional audit descriptions without losing core scores", () => {
        const result = aiResumeAnalysisSchema.parse({
            score: 82,
            summary: "Strong evidence with several clarity improvements available.",
            metrics: { impact: 80, formatting: 70, ats: 90, branding: 75 },
            audit: {
                experience: [{ checkpoint: "Evidence uses outcomes", status: "Pass" }],
            },
            recruiterInsights: { sevenSecondScan: "Clear role alignment" },
            suggestedBulletPoints: [{ after: "Built a reliable resume workflow." }],
        });

        assert.equal(result.recruiterInsights.readability, "");
        assert.equal(result.audit.experience[0].fix, "");
        assert.equal(result.suggestedBulletPoints[0].rationale, "");
        assert.equal(result.score, 82);
    });
});
