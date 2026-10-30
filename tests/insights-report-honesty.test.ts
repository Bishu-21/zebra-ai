import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const feed = readFileSync("src/components/dashboard/InsightsFeed.tsx", "utf8");
const modal = readFileSync("src/components/dashboard/ResumeResultsModal.tsx", "utf8");
const tailoring = feed.slice(feed.indexOf('if (insight.type === "tailoring")'), feed.indexOf("const feedback = insight.fullData as ResumeAnalysisData;"));

test("tailoring reports do not invent category measurements or claim ATS completion", () => {
    assert.ok(tailoring.length > 0);
    assert.doesNotMatch(tailoring, /metrics\s*:|ATS Tailoring complete/);
    assert.match(tailoring, /Role review complete\./);
});

test("missing category metrics remain absent in the report UI", () => {
    assert.match(modal, /\{data\.metrics && \(/);
    assert.match(feed, /scoreLabel=\{selectedResumeScoreLabel\}/);
    assert.match(feed, /Job description alignment \(AI estimate\)/);
    assert.match(modal, /\{scoreLabel\}/);
});
