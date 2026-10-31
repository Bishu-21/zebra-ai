import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

const dashboardSource = readFileSync("src/app/dashboard/page.tsx", "utf8");

describe("Dashboard task hierarchy", () => {
    test("keeps one next action and two visible secondary destinations", () => {
        assert.match(dashboardSource, /nextAction\.actionHref/);
        assert.match(dashboardSource, />Manage resumes</);
        assert.match(dashboardSource, />View applications</);
    });

    test("shows import then review as the visible prepare path", () => {
        assert.doesNotMatch(dashboardSource, />More tools</);
        const importAt = dashboardSource.indexOf("<ImportResume");
        const analyzeAt = dashboardSource.indexOf("<AnalyzeResume");
        assert.ok(importAt > 0 && analyzeAt > importAt);
        assert.match(dashboardSource, /<ProjectAnalyzerCard \/>/);
        const analyzer = readFileSync("src/components/dashboard/ProjectAnalyzerCard.tsx", "utf8");
        assert.match(analyzer, /featureChrome\.dialog/);
        assert.match(analyzer, /role="dialog"/);
        assert.match(analyzer, /aria-label="Close project check"/);
        assert.match(analyzer, /useDialogFocus/);
        assert.match(dashboardSource, /Saved matches/);
    });
});
