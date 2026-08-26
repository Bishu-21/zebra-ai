import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { groundResumeContent } from "../src/lib/resume-ingestion";
import { normalizeResumeContent } from "../src/lib/resume-content";

describe("Resume import source grounding", () => {
    it("records exact source offsets and flags unsupported extracted claims", () => {
        const source = "Bishal Sarkar\nEngineer at Zebra AI\nBuilt a secure resume workspace.\nTypeScript, Postgres";
        const content = normalizeResumeContent({
            basics: { name: "Bishal Sarkar", summary: "Invented summary" },
            experience: [{ company: "Zebra AI", role: "Engineer", period: "", highlights: ["Built a secure resume workspace."] }],
            education: [],
            skills: [{ category: "Skills", items: "TypeScript, Postgres" }],
            projects: [],
            certifications: [],
        });

        const spans = groundResumeContent(content, source);
        const name = spans.find((span) => span.path === "basics.name");
        const unsupported = spans.find((span) => span.path === "basics.summary");

        assert.deepEqual(name, { path: "basics.name", text: "Bishal Sarkar", start: 0, end: 13, grounded: true });
        assert.equal(unsupported?.grounded, false);
        assert.equal(unsupported?.start, null);
        assert.ok(spans.some((span) => span.path === "skills.0.items.0" && span.grounded));
    });
});
