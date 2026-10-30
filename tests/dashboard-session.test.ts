import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

const pages = [
    "src/app/dashboard/resumes/page.tsx",
    "src/app/dashboard/resumes/[id]/page.tsx",
    "src/app/dashboard/analytics/page.tsx",
    "src/app/dashboard/linkedin/page.tsx",
    "src/app/dashboard/portfolio/page.tsx",
    "src/app/dashboard/cover-letters/page.tsx",
    "src/app/dashboard/job-tracker/page.tsx",
    "src/app/dashboard/applications/[id]/page.tsx",
    "src/app/dashboard/page.tsx",
];

describe("dashboard session lookups", () => {
    test("pages use the timeout-aware helper instead of a raw Better Auth query", () => {
        for (const page of pages) {
            const source = readFileSync(page, "utf8");
            assert.match(source, /getDashboardSession/, page);
            assert.doesNotMatch(source, /auth\.api\.getSession/, page);
        }
        const layout = readFileSync("src/app/dashboard/layout.tsx", "utf8");
        assert.match(layout, /getSafeSession/);
        assert.match(layout, /Session service unavailable/);
    });
});
