import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

const migrationPath = new URL("../drizzle/0005_evidence_compiler_platform.sql", import.meta.url);
const coreBaselineMigrationPath = new URL("../drizzle/0000_core_entities_baseline.sql", import.meta.url);
const rateLimitMigrationPath = new URL("../drizzle/0006_distributed_rate_limits.sql", import.meta.url);
const careerProfileMigrationPath = new URL("../drizzle/0007_career_profile.sql", import.meta.url);
const certificationVisibilityMigrationPath = new URL("../drizzle/0008_certification_visibility.sql", import.meta.url);
const resumeRevisionMigrationPath = new URL("../drizzle/0009_resume_revision.sql", import.meta.url);
const aiUsageObservabilityMigrationPath = new URL("../drizzle/0010_ai_usage_observability.sql", import.meta.url);
const tailoringRunsMigrationPath = new URL("../drizzle/0011_tailoring_runs.sql", import.meta.url);
const journalPath = new URL("../drizzle/meta/_journal.json", import.meta.url);
const retiredPushPath = new URL("../src/scripts/push.js", import.meta.url);
const retiredSyncPath = new URL("../src/scripts/sync-db.mjs", import.meta.url);

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

    test("creates legacy core entities before migrations that alter them", () => {
        const sql = readFileSync(coreBaselineMigrationPath, "utf8");
        for (const table of ["resumes", "analysis", "jobs", "cover_letters", "ats_optimisations"]) {
            assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS "${table}"`));
        }
        const journal = JSON.parse(readFileSync(journalPath, "utf8")) as { entries: Array<{ tag: string }> };
        assert.ok(journal.entries.findIndex(entry => entry.tag === "0000_core_entities_baseline") < journal.entries.findIndex(entry => entry.tag === "0001_numerous_gladiator"));
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

        const careerSql = readFileSync(careerProfileMigrationPath, "utf8");
        assert.match(careerSql, /"career_profile_status" text DEFAULT 'pending' NOT NULL/);
        assert.match(careerSql, /"professional_experience_years" integer/);
        const visibilitySql = readFileSync(certificationVisibilityMigrationPath, "utf8");
        assert.match(visibilitySql, /ADD COLUMN IF NOT EXISTS "is_public" boolean DEFAULT false NOT NULL/);
        const revisionSql = readFileSync(resumeRevisionMigrationPath, "utf8");
        assert.match(revisionSql, /ADD COLUMN IF NOT EXISTS "revision" integer DEFAULT 0 NOT NULL/);
        const usageSql = readFileSync(aiUsageObservabilityMigrationPath, "utf8");
        assert.match(usageSql, /ADD COLUMN IF NOT EXISTS "latency_ms" integer/);
        const runsSql = readFileSync(tailoringRunsMigrationPath, "utf8");
        assert.match(runsSql, /CREATE TABLE IF NOT EXISTS "tailoring_runs"/);
        assert.equal(last?.idx, 12);
        assert.equal(last?.tag, "0011_tailoring_runs");
    });

    test("quarantines direct schema scripts that bypass the migration journal", () => {
        for (const path of [retiredPushPath, retiredSyncPath]) {
            const source = readFileSync(path, "utf8");
            assert.match(source, /retired/);
            assert.match(source, /npm run db:prepare/);
            assert.doesNotMatch(source, /sql\.unsafe|neon\(process\.env\.DATABASE_URL/);
        }
    });
});
