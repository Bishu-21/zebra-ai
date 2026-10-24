import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { generateCoverLetterHtml } from "../src/lib/cover-letter-renderer";

describe("Cover letter PDF renderer", () => {
    it("escapes document content and title before rendering", () => {
        const html = generateCoverLetterHtml('<img src="https://evil.test/x" onerror="alert(1)"> **safe**', "</title><script>alert(1)</script>", { dateLabel: "January 15, 2026" });
        assert.doesNotMatch(html, /<script>|<img src=/);
        assert.match(html, /&lt;img src=&quot;https:\/\/evil\.test\/x&quot;/);
        assert.match(html, /<strong>safe<\/strong>/);
    });

    it("does not load remote fonts or other external assets", () => {
        const html = generateCoverLetterHtml("Hello", "Cover Letter", { dateLabel: "January 15, 2026" });
        assert.doesNotMatch(html, /https?:\/\//);
        assert.doesNotMatch(html, /<link\b/i);
    });

    it("does not infer identity from the signed-in account in the export route", () => {
        const route = readFileSync("src/app/api/export/pdf/cover-letter/route.ts", "utf8");
        assert.match(route, /requireAuth/);
        assert.match(route, /getUserOwnedResume/);
        assert.match(route, /candidateNameFromStoredResume/);
        assert.doesNotMatch(route, /auth\.user\.name|session\.user\.name/);
        assert.doesNotMatch(route, /body\.candidateName/);
    });
});
