import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
    createLegacyResumeContent,
    normalizeResumeContent,
    parseStoredResumeContent,
    resumeContentToPrompt,
    stringifyResumeContent,
} from "../src/lib/resume-content";

describe("Lossless resume content handling", () => {
    it("preserves every character of legacy raw text outside the summary", () => {
        const source = "Bishal Sarkar\nEXPERIENCE\nBuilt a production portal.\n".repeat(4);
        const parsed = parseStoredResumeContent(source);

        assert.equal(parsed.basics.summary, "");
        assert.equal(parsed._ingestionMeta?.parseStatus, "legacy");
        assert.equal(parsed._ingestionMeta?.sourceText, source);
    });

    it("preserves invalid JSON as recoverable legacy source", () => {
        const source = '{"basics": broken but important source text '.repeat(3);
        const parsed = parseStoredResumeContent(source);
        assert.equal(parsed._ingestionMeta?.sourceText, source);
        assert.equal(parsed._ingestionMeta?.parseStatus, "legacy");
    });

    it("assigns deterministic IDs during every normalization", () => {
        const value = {
            basics: {},
            experience: [{ company: "A" }, { company: "B" }],
            education: [], skills: [{ category: "Languages", items: "TypeScript" }],
            projects: [{ title: "Zebra" }], certifications: [],
        };

        assert.deepEqual(normalizeResumeContent(value), normalizeResumeContent(value));
        assert.deepEqual(normalizeResumeContent(value).experience.map((item) => item.id), [1, 2]);
    });

    it("round-trips ingestion metadata and excludes source duplication from AI prompts", () => {
        const content = createLegacyResumeContent("original source");
        content.basics.name = "Bishal Sarkar";
        const serialized = stringifyResumeContent(content);
        const restored = parseStoredResumeContent(serialized);

        assert.equal(restored._ingestionMeta?.sourceText, "original source");
        const prompt = resumeContentToPrompt(serialized);
        assert.match(prompt, /Bishal Sarkar/);
        assert.doesNotMatch(prompt, /original source/);
        assert.doesNotMatch(prompt, /_ingestionMeta/);
    });

    it("recovers old full-document-in-summary records as legacy source", () => {
        const flattened = [
            "Bishal Sarkar",
            "SUMMARY " + "Production-focused engineer. ".repeat(20),
            "EDUCATION Brainware University",
            "TECHNICAL SKILLS & COMPETENCIES TypeScript, Azure, Postgres",
            "PROJECTS Zebra AI resume platform",
        ].join(" ");
        const stored = JSON.stringify({
            basics: { name: "Your Name", summary: flattened },
            experience: [], education: [], skills: [], projects: [], certifications: [],
        });

        const parsed = parseStoredResumeContent(stored);

        assert.equal(parsed.basics.name, "");
        assert.equal(parsed.basics.summary, "");
        assert.equal(parsed._ingestionMeta?.parseStatus, "legacy");
        assert.equal(parsed._ingestionMeta?.sourceText, flattened);
        assert.match(parsed._ingestionMeta?.parseWarnings[0] || "", /Auto-Structure/);
    });
});
