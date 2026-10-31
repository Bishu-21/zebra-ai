import assert from "node:assert/strict";
import { it } from "node:test";
import { createLegacyResumeContent } from "../src/lib/resume-content";
import { generateResumeHtml } from "../src/lib/resume-renderer";

it("exports preserved text when an imported resume has no mapped sections", () => {
    const source = 'Alex Example\nSkills: TypeScript & React\n<script>alert("unsafe")</script>';
    const html = generateResumeHtml(createLegacyResumeContent(source));
    assert.ok(html.includes('Alex Example\nSkills: TypeScript &amp; React\n&lt;script&gt;alert(&quot;unsafe&quot;)&lt;/script&gt;'));
    assert.doesNotMatch(html, /<script>/);
    assert.match(html, /white-space:\s*pre-wrap/);
});

it("exports edited structured content instead of stale import text", () => {
    const content = createLegacyResumeContent("Old private source text");
    content.basics.name = "Updated Name";
    content.basics.summary = "Updated professional summary";
    const html = generateResumeHtml(content);
    assert.match(html, /Updated Name/);
    assert.match(html, /Updated professional summary/);
    assert.doesNotMatch(html, /Old private source text/);
});
