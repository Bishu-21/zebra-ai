import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import { isTransientDbError } from "../src/lib/db-errors";

describe("Transient database error classification", () => {
    test("retries the observed Neon fetch connect timeout", () => {
        const nested = new Error("Connect Timeout Error");
        (nested as Error & { code: string }).code = "UND_ERR_CONNECT_TIMEOUT";
        const error = new Error("Error connecting to database: TypeError: fetch failed");
        (error as Error & { cause: unknown }).cause = nested;

        assert.equal(isTransientDbError(error), true);
        assert.equal(isTransientDbError(new Error("Connect Timeout Error")), true);
        assert.equal(isTransientDbError(new Error("TypeError: fetch failed")), true);
    });

    test("does not retry application and constraint failures", () => {
        assert.equal(isTransientDbError(new Error("duplicate key value violates unique constraint")), false);
        assert.equal(isTransientDbError(new Error("Unauthorized")), false);
        assert.equal(isTransientDbError(null), false);
    });

    test("session lookup uses the shared classifier including connect timeout", () => {
        const authHelpers = readFileSync("src/lib/auth-helpers.ts", "utf8");
        const dbSource = readFileSync("src/lib/db.ts", "utf8");
        const authSource = readFileSync("src/lib/auth.ts", "utf8");
        assert.match(authHelpers, /isTransientDbError\(error\)/);
        assert.match(authHelpers, /SESSION_LOOKUP_TIMEOUT_MS = 8_000/);
        assert.match(authHelpers, /export async function getDashboardSession/);
        assert.match(authHelpers, /void operation\.catch\(\(\) => undefined\)/);
        assert.match(dbSource, /AbortSignal\.timeout\(NEON_FETCH_TIMEOUT_MS\)/);
        assert.match(authSource, /maxAge: 300/);
        assert.doesNotMatch(authHelpers, /suppressHydrationWarning/);
    });
});
