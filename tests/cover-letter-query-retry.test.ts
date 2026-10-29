import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

const workspaceSource = readFileSync("src/lib/cover-letter-workspace.ts", "utf8");
const pageSource = readFileSync("src/app/dashboard/cover-letters/page.tsx", "utf8");
const routeSource = readFileSync("src/app/api/cover-letters/route.ts", "utf8");

describe("Cover letter query retry", () => {
    test("page data loading retries transient Neon failures", () => {
        assert.match(workspaceSource, /executeWithDbRetry/);
        assert.match(workspaceSource, /\[cover-letters\] query_ms=/);
        assert.doesNotMatch(workspaceSource, /userId=/);
        assert.doesNotMatch(workspaceSource, /DATABASE_POOL_MAX|poolQueryViaFetch|connectionTimeoutMillis/);
        assert.match(pageSource, /loadCoverLetterWorkspace\(userId, rawCursor\)/);
    });

    test("list API retries transient Neon failures", () => {
        assert.match(routeSource, /executeWithDbRetry\(\(\) => db\.select\(\)\.from\(coverLettersTable\)/);
    });

    test("does not change authorization or ownership filters", () => {
        assert.match(workspaceSource, /eq\(resumesTable\.userId, userId\)/);
        assert.match(workspaceSource, /eq\(coverLettersTable\.userId, userId\)/);
        assert.match(routeSource, /eq\(coverLettersTable\.userId, session\.user\.id\)/);
    });
});
