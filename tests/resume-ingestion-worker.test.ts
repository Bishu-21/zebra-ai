import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

const worker = readFileSync("scripts/worker.ts", "utf8");
const job = readFileSync("src/lib/resume-audit-job.ts", "utf8");
const kafka = readFileSync("src/lib/kafka.ts", "utf8");
const analyse = readFileSync("src/app/api/ai/analyse/route.ts", "utf8");

describe("resume-ingestion worker", () => {
    test("consumes the same topic the analyse route publishes", () => {
        assert.match(kafka, /export const RESUME_INGESTION_TOPIC = "resume-ingestion"/);
        assert.match(analyse, /RESUME_INGESTION_TOPIC/);
        assert.match(worker, /RESUME_INGESTION_TOPIC/);
        assert.match(worker, /consumer\.subscribe\(\{ topic: RESUME_INGESTION_TOPIC, fromBeginning: false \}\)/);
    });

    test("marks jobs processing then completed, and refunds a failed audit", () => {
        assert.match(job, /updateBackgroundJobStatus\(message\.userId, message\.jobId, "processing", 10\)/);
        assert.match(job, /updateBackgroundJobStatus\(message\.userId, message\.jobId, "completed", 100, result\)/);
        assert.match(job, /updateBackgroundJobStatus\(message\.userId, message\.jobId, "failed"/);
        assert.match(job, /refundUserCredits\(message\.userId, 1\)/);
        assert.match(job, /if \(job\.status === "completed" \|\| job\.status === "failed"\) return "skipped"/);
    });

    test("abandons unstarted resume audits and refunds once", () => {
        const abandon = readFileSync("src/app/api/jobs/[id]/abandon/route.ts", "utf8");
        const ops = readFileSync("src/lib/background-ops.ts", "utf8");
        assert.match(abandon, /failPendingBackgroundJob/);
        assert.match(abandon, /refundUserCredits\(authCtx\.user\.id, 1\)/);
        assert.match(abandon, /operationType !== "resume_audit"/);
        assert.match(ops, /eq\(backgroundJobs\.status, "pending"\)/);
    });

    test("runs the extracted Azure Foundry audit instead of the HTTP route", () => {
        assert.match(job, /generateAiResponse\(\{/);
        assert.match(job, /task: "audit"/);
        assert.doesNotMatch(analyse, /generateAiResponse/);
        assert.match(worker, /handleResumeIngestionMessage\(raw, \{ heartbeat \}\)/);
        assert.match(worker, /sessionTimeout: 360_000/);
    });
});
