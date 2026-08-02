import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
    extractJobRequirements,
    normalizeJobText,
    analyzeEvidenceCoverage,
    WorkItemForAnalysis
} from "../src/lib/requirement-extractor";

describe("Requirement Extractor Unit Tests", () => {

    test("1. Handles empty, null, undefined, and whitespace descriptions safely", () => {
        assert.deepEqual(extractJobRequirements(""), []);
        assert.deepEqual(extractJobRequirements(null), []);
        assert.deepEqual(extractJobRequirements(undefined), []);
        assert.deepEqual(extractJobRequirements("   \n\t  "), []);
        assert.equal(normalizeJobText(null), "");
        assert.equal(normalizeJobText(undefined), "");
    });

    test("2. Normalizes markdown and whitespace characters", () => {
        const rawText = "# Senior Engineer\n\n* **React** and _TypeScript_\n* Experience with `Node.js`";
        const normalized = normalizeJobText(rawText);
        assert.equal(normalized.includes("#"), false);
        assert.equal(normalized.includes("*"), false);
        assert.equal(normalized.includes("`"), false);

        const extracted = extractJobRequirements(rawText);
        assert.ok(extracted.includes("React"));
        assert.ok(extracted.includes("TypeScript"));
        assert.ok(extracted.includes("Node.js"));
    });

    test("3. Normalizes casing and returns canonical display titles", () => {
        const text = "Looking for strong skills in react, NEXTJS, python3, and Docker.";
        const extracted = extractJobRequirements(text);

        assert.ok(extracted.includes("React"));
        assert.ok(extracted.includes("Next.js"));
        assert.ok(extracted.includes("Python"));
        assert.ok(extracted.includes("Docker"));
    });

    test("4. Deduplicates repeated tech terms and aliases", () => {
        const text = "We use React, react.js, ReactJS, Next.js, nextjs, next, and TypeScript, ts.";
        const extracted = extractJobRequirements(text);

        const reactCount = extracted.filter(r => r === "React").length;
        const nextCount = extracted.filter(r => r === "Next.js").length;
        const tsCount = extracted.filter(r => r === "TypeScript").length;

        assert.equal(reactCount, 1, "React should be deduplicated to exactly 1 entry");
        assert.equal(nextCount, 1, "Next.js should be deduplicated to exactly 1 entry");
        assert.equal(tsCount, 1, "TypeScript should be deduplicated to exactly 1 entry");
    });

    test("5. Enforces word boundaries to prevent substring false positives", () => {
        const falsePositiveText = "We are going to organize categories and algorithms.";
        const extractedFalse = extractJobRequirements(falsePositiveText);
        assert.equal(extractedFalse.includes("Go"), false, "Should not match 'Go' inside 'going' or 'category'");

        const truePositiveText = "Seeking a developer skilled in Go, Python, and SQL.";
        const extractedTrue = extractJobRequirements(truePositiveText);
        assert.ok(extractedTrue.includes("Go"), "Should match standalone 'Go'");
    });

    test("6. Analyzes evidence coverage, missing items, and library recommendations", () => {
        const jobDesc = "We require React, TypeScript, Python, and PostgreSQL.";
        const workItems: WorkItemForAnalysis[] = [
            { id: "work_1", title: "E-Commerce App", description: "Built with React and TypeScript" },
            { id: "work_2", title: "Data Pipeline", description: "Developed in Python with Pandas" },
        ];

        // User attached work_1 (has React, TypeScript), but not work_2 (has Python). PostgreSQL missing.
        const result = analyzeEvidenceCoverage(
            jobDesc,
            ["work_1"],
            workItems,
            { title: "Frontend Resume", content: "Expert in web development" }
        );

        assert.ok(result.requirements.includes("React"));
        assert.ok(result.requirements.includes("TypeScript"));
        assert.ok(result.requirements.includes("Python"));
        assert.ok(result.requirements.includes("PostgreSQL"));

        assert.ok(result.covered.includes("React"));
        assert.ok(result.covered.includes("TypeScript"));

        assert.ok(result.missing.includes("Python"));
        assert.ok(result.missing.includes("PostgreSQL"));

        // Unattached work_2 matches Python
        const rec = result.unattachedRecommendations.find(r => r.req === "Python");
        assert.ok(rec, "Should recommend unattached work item for Python");
        assert.equal(rec?.itemId, "work_2");
        assert.equal(rec?.itemTitle, "Data Pipeline");
    });

});
