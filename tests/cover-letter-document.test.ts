import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
    candidateNameFromStoredResume,
    composeCoverLetterDocument,
    missingReferencedResumeIds,
    sanitizeCandidateName,
} from "../src/lib/cover-letter-document";
import { generateCoverLetterHtml } from "../src/lib/cover-letter-renderer";

const DATE = "January 15, 2026";
const LETTER_WITH_CLOSING = `Dear Hiring Manager,

I am writing to apply for the Senior Software Engineer role at Northwind.

Thank you for your time and consideration.

Sincerely,
Priya Natarajan`;

const LETTER_WITHOUT_CLOSING = `Dear Hiring Manager,

I am writing to apply for the Senior Software Engineer role at Northwind.

I would welcome the chance to discuss this role.`;

const LONG_LETTER = `Dear Hiring Manager,

${"This paragraph keeps the letter long enough to paginate across two A4 pages while preserving the candidate closing. ".repeat(40)}

Sincerely,
Priya Natarajan`;

const COMPANY_BLOCK_LETTER = `Northwind
Human Resources

Dear Hiring Manager,

I am writing to apply for the Senior Software Engineer role.

I would welcome the chance to discuss this role.`;

const MARKDOWN_CLOSING_LETTER = `Dear Hiring Manager,

I am writing to apply for the Senior Software Engineer role at Northwind.

**Sincerely,**`;

describe("cover letter identity sanitization", () => {
    it("accepts confirmed resume names and rejects placeholders", () => {
        assert.equal(sanitizeCandidateName("José María Núñez-Pérez"), "José María Núñez-Pérez");
        assert.equal(sanitizeCandidateName("Applicant"), undefined);
        assert.equal(sanitizeCandidateName("Applicant Name"), undefined);
        assert.equal(sanitizeCandidateName("Professional Candidate"), undefined);
        assert.equal(sanitizeCandidateName("user@example.com"), undefined);
        assert.equal(
            candidateNameFromStoredResume(JSON.stringify({ basics: { name: "Priya Natarajan" } })),
            "Priya Natarajan",
        );
        assert.equal(
            candidateNameFromStoredResume(JSON.stringify({ basics: { name: "Applicant" } })),
            undefined,
        );
    });
});

