import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

const trackerSource = readFileSync("src/app/dashboard/job-tracker/page.tsx", "utf8");
const analyticsSource = readFileSync("src/app/dashboard/analytics/page.tsx", "utf8");

describe("Canonical application data", () => {
    test("tracker and analytics both read applications", () => {
        assert.match(trackerSource, /db\.query\.applications\.findMany/);
        assert.match(analyticsSource, /db\.query\.applications\.findMany/);
        assert.doesNotMatch(trackerSource, /db\.query\.jobs|jobs as jobsTable/);
        assert.doesNotMatch(analyticsSource, /db\.query\.jobs|jobs as jobsTable/);
    });
});
