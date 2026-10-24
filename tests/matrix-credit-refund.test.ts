import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import { NextResponse } from "next/server";
import { withRequestPolicy } from "../src/lib/request-policy";
import { testStore } from "../src/lib/test-store";
import { POST as matrixPost } from "../src/app/api/applications/[id]/matrix/route";

const USER_ID = "usr_matrix_credits";
const env = process.env as Record<string, string | undefined>;
const previousAuthUser = process.env.TEST_AUTH_USER_ID;

function seedCredits(balance: number) {
    testStore.credits.set(USER_ID, balance);
    testStore.creditRefunds.set(USER_ID, 0);
}

function seedOwnedApplication(id: string, userId = USER_ID) {
    const now = new Date();
    testStore.applications.set(id, {
        id,
        userId,
        company: "Acme",
        position: "Engineer",
        jobDescription: "Need React and TypeScript experience.",
        status: "Draft",
        selectedWorkIds: [],
        createdAt: now,
        updatedAt: now,
    });
}

beforeEach(() => {
    testStore.clear();
    env.TEST_AUTH_USER_ID = USER_ID;
});

afterEach(() => {
    testStore.clear();
    env.TEST_AUTH_USER_ID = previousAuthUser;
});

describe("withRequestPolicy credit settlement", () => {
    test("returns 404 from a handler without consuming the reserved credit", async () => {
        seedCredits(5);
        const POST = withRequestPolicy(
            { requireAuth: true, creditCost: 1, operationName: "matrix-404" },
            async () => NextResponse.json({ error: "Application not found" }, { status: 404 }),
        );

        const response = await POST(new Request("http://localhost/api/applications/missing/matrix", { method: "POST" }));

        assert.equal(response.status, 404);
        assert.equal(testStore.credits.get(USER_ID), 5);
        assert.equal(testStore.creditRefunds.get(USER_ID), 1);
    });

    test("refunds a handler throw once and leaves the balance unchanged", async () => {
        seedCredits(5);
        const POST = withRequestPolicy(
            { requireAuth: true, creditCost: 1, operationName: "matrix-throw" },
            async () => {
                throw new Error("synthetic compile failure");
            },
        );

        const response = await POST(new Request("http://localhost/api/applications/app/matrix", { method: "POST" }));

        assert.equal(response.status, 500);
        assert.equal(testStore.credits.get(USER_ID), 5);
        assert.equal(testStore.creditRefunds.get(USER_ID), 1);
    });

    test("keeps the one-credit charge on success", async () => {
        seedCredits(5);
        const POST = withRequestPolicy(
            { requireAuth: true, creditCost: 1, operationName: "matrix-success" },
            async () => NextResponse.json({ ok: true }),
        );

        const response = await POST(new Request("http://localhost/api/applications/app/matrix", { method: "POST" }));

        assert.equal(response.status, 200);
        assert.equal(testStore.credits.get(USER_ID), 4);
        assert.equal(testStore.creditRefunds.get(USER_ID) ?? 0, 0);
    });

    test("does not reserve credits for an unauthenticated request", async () => {
        seedCredits(5);
        env.TEST_AUTH_USER_ID = "UNAUTHENTICATED";
        const POST = withRequestPolicy(
            { requireAuth: true, creditCost: 1, operationName: "matrix-unauth" },
            async () => NextResponse.json({ ok: true }),
        );

        const response = await POST(new Request("http://localhost/api/applications/app/matrix", { method: "POST" }));

        assert.equal(response.status, 401);
        assert.equal(testStore.credits.get(USER_ID), 5);
        assert.equal(testStore.creditRefunds.get(USER_ID) ?? 0, 0);
    });

    test("does not charge when the user has no credits", async () => {
        seedCredits(0);
        const POST = withRequestPolicy(
            { requireAuth: true, creditCost: 1, operationName: "matrix-empty" },
            async () => NextResponse.json({ ok: true }),
        );

        const response = await POST(new Request("http://localhost/api/applications/app/matrix", { method: "POST" }));

        assert.equal(response.status, 402);
        assert.equal(testStore.credits.get(USER_ID), 0);
        assert.equal(testStore.creditRefunds.get(USER_ID) ?? 0, 0);
    });
});

describe("POST /api/applications/[id]/matrix credits", () => {
    test("returns 404 for a missing application without losing credits", async () => {
        seedCredits(5);
        const response = await matrixPost(
            new Request("http://localhost/api/applications/11111111-1111-4111-8111-111111111111/matrix", { method: "POST" }),
        );

        assert.equal(response.status, 404);
        assert.equal(testStore.credits.get(USER_ID), 5);
        assert.equal(testStore.creditRefunds.get(USER_ID), 1);
    });

    test("returns 404 for a foreign application without losing credits", async () => {
        seedCredits(5);
        seedOwnedApplication("app_foreign", "usr_other");

        const response = await matrixPost(
            new Request("http://localhost/api/applications/app_foreign/matrix", { method: "POST" }),
        );

        assert.equal(response.status, 404);
        assert.equal(testStore.credits.get(USER_ID), 5);
        assert.equal(testStore.creditRefunds.get(USER_ID), 1);
    });

    test("keeps one credit after a successful compile for an owned application", async () => {
        seedCredits(5);
        seedOwnedApplication("app_owned");

        const response = await matrixPost(
            new Request("http://localhost/api/applications/app_owned/matrix", { method: "POST" }),
        );

        assert.equal(response.status, 200);
        assert.equal(testStore.credits.get(USER_ID), 4);
        assert.equal(testStore.creditRefunds.get(USER_ID) ?? 0, 0);
        const body = await response.json() as { canonicalHtmlArtifactId?: string };
        assert.ok(body.canonicalHtmlArtifactId);
    });
});
