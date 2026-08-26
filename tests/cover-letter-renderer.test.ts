import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateCoverLetterHtml } from "../src/lib/cover-letter-renderer";

describe("Cover letter PDF renderer", () => {
    it("escapes document content and title before rendering", () => {
        const html = generateCoverLetterHtml('<img src="https://evil.test/x" onerror="alert(1)"> **safe**', "</title><script>alert(1)</script>");
        assert.doesNotMatch(html, /<script>|<img src=/);
        assert.match(html, /&lt;img src=&quot;https:\/\/evil\.test\/x&quot;/);
        assert.match(html, /<strong>safe<\/strong>/);
    });

    it("does not load remote fonts or other external assets", () => {
        const html = generateCoverLetterHtml("Hello", "Cover Letter");
        assert.doesNotMatch(html, /https?:\/\//);
        assert.doesNotMatch(html, /<link\b/i);
    });
});
