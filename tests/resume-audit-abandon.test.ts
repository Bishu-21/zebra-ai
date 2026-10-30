import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import { NextRequest } from "next/server";
import { POST as abandonJob } from "../src/app/api/jobs/[id]/abandon/route";
import { testStore } from "../src/lib/test-store";
import type { BackgroundJobRecord } from "../src/lib/background-ops";

const USER_ID = "usr_abandon_credits";
const env = process.env as Record<string, string | undefined>;
const previousAuthUser = process.env.TEST_AUTH_USER_ID;

function pendingJob(overrides: Partial<BackgroundJobRecord> = {}): BackgroundJobRecord {
    const now = new Date();
    return {
        id: "job_pending_1",
        userId: USER_ID,
        applicationId: null,
        operationType: "resume_audit",
        status: "pending",
        progressPercent: 0,
        payload: { resumeId: "resume_1" },
        result: null,
        errorMessage: null,
        startedAt: null,
        completedAt: null,
        createdAt: now,
        updatedAt: now,
        ...overrides,
    };
}

beforeEach(() => {
    testStore.clear();
    env.TEST_AUTH_USER_ID = USER_ID;
    env.NODE_ENV = "test";
    testStore.credits.set(USER_ID, 1);
    testStore.creditRefunds.set(USER_ID, 0);
});

afterEach(() => {
    testStore.clear();
    env.TEST_AUTH_USER_ID = previousAuthUser;
});

describe("resume audit job abandon", () => {
    test("refunds a pending resume_audit once and marks it failed", async () => {
        testStore.backgroundJobs.set("job_pending_1", pendingJob());
        const req = new NextRequest("http://localhost/api/jobs/job_pending_1/abandon", { method: "POST" });
        const first = await abandonJob(req, { params: Promise.resolve({ id: "job_pending_1" }) });
        const firstBody = await first.json() as { refunded: boolean; status: string };
        assert.equal(first.status, 200);
        assert.equal(firstBody.refunded, true);
        assert.equal(firstBody.status, "failed");
        assert.equal(testStore.credits.get(USER_ID), 2);
        assert.equal(testStore.creditRefunds.get(USER_ID), 1);
        assert.equal(testStore.backgroundJobs.get("job_pending_1")?.status, "failed");

        const second = await abandonJob(req, { params: Promise.resolve({ id: "job_pending_1" }) });
        const secondBody = await second.json() as { refunded: boolean };
        assert.equal(secondBody.refunded, false);
        assert.equal(testStore.credits.get(USER_ID), 2);
        assert.equal(testStore.creditRefunds.get(USER_ID), 1);
    });

    test("does not refund a processing job", async () => {
        testStore.backgroundJobs.set("job_busy", pendingJob({ id: "job_busy", status: "processing" }));
        const req = new NextRequest("http://localhost/api/jobs/job_busy/abandon", { method: "POST" });
        const res = await abandonJob(req, { params: Promise.resolve({ id: "job_busy" }) });
        const body = await res.json() as { refunded: boolean; status: string };
        assert.equal(body.refunded, false);
        assert.equal(body.status, "processing");
        assert.equal(testStore.credits.get(USER_ID), 1);
        assert.equal(testStore.creditRefunds.get(USER_ID), 0);
    });
});
