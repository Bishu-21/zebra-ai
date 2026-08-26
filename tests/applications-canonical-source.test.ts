import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

const trackerSource = readFileSync("src/app/dashboard/job-tracker/page.tsx", "utf8");
const analyticsSource = readFileSync("src/app/dashboard/analytics/page.tsx", "utf8");

describe("Canonical application data", () => {
    test("tracker shows legacy records without changing the canonical analytics source", () => {
        assert.match(trackerSource, /db\.select\(\)\.from\(applicationsTable\)/);
        assert.match(trackerSource, /db\.select\(\)\.from\(jobsTable\)/);
        assert.match(trackerSource, /\.limit\(pageLimit \+ 1\)/);
        assert.match(trackerSource, /View older applications/);
        assert.match(trackerSource, /recordType: "job" as const/);
        assert.match(analyticsSource, /db\.query\.applications\.findMany/);
        assert.doesNotMatch(analyticsSource, /db\.query\.jobs|jobs as jobsTable/);
    });
});
