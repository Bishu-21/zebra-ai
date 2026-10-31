import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
    isQueuedAnalysisResponse,
    pollResumeAnalysisJob,
    resolveResumeAnalysisResponse,
} from "../src/lib/analysis-job-poll";

const analysis = { summary: "Strong projects, missing metrics." };

function jsonResponse(body: unknown, status = 200): Response {
    return Response.json(body, { status });
}

describe("resume analysis job polling", () => {
    test("treats HTTP 202 and pending jobId payloads as queued", () => {
        assert.equal(isQueuedAnalysisResponse(202, { jobId: "job_1", status: "pending" }), true);
        assert.equal(isQueuedAnalysisResponse(200, { jobId: "job_1", status: "pending" }), true);
        assert.equal(isQueuedAnalysisResponse(200, { analysis, resumeId: "resume_1" }), false);
    });

    test("returns a synchronous analysis payload without polling", async () => {
        const outcome = await resolveResumeAnalysisResponse(
            jsonResponse({ analysis, resumeId: "resume_1" }),
            { fetchImpl: async () => { throw new Error("should not poll"); } },
        );
        assert.deepEqual(outcome, { analysis, resumeId: "resume_1" });
    });

    test("polls until completed and reads job.result", async () => {
        const responses = [
            jsonResponse({ job: { status: "processing", progressPercent: 10 } }),
            jsonResponse({ job: { status: "completed", result: { analysis, resumeId: "resume_queued" } } }),
        ];
        const outcome = await pollResumeAnalysisJob("job_1", "resume_fallback", {
            fetchImpl: async () => responses.shift()!,
            sleep: async () => undefined,
            now: () => 0,
        });
        assert.deepEqual(outcome, { analysis, resumeId: "resume_queued" });
    });

    test("stops on failed jobs and uses the job error message", async () => {
        await assert.rejects(
            pollResumeAnalysisJob("job_1", undefined, {
                fetchImpl: async () => jsonResponse({
                    job: { status: "failed", errorMessage: "Azure timed out" },
                }),
                sleep: async () => undefined,
                now: () => 0,
            }),
            /Azure timed out/,
        );
    });

    test("times out after three minutes and abandons the queued job", async () => {
        let now = 0;
        const urls: string[] = [];
        await assert.rejects(
            pollResumeAnalysisJob("job_1", undefined, {
                fetchImpl: async (input, init) => {
                    const url = String(input);
                    urls.push(`${init?.method ?? "GET"} ${url}`);
                    if (url.includes("/abandon")) {
                        return jsonResponse({ success: true, refunded: true });
                    }
                    return jsonResponse({ job: { status: "pending" } });
                },
                sleep: async () => { now = 180_001; },
                now: () => now,
                timeoutMs: 180_000,
            }),
            /timed out before it started.*credit was refunded/i,
        );
        assert.ok(urls.some((entry) => entry.includes("POST") && entry.includes("/api/jobs/job_1/abandon")));
    });

    test("abandons a pending job when the poller is cancelled", async () => {
        const controller = new AbortController();
        controller.abort();
        await assert.rejects(
            pollResumeAnalysisJob("job_1", undefined, {
                signal: controller.signal,
                fetchImpl: async (input) => {
                    if (String(input).includes("/abandon")) {
                        return jsonResponse({ success: true, refunded: true });
                    }
                    throw new Error("should not poll status after abort");
                },
            }),
            /cancelled.*credit was refunded/i,
        );
    });
});
