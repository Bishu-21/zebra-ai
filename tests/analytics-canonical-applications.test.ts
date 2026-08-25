import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

const analyticsSource = readFileSync("src/app/dashboard/analytics/page.tsx", "utf8");

describe("Analytics application metrics", () => {
    test("uses canonical applications rather than the legacy jobs table", () => {
        assert.match(analyticsSource, /applications as applicationsTable/);
        assert.match(analyticsSource, /db\.query\.applications\.findMany/);
        assert.doesNotMatch(analyticsSource, /jobs as jobsTable|db\.query\.jobs/);
    });

    test("counts all active records and limits only recent activity", () => {
        assert.match(analyticsSource, /activeApplications\.length/);
        assert.match(analyticsSource, /userApplications\.slice\(0, 5\)/);
        assert.doesNotMatch(analyticsSource, /findMany\(\{[\s\S]*?limit: 5[\s\S]*?\}\)/);
    });
});