describe("composeCoverLetterDocument", () => {
    it("keeps an existing closing and does not append another signature", () => {
        const model = composeCoverLetterDocument(LETTER_WITH_CLOSING, {
            candidateName: "Priya Natarajan",
            dateLabel: DATE,
        });
        assert.equal(model.hasExistingClosing, true);
        assert.equal(model.appendedClosing, null);
        assert.equal(model.identityName, "Priya Natarajan");
        const sincerelyBlocks = model.blocks.filter((block) => block.type === "paragraph" && block.html.toLowerCase().includes("sincerely"));
        assert.equal(sincerelyBlocks.length, 1);
    });

    it("appends a single closing only when the letter has none and a confirmed name exists", () => {
        const model = composeCoverLetterDocument(LETTER_WITHOUT_CLOSING, {
            candidateName: "Priya Natarajan",
            dateLabel: DATE,
        });
        assert.equal(model.hasExistingClosing, false);
        assert.deepEqual(model.appendedClosing, { greeting: "Sincerely,", name: "Priya Natarajan" });
    });

    it("does not invent Applicant or a signature when no identity is available", () => {
        const model = composeCoverLetterDocument(LETTER_WITHOUT_CLOSING, { dateLabel: DATE });
        assert.equal(model.letterheadName, null);
        assert.equal(model.appendedClosing, null);
        assert.equal(model.identityName, null);
    });

    it("preserves a letterhead already present in the stored content", () => {
        const letter = `Priya Natarajan\nJanuary 15, 2026\n\nDear Hiring Manager,\n\nHello.\n\nSincerely,\nPriya Natarajan`;
        const model = composeCoverLetterDocument(letter, { candidateName: "Priya Natarajan", dateLabel: "March 1, 2026" });
        assert.equal(model.letterheadName, null);
        assert.equal(model.dateLabel, null);
        assert.equal(model.appendedClosing, null);
    });

    it("escapes special characters in formatted blocks", () => {
        const model = composeCoverLetterDocument('Hello <img src="x" onerror="alert(1)"> & **safe**', { dateLabel: DATE });
        const paragraph = model.blocks.find((block) => block.type === "paragraph");
        assert.ok(paragraph && paragraph.type === "paragraph");
        assert.match(paragraph.html, /&lt;img src=&quot;x&quot;/);
        assert.match(paragraph.html, /<strong>safe<\/strong>/);
        assert.doesNotMatch(paragraph.html, /<img /);
    });

    it("does not treat a recipient or company name as the applicant signature", () => {
        const model = composeCoverLetterDocument(COMPANY_BLOCK_LETTER, { dateLabel: DATE });
        assert.equal(model.identityName, null);
        assert.equal(model.appendedClosing, null);
        assert.equal(model.letterheadName, null);
        assert.doesNotMatch(JSON.stringify(model.appendedClosing), /Northwind/);
        assert.doesNotMatch(JSON.stringify(model), /Sincerely/);
    });

    it("signs a company-block letter only with confirmed candidate identity", () => {
        const model = composeCoverLetterDocument(COMPANY_BLOCK_LETTER, {
            candidateName: "Priya Natarajan",
            dateLabel: DATE,
        });
        assert.equal(model.identityName, "Priya Natarajan");
        assert.deepEqual(model.appendedClosing, { greeting: "Sincerely,", name: "Priya Natarajan" });
        assert.equal(model.letterheadName, null);
    });

    it("recognizes Markdown closings so a second signature is not appended", () => {
        const model = composeCoverLetterDocument(MARKDOWN_CLOSING_LETTER, {
            candidateName: "Priya Natarajan",
            dateLabel: DATE,
        });
        assert.equal(model.hasExistingClosing, true);
        assert.equal(model.appendedClosing, null);
        const sincerelyBlocks = model.blocks.filter((block) => block.type === "paragraph" && block.html.toLowerCase().includes("sincerely"));
        assert.equal(sincerelyBlocks.length, 1);
    });

    it("reads a Markdown signature name after a Markdown closing", () => {
        const letter = `${MARKDOWN_CLOSING_LETTER}\n**Priya Natarajan**`;
        const model = composeCoverLetterDocument(letter, { dateLabel: DATE });
        assert.equal(model.hasExistingClosing, true);
        assert.equal(model.identityName, "Priya Natarajan");
        assert.equal(model.appendedClosing, null);
    });
});

