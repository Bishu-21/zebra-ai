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

    test("moves supporting tools and activity behind an accessible disclosure", () => {
        assert.match(dashboardSource, /<details[^>]*>/);
        assert.match(dashboardSource, /<summary[^>]*>/);
        assert.match(dashboardSource, />More tools</);
        assert.match(dashboardSource, /<AnalyzeResume \/>/);
        assert.match(dashboardSource, /<ProjectAnalyzerCard \/>/);
    });
});
