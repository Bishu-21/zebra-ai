import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { groundResumeContent } from "../src/lib/resume-ingestion";
import { normalizeResumeContent } from "../src/lib/resume-content";

describe("Resume import source grounding", () => {
    it("grounds assembled technologies separately within their own experience", () => {
        const content = normalizeResumeContent({ experience: [{ company: "Example Systems", role: "Engineer", techStack: "TypeScript, React, PostgreSQL", highlights: [] }] });
        const source = "Experience: Example Systems, Engineer. Built TypeScript and React apps using PostgreSQL.\nSkills: Python";
        const spans = groundResumeContent(content, source).filter(s => s.path.startsWith("experience.0.techStack"));
        assert.deepEqual(spans.map(s => s.text), ["TypeScript", "React", "PostgreSQL"]);
        assert.ok(spans.every(s => s.grounded && source.slice(s.start!, s.end!) === s.text));
    });

    it("does not borrow technology evidence from other roles or global skills", () => {
        const content = normalizeResumeContent({ experience: [
            { company: "First Corp", techStack: "Python, Java", highlights: ["Built JavaScript apps."] },
            { company: "Second Corp", techStack: "Python", highlights: ["Built Python services."] },
        ] });
        const source = "Experience\nFirst Corp\nBuilt JavaScript apps.\nSecond Corp\nBuilt Python services.\nSkills: Python, Java";
        const spans = groundResumeContent(content, source);
        assert.ok(spans.filter(s => s.path.startsWith("experience.0.techStack")).every(s => !s.grounded));
        assert.ok(spans.some(s => s.path.startsWith("experience.1.techStack") && s.grounded));
        content.experience[0].techStack = "JavaScript";
        assert.ok(groundResumeContent(content, source).some(s => s.path.startsWith("experience.0.techStack") && s.grounded));
    });

    it("keeps technologies without an identifiable source section flagged", () => {
        const content = normalizeResumeContent({ projects: [{ title: "Invented project", techStack: "React", highlights: [] }] });
        assert.ok(groundResumeContent(content, "Skills: React").filter(s => s.path.startsWith("projects.0.techStack")).every(s => !s.grounded));
    });

    it("does not choose between repeated employers and preserves C++ evidence", () => {
        const content = normalizeResumeContent({ experience: [{ company: "Repeated Corp", techStack: "C++", highlights: ["Built services in C++."] }] });
        const ambiguous = groundResumeContent(content, "Repeated Corp\nPython\nRepeated Corp\nC++");
        assert.ok(ambiguous.filter(s => s.path.startsWith("experience.0.techStack")).every(s => !s.grounded));
        const exact = groundResumeContent(content, "Repeated Corp\nBuilt services in C++.");
        assert.ok(exact.some(s => s.path.startsWith("experience.0.techStack") && s.grounded));
    });

    it("stops at an employer omitted by extraction", () => {
        const content = normalizeResumeContent({ experience: [{ company: "First Corp", techStack: "Python", highlights: ["Built Java services.", "Built Python services."] }] });
        const spans = groundResumeContent(content, "Experience\nFirst Corp\nBuilt Java services.\nUnmapped Corp\nBuilt Python services.");
        assert.ok(spans.filter(s => s.path.startsWith("experience.0.techStack")).every(s => !s.grounded));
    });
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