describe("cover letter resume identity lookup", () => {
    it("lists referenced resume ids that are missing from the newest loaded page", () => {
        assert.deepEqual(
            missingReferencedResumeIds(["old-resume", "newest", "old-resume", "", null], ["newest", "second"]),
            ["old-resume"],
        );
        assert.deepEqual(missingReferencedResumeIds(["newest"], ["newest"]), []);
    });

    it("loads identity for every referenced owned resume, not only the newest 50", () => {
        const page = readFileSync("src/app/dashboard/cover-letters/page.tsx", "utf8");
        assert.match(page, /missingReferencedResumeIds/);
        assert.match(page, /inArray\(resumesTable\.id, missingResumeIds\)/);
        assert.match(page, /eq\(resumesTable\.userId, userId\)/);
        assert.match(page, /candidateNameFromStoredResume/);
    });

    it("returns candidate names from GET /api/resumes without resume content", () => {
        const route = readFileSync("src/app/api/resumes/route.ts", "utf8");
        assert.match(route, /candidateNameFromStoredResume/);
        assert.match(route, /candidateName:\s*candidateNameFromStoredResume\(content\)/);
        assert.match(route, /const resumes = page\.items\.map\(\(\{ content, \.\.\.resume \}\) =>/);
    });
});

describe("generateCoverLetterHtml", () => {
    it("escapes document content and title before rendering", () => {
        const html = generateCoverLetterHtml('<img src="https://evil.test/x" onerror="alert(1)"> **safe**', "</title><script>alert(1)</script>", { dateLabel: DATE });
        assert.doesNotMatch(html, /<script>|<img src=/);
        assert.match(html, /&lt;img src=&quot;https:\/\/evil\.test\/x&quot;/);
        assert.match(html, /<strong>safe<\/strong>/);
        assert.match(html, /&lt;\/title&gt;/);
    });

    it("does not load remote fonts or other external assets", () => {
        const html = generateCoverLetterHtml("Hello", "Cover Letter", { dateLabel: DATE });
        assert.doesNotMatch(html, /https?:\/\//);
        assert.doesNotMatch(html, /<link\b/i);
    });

    it("renders an existing candidate closing once and omits placeholder identity", () => {
        const html = generateCoverLetterHtml(LETTER_WITH_CLOSING, "Northwind", {
            candidateName: "Priya Natarajan",
            dateLabel: DATE,
        });
        assert.equal(html.split("Sincerely").length - 1, 1);
        assert.match(html, /Priya Natarajan/);
        assert.doesNotMatch(html, /Applicant/);
        assert.doesNotMatch(html, /Professional Candidate/);
        assert.doesNotMatch(html, /Zebra AI/i);
        assert.doesNotMatch(html, /Document ID/);
        assert.doesNotMatch(html, /position:\s*absolute/);
        assert.doesNotMatch(html, /position:\s*fixed/);
        assert.doesNotMatch(html, /class="footer"/);
    });

    it("uses confirmed resume identity when the letter has no closing", () => {
        const html = generateCoverLetterHtml(LETTER_WITHOUT_CLOSING, "Northwind", {
            candidateName: "Priya Natarajan",
            dateLabel: DATE,
        });
        assert.equal(html.split("Sincerely").length - 1, 1);
        assert.equal(html.split("Priya Natarajan").length - 1, 2);
        assert.doesNotMatch(html, /Applicant/);
    });

    it("ignores placeholder candidate names and account-like values", () => {
        const html = generateCoverLetterHtml(LETTER_WITHOUT_CLOSING, "Northwind", {
            candidateName: "Applicant Name",
            dateLabel: DATE,
        });
        assert.doesNotMatch(html, /Sincerely/);
        assert.doesNotMatch(html, /Applicant/);
    });

    it("wraps long names and escapes markup in the letterhead", () => {
        const longName = "Maria-José del Carmen Fernández de la Cruz <script>alert(1)</script>";
        const html = generateCoverLetterHtml(LETTER_WITHOUT_CLOSING, "Northwind", {
            candidateName: longName,
            dateLabel: DATE,
        });
        assert.match(html, /overflow-wrap:\s*anywhere/);
        assert.match(html, /Maria-José del Carmen Fernández de la Cruz/);
        assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
        assert.doesNotMatch(html, /<script>alert/);
    });

    it("paginates long letters with page margins instead of an overlapping footer", () => {
        const html = generateCoverLetterHtml(LONG_LETTER, "Northwind", {
            candidateName: "Priya Natarajan",
            dateLabel: DATE,
        });
        assert.match(html, /@page\s*\{[^}]*margin:\s*18mm 18mm 20mm 18mm/s);
        assert.doesNotMatch(html, /Confidential/);
        assert.doesNotMatch(html, /position:\s*absolute/);
        assert.equal(html.split("Sincerely").length - 1, 1);
        assert.equal(html.split("Priya Natarajan").length - 1, 2);
    });

    it("does not sign a company-block letter as the recipient company", () => {
        const html = generateCoverLetterHtml(COMPANY_BLOCK_LETTER, "Northwind", { dateLabel: DATE });
        assert.doesNotMatch(html, /Sincerely/);
        assert.equal(html.split("Northwind").length - 1, 2);
    });

    it("does not append a second closing after a Markdown sincerely line", () => {
        const html = generateCoverLetterHtml(MARKDOWN_CLOSING_LETTER, "Northwind", {
            candidateName: "Priya Natarajan",
            dateLabel: DATE,
        });
        assert.equal(html.split("Sincerely").length - 1, 1);
        assert.doesNotMatch(html, /class="signature"/);
    });
});
