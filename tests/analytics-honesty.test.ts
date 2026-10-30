import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const analytics = readFileSync("src/app/dashboard/analytics/page.tsx", "utf8");
const tracker = readFileSync("src/app/dashboard/job-tracker/page.tsx", "utf8");

test("analytics does not label general resume scores as ATS or job-match scores", () => {
    assert.doesNotMatch(analytics, /Average Match Score|ATS Alignment Score/);
    assert.match(analytics, /Average resume review/);
    assert.match(analytics, /Based on your saved resume reviews/);
    assert.match(analytics, /avgScore == null \? "No reviews yet"/);
    assert.match(analytics, /min-w-0 space-y-2/);
    assert.doesNotMatch(analytics, /\[0, 0, 0, 0, 0, 0, 0, 0, 0, 0\]/);
});

test("interview rate stays unknown when there are no applications", () => {
    assert.match(tracker, /: "Unknown"/);
});
