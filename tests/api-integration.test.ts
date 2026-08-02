import { test, describe, before, after } from "node:test";
import assert from "node:assert";
import { NextRequest } from "next/server";
import { testStore } from "../src/lib/test-store";
import { GET as getApps, POST as createApp, PATCH as patchApp, DELETE as deleteApp } from "../src/app/api/applications/route";
import { POST as createChange, PATCH as patchChange } from "../src/app/api/applications/changes/route";

describe("Real Application & Database Integration Test Suite [Integration Test]", () => {
    let userAId: string;
    let userBId: string;
    let resumeAId: string;
    let resumeBId: string;
    let workAId: string;
    let workBId: string;
    let createdAppId: string;
    let changeId: string;

    const sampleResumeContent = JSON.stringify({
        basics: {
            name: "User A Developer",
            email: "usera@example.com",
            summary: "Experienced Full Stack Engineer",
        },
        experience: [
            {
                id: 1,
                role: "Full Stack Engineer",
                company: "Tech Corp",
                highlights: [
                    "Developed React web applications",
                    "Optimized SQL query performance"
                ]
            }
        ],
        skills: [
            { id: 1, category: "Technical", items: "TypeScript, React, Node.js" }
        ]
    }, null, 2);

    before(() => {
        userAId = `usr_int_A_${Date.now()}`;
        userBId = `usr_int_B_${Date.now()}`;
        resumeAId = `res_int_A_${Date.now()}`;
        resumeBId = `res_int_B_${Date.now()}`;
        workAId = `work_int_A_${Date.now()}`;
        workBId = `work_int_B_${Date.now()}`;

        // Seed initial test data in testStore
        testStore.users.set(userAId, { id: userAId, name: "User A Integration", email: `${userAId}@example.com` });
        testStore.users.set(userBId, { id: userBId, name: "User B Integration", email: `${userBId}@example.com` });

        testStore.resumes.set(resumeAId, { id: resumeAId, userId: userAId, title: "User A Resume", content: sampleResumeContent });
        testStore.resumes.set(resumeBId, { id: resumeBId, userId: userBId, title: "User B Resume", content: sampleResumeContent });

        testStore.workItems.set(workAId, { id: workAId, userId: userAId, title: "Dev Work A", category: "Project" });
        testStore.workItems.set(workBId, { id: workBId, userId: userBId, title: "Dev Work B", category: "Project" });
    });

    after(() => {
        testStore.clear();
        delete process.env.TEST_AUTH_USER_ID;
    });

    test("1. Application Creation (POST /api/applications)", async () => {
        process.env.TEST_AUTH_USER_ID = userAId;

        const req = new NextRequest("http://localhost:3000/api/applications", {
            method: "POST",
            body: JSON.stringify({
                company: "Stripe",
                position: "Senior Infrastructure Engineer",
                selectedResumeId: resumeAId,
                selectedWorkIds: [workAId],
                notes: "Initial application draft"
            }),
            headers: { "Content-Type": "application/json" }
        });

        const res = await createApp(req);
        assert.strictEqual(res.status, 200, "Creation should return HTTP 200");

        const json = await res.json();
        assert.ok(json.application);
        assert.strictEqual(json.application.company, "Stripe");
        assert.strictEqual(json.application.position, "Senior Infrastructure Engineer");
        assert.strictEqual(json.application.status, "Draft");

        createdAppId = json.application.id;

        // Verify record in database store
        const dbRecord = testStore.applications.get(createdAppId);
        assert.ok(dbRecord, "Record must exist in database store");
        assert.strictEqual(dbRecord.userId, userAId);
        assert.strictEqual(dbRecord.selectedResumeId, resumeAId);
    });

    test("2. Application Retrieval (GET /api/applications)", async () => {
        process.env.TEST_AUTH_USER_ID = userAId;

        // Single retrieval
        const reqSingle = new NextRequest(`http://localhost:3000/api/applications?id=${createdAppId}`);
        const resSingle = await getApps(reqSingle);
        assert.strictEqual(resSingle.status, 200);

        const jsonSingle = await resSingle.json();
        assert.ok(jsonSingle.application);
        assert.strictEqual(jsonSingle.application.id, createdAppId);

        // List retrieval
        const reqList = new NextRequest("http://localhost:3000/api/applications");
        const resList = await getApps(reqList);
        assert.strictEqual(resList.status, 200);

        const jsonList = await resList.json();
        assert.ok(Array.isArray(jsonList.applications));
        assert.strictEqual(jsonList.applications.length, 1);
    });

    test("3. Application Update & Valid Transition (PATCH /api/applications)", async () => {
        process.env.TEST_AUTH_USER_ID = userAId;

        const req = new NextRequest("http://localhost:3000/api/applications", {
            method: "PATCH",
            body: JSON.stringify({
                id: createdAppId,
                status: "Preparing",
                notes: "Attaching resume and preparing materials"
            }),
            headers: { "Content-Type": "application/json" }
        });

        const res = await patchApp(req);
        assert.strictEqual(res.status, 200);

        const json = await res.json();
        assert.strictEqual(json.application.status, "Preparing");

        // Verify database updated
        const dbRecord = testStore.applications.get(createdAppId);
        assert.strictEqual(dbRecord?.status, "Preparing");
    });

    test("4. Invalid Status Transition Returns HTTP 400 Bad Request", async () => {
        process.env.TEST_AUTH_USER_ID = userAId;

        // Try transitioning directly from Preparing to Interviewing without being Applied
        const req = new NextRequest("http://localhost:3000/api/applications", {
            method: "PATCH",
            body: JSON.stringify({
                id: createdAppId,
                status: "Interviewing"
            }),
            headers: { "Content-Type": "application/json" }
        });

        const res = await patchApp(req);
        assert.strictEqual(res.status, 400, "Shortcut transition to Interviewing must return HTTP 400");

        const json = await res.json();
        assert.ok(json.error);
        assert.match(json.error, /must be in "Applied" status first/);
    });

    test("5. Cross-User Access Rejection (User B cannot read User A's application)", async () => {
        process.env.TEST_AUTH_USER_ID = userBId; // Switch context to User B

        const req = new NextRequest(`http://localhost:3000/api/applications?id=${createdAppId}`);
        const res = await getApps(req);
        assert.strictEqual(res.status, 404, "Accessing another user's record MUST return HTTP 404");

        const json = await res.json();
        assert.strictEqual(json.error, "Application not found");
    });

    test("6. Linked Resume Ownership Validation (User A cannot attach User B's resume)", async () => {
        process.env.TEST_AUTH_USER_ID = userAId;

        const req = new NextRequest("http://localhost:3000/api/applications", {
            method: "POST",
            body: JSON.stringify({
                company: "Google",
                position: "Tech Lead",
                selectedResumeId: resumeBId // Belongs to User B!
            }),
            headers: { "Content-Type": "application/json" }
        });

        const res = await createApp(req);
        assert.strictEqual(res.status, 404, "Attaching another user's resume MUST return HTTP 404");

        const json = await res.json();
        assert.strictEqual(json.error, "Selected resume not found");
    });

    test("7. Linked Work Ownership Validation (User A cannot link User B's work item)", async () => {
        process.env.TEST_AUTH_USER_ID = userAId;

        const req = new NextRequest("http://localhost:3000/api/applications", {
            method: "POST",
            body: JSON.stringify({
                company: "Meta",
                position: "Staff Engineer",
                selectedWorkIds: [workBId] // Belongs to User B!
            }),
            headers: { "Content-Type": "application/json" }
        });

        const res = await createApp(req);
        assert.strictEqual(res.status, 404, "Linking another user's work item MUST return HTTP 404");

        const json = await res.json();
        assert.strictEqual(json.error, "One or more selected work items not found");
    });

    test("8. Suggestion Creation (POST /api/applications/changes)", async () => {
        process.env.TEST_AUTH_USER_ID = userAId;

        const req = new NextRequest("http://localhost:3000/api/applications/changes", {
            method: "POST",
            body: JSON.stringify({
                applicationId: createdAppId,
                section: "experience",
                changeType: "modify",
                originalText: "Optimized SQL query performance",
                suggestedText: "Optimized PostgreSQL query execution plans, boosting throughput by 45%"
            }),
            headers: { "Content-Type": "application/json" }
        });

        const res = await createChange(req);
        assert.strictEqual(res.status, 200);

        const json = await res.json();
        assert.ok(json.change);
        assert.strictEqual(json.change.status, "pending");

        changeId = json.change.id;
    });

    test("9. Suggestion Approval & Tailored Resume Version Inspection", async () => {
        process.env.TEST_AUTH_USER_ID = userAId;

        const req = new NextRequest("http://localhost:3000/api/applications/changes", {
            method: "PATCH",
            body: JSON.stringify({
                id: changeId,
                status: "approved"
            }),
            headers: { "Content-Type": "application/json" }
        });

        const res = await patchChange(req);
        assert.strictEqual(res.status, 200);

        // Fetch application from testStore to get linked resumeVersionId
        const updatedApp = testStore.applications.get(createdAppId);
        assert.ok(updatedApp?.resumeVersionId, "Approval MUST create and link a resume version ID");

        // Inspect actual tailored resume version JSON content in testStore
        const tailoredVersion = testStore.resumeVersions.get(updatedApp.resumeVersionId);
        assert.ok(tailoredVersion, "Tailored version MUST exist in DB");

        const parsedContent = JSON.parse(tailoredVersion.content);
        assert.strictEqual(
            parsedContent.experience[0].highlights[1],
            "Optimized PostgreSQL query execution plans, boosting throughput by 45%",
            "Tailored version content in DB MUST match approved suggestion text"
        );

        // Master resume remains strictly untouched
        const masterResume = testStore.resumes.get(resumeAId);
        assert.strictEqual(masterResume?.content, sampleResumeContent, "Master resume content MUST remain untouched");
    });

    test("10. Suggestion Edit (PATCH /api/applications/changes with userEdits)", async () => {
        process.env.TEST_AUTH_USER_ID = userAId;

        const customEdit = "Optimized PostgreSQL query plans using indexes, improving throughput by 50%.";

        const req = new NextRequest("http://localhost:3000/api/applications/changes", {
            method: "PATCH",
            body: JSON.stringify({
                id: changeId,
                status: "approved",
                userEdits: customEdit
            }),
            headers: { "Content-Type": "application/json" }
        });

        const res = await patchChange(req);
        assert.strictEqual(res.status, 200);

        const updatedApp = testStore.applications.get(createdAppId);
        const tailoredVersion = testStore.resumeVersions.get(updatedApp!.resumeVersionId!);

        const parsedContent = JSON.parse(tailoredVersion!.content);
        assert.strictEqual(
            parsedContent.experience[0].highlights[1],
            customEdit,
            "Tailored version in DB MUST contain the user's custom edit"
        );
    });

    test("11. Undo Behavior (setting status back to pending reverts DB tailored version)", async () => {
        process.env.TEST_AUTH_USER_ID = userAId;

        const req = new NextRequest("http://localhost:3000/api/applications/changes", {
            method: "PATCH",
            body: JSON.stringify({
                id: changeId,
                status: "pending"
            }),
            headers: { "Content-Type": "application/json" }
        });

        const res = await patchChange(req);
        assert.strictEqual(res.status, 200);

        const updatedApp = testStore.applications.get(createdAppId);
        const tailoredVersion = testStore.resumeVersions.get(updatedApp!.resumeVersionId!);

        const parsedContent = JSON.parse(tailoredVersion!.content);
        assert.strictEqual(
            parsedContent.experience[0].highlights[1],
            "Optimized SQL query performance",
            "Undoing suggestion MUST revert DB tailored version back to base content"
        );
    });

    test("12. Application Deletion (DELETE /api/applications)", async () => {
        process.env.TEST_AUTH_USER_ID = userAId;

        const req = new NextRequest(`http://localhost:3000/api/applications?id=${createdAppId}`, {
            method: "DELETE"
        });

        const res = await deleteApp(req);
        assert.strictEqual(res.status, 200);

        // Confirm record removed from database store
        const dbRecord = testStore.applications.get(createdAppId);
        assert.strictEqual(dbRecord, undefined, "Record MUST be deleted from database");
    });

    test("13. Safe Error Responses for Unauthenticated Requests", async () => {
        process.env.TEST_AUTH_USER_ID = "UNAUTHENTICATED";

        const req = new NextRequest("http://localhost:3000/api/applications");
        const res = await getApps(req);

        assert.strictEqual(res.status, 401);
        const json = await res.json();
        assert.strictEqual(json.error, "Unauthorized");
    });

});
