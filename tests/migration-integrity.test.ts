import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

const migrationPath = new URL("../drizzle/0005_evidence_compiler_platform.sql", import.meta.url);
const rateLimitMigrationPath = new URL("../drizzle/0006_distributed_rate_limits.sql", import.meta.url);
const journalPath = new URL("../drizzle/meta/_journal.json", import.meta.url);

describe("Evidence compiler migration", () => {
    test("creates every platform table used by the canonical schema", () => {
        const sql = readFileSync(migrationPath, "utf8");
        const tables = [
            "evidence_nodes",
            "job_requirement_matrices",
            "preflight_checks",
            "background_jobs",
            "document_artifacts",
        ];

        for (const table of tables) {
            assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS "${table}"`));
        }
    });

    test("creates the shared production rate-limit table", () => {
        const sql = readFileSync(rateLimitMigrationPath, "utf8");
        assert.match(sql, /CREATE TABLE IF NOT EXISTS "rate_limit_buckets"/);
        assert.match(sql, /"key" text PRIMARY KEY NOT NULL/);
    });

    test("registers every new migration after the existing journal entries", () => {
        const journal = JSON.parse(readFileSync(journalPath, "utf8")) as {
            entries: Array<{ idx: number; tag: string }>;
        };
        const last = journal.entries.at(-1);

        assert.equal(last?.idx, 6);
        assert.equal(last?.tag, "0006_distributed_rate_limits");
    });
});
