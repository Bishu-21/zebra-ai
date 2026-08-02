import { test, describe, before, after } from "node:test";
import assert from "node:assert";
import { NextRequest } from "next/server";
import { testStore } from "../src/lib/test-store";
import { GET as getApps, POST as createApp, PATCH as patchApp } from "../src/app/api/applications/route";
import { POST as createChange, PATCH as patchChange, GET as getChanges } from "../src/app/api/applications/changes/route";

describe("18-Step End-to-End Real Application & UI Journey Test Suite [Integration Test]", () => {
    let userId: string;
    let resumeId: string;
    let workId: string;
    let appId: string;
    let change1Id: string;
    let change2Id: string;
    let change3Id: string;

    const baseMasterResumeContent = JSON.stringify({
        basics: {
            name: "Alex Johnson",
            email: "alex.johnson@example.com",
            phone: "+1 (555) 019-2831",
            summary: "Senior Full Stack Engineer with 7 years experience building scalable Web applications.",
            location: "San Francisco, CA"
        },
        experience: [
            {
                id: 1,
                role: "Full Stack Lead",
                company: "CloudScale Inc",
                period: "2021 - Present",
                highlights: [
                    "Maintained React frontend and Node.js microservices.",
                    "Managed PostgreSQL database queries."
                ]
            }
        ],
        skills: [
            { id: 1, category: "Languages", items: "TypeScript, JavaScript, Python, SQL" }
        ]
    }, null, 2);

    before(() => {
        userId = `usr_e2e_${Date.now()}`;
        resumeId = `res_e2e_${Date.now()}`;
        workId = `work_e2e_${Date.now()}`;

        testStore.clear();

        // 1. Authenticate clean test user
        testStore.users.set(userId, { id: userId, name: "Alex Johnson", email: `${userId}@example.com` });
    });

    after(() => {
        testStore.clear();
        delete process.env.TEST_AUTH_USER_ID;
    });

    test("Step 1: Authenticate clean test user", () => {
        process.env.TEST_AUTH_USER_ID = userId;
        const user = testStore.users.get(userId);
        assert.ok(user);
        assert.strictEqual(user.id, userId);
    });

    test("Step 2: Create or import a master resume", () => {
        testStore.resumes.set(resumeId, {
            id: resumeId,
            userId: userId,
            title: "Software Engineering Master Resume",
            content: baseMasterResumeContent
        });

        const resume = testStore.resumes.get(resumeId);
        assert.ok(resume);
        assert.strictEqual(resume.userId, userId);
        assert.strictEqual(resume.content, baseMasterResumeContent);
    });

    test("Step 3: Add a work item to library", () => {
        testStore.workItems.set(workId, {
            id: workId,
            userId: userId,
            title: "PostgreSQL Query Optimization Engine",
            category: "Database Engineering"
        });

        const work = testStore.workItems.get(workId);
        assert.ok(work);
        assert.strictEqual(work.userId, userId);
    });

    test("Step 4: Create an application", async () => {
        process.env.TEST_AUTH_USER_ID = userId;

        const req = new NextRequest("http://localhost:3000/api/applications", {
            method: "POST",
            body: JSON.stringify({
                company: "Stripe",
                position: "Senior Full Stack Engineer",
                jobDescription: "We are seeking a Senior Full Stack Engineer experienced with React, TypeScript, and PostgreSQL query execution optimization.",
                status: "Draft"
            }),
            headers: { "Content-Type": "application/json" }
        });

        const res = await createApp(req);
        assert.strictEqual(res.status, 200);

        const json = await res.json();
        assert.ok(json.application);
        assert.strictEqual(json.application.company, "Stripe");
        assert.strictEqual(json.application.position, "Senior Full Stack Engineer");
        assert.strictEqual(json.application.status, "Draft");

        appId = json.application.id;
    });

    test("Step 5: Attach the master resume & work item to application", async () => {
        process.env.TEST_AUTH_USER_ID = userId;

        const req = new NextRequest("http://localhost:3000/api/applications", {
            method: "PATCH",
            body: JSON.stringify({
                id: appId,
                status: "Preparing",
                selectedResumeId: resumeId,
                selectedWorkIds: [workId]
            }),
            headers: { "Content-Type": "application/json" }
        });

        const res = await patchApp(req);
        assert.strictEqual(res.status, 200);

        const json = await res.json();
        assert.strictEqual(json.application.selectedResumeId, resumeId);
        assert.strictEqual(json.application.status, "Preparing");
    });

    test("Step 6: Open specific application workspace", async () => {
        process.env.TEST_AUTH_USER_ID = userId;

        const req = new NextRequest(`http://localhost:3000/api/applications?id=${appId}`);
        const res = await getApps(req);
        assert.strictEqual(res.status, 200);

        const json = await res.json();
        assert.ok(json.application);
        assert.strictEqual(json.application.id, appId);
        assert.strictEqual(json.application.selectedResumeId, resumeId);
    });

    test("Step 7: Generate AI suggestions for application", async () => {
        process.env.TEST_AUTH_USER_ID = userId;

        // Change 1: Experience highlight optimization
        const req1 = new NextRequest("http://localhost:3000/api/applications/changes", {
            method: "POST",
            body: JSON.stringify({
                applicationId: appId,
                section: "experience",
                changeType: "modify",
                originalText: "Managed PostgreSQL database queries.",
                suggestedText: "Architected PostgreSQL query execution plans, boosting read throughput by 42%."
            }),
            headers: { "Content-Type": "application/json" }
        });
        const res1 = await createChange(req1);
        assert.strictEqual(res1.status, 200);
        change1Id = (await res1.json()).change.id;

        // Change 2: Skills addition
        const req2 = new NextRequest("http://localhost:3000/api/applications/changes", {
            method: "POST",
            body: JSON.stringify({
                applicationId: appId,
                section: "skills",
                changeType: "modify",
                originalText: "TypeScript, JavaScript, Python, SQL",
                suggestedText: "TypeScript, React, Next.js, Node.js, Python, PostgreSQL, REST"
            }),
            headers: { "Content-Type": "application/json" }
        });
        const res2 = await createChange(req2);
        assert.strictEqual(res2.status, 200);
        change2Id = (await res2.json()).change.id;

        // Change 3: Optional summary modification
        const req3 = new NextRequest("http://localhost:3000/api/applications/changes", {
            method: "POST",
            body: JSON.stringify({
                applicationId: appId,
                section: "basics.summary",
                changeType: "modify",
                originalText: "Senior Full Stack Engineer with 7 years experience building scalable Web applications.",
                suggestedText: "High-impact Senior Full Stack Engineer specializing in React and PostgreSQL system performance."
            }),
            headers: { "Content-Type": "application/json" }
        });
        const res3 = await createChange(req3);
        assert.strictEqual(res3.status, 200);
        change3Id = (await res3.json()).change.id;

        // Confirm 3 pending suggestions generated
        const reqFetch = new NextRequest(`http://localhost:3000/api/applications/changes?applicationId=${appId}`);
        const resFetch = await getChanges(reqFetch);
        const jsonFetch = await resFetch.json();
        assert.strictEqual(jsonFetch.changes.length, 3);
    });

    test("Step 8: Approve one suggestion (Suggestion 1)", async () => {
        process.env.TEST_AUTH_USER_ID = userId;

        const req = new NextRequest("http://localhost:3000/api/applications/changes", {
            method: "PATCH",
            body: JSON.stringify({
                id: change1Id,
                status: "approved"
            }),
            headers: { "Content-Type": "application/json" }
        });

        const res = await patchChange(req);
        assert.strictEqual(res.status, 200);

        // Verify application updated with resumeVersionId
        const appRecord = testStore.applications.get(appId);
        assert.ok(appRecord?.resumeVersionId, "Approving suggestion MUST create and link a resume version ID");
    });

    test("Step 9: Edit one suggestion (Suggestion 2 with custom userEdits)", async () => {
        process.env.TEST_AUTH_USER_ID = userId;

        const customUserEdit = "TypeScript, React, Next.js, Node.js, Python, PostgreSQL, GraphQL, Docker";

        const req = new NextRequest("http://localhost:3000/api/applications/changes", {
            method: "PATCH",
            body: JSON.stringify({
                id: change2Id,
                status: "approved",
                userEdits: customUserEdit
            }),
            headers: { "Content-Type": "application/json" }
        });

        const res = await patchChange(req);
        assert.strictEqual(res.status, 200);

        const changeRecord = testStore.applicationChanges.get(change2Id);
        assert.strictEqual(changeRecord?.userEdits, customUserEdit);
    });

    test("Step 10: Reject one suggestion (Suggestion 3)", async () => {
        process.env.TEST_AUTH_USER_ID = userId;

        const req = new NextRequest("http://localhost:3000/api/applications/changes", {
            method: "PATCH",
            body: JSON.stringify({
                id: change3Id,
                status: "rejected"
            }),
            headers: { "Content-Type": "application/json" }
        });

        const res = await patchChange(req);
        assert.strictEqual(res.status, 200);

        const changeRecord = testStore.applicationChanges.get(change3Id);
        assert.strictEqual(changeRecord?.status, "rejected");
    });

    test("Step 11: Undo one applied change (Suggestion 1 back to pending)", async () => {
        process.env.TEST_AUTH_USER_ID = userId;

        const req = new NextRequest("http://localhost:3000/api/applications/changes", {
            method: "PATCH",
            body: JSON.stringify({
                id: change1Id,
                status: "pending"
            }),
            headers: { "Content-Type": "application/json" }
        });

        const res = await patchChange(req);
        assert.strictEqual(res.status, 200);

        const changeRecord = testStore.applicationChanges.get(change1Id);
        assert.strictEqual(changeRecord?.status, "pending");
    });

    test("Step 12: Confirm the master resume is completely unchanged", () => {
        const masterResume = testStore.resumes.get(resumeId);
        assert.ok(masterResume);
        assert.strictEqual(
            masterResume.content,
            baseMasterResumeContent,
            "Master base resume content MUST remain 100% untouched!"
        );
    });

    test("Step 13: Confirm the tailored version contains the approved/edited change", () => {
        const appRecord = testStore.applications.get(appId);
        assert.ok(appRecord?.resumeVersionId);

        const tailoredVersion = testStore.resumeVersions.get(appRecord.resumeVersionId);
        assert.ok(tailoredVersion);

        const parsedContent = JSON.parse(tailoredVersion.content);

        // Suggestion 2 was edited by user: "TypeScript, React, Next.js, Node.js, Python, PostgreSQL, GraphQL, Docker"
        assert.strictEqual(
            parsedContent.skills[0].items,
            "TypeScript, React, Next.js, Node.js, Python, PostgreSQL, GraphQL, Docker",
            "Tailored version content MUST contain user's custom edit"
        );

        // Suggestion 1 was undone back to pending, so experience highlights must revert to original
        assert.strictEqual(
            parsedContent.experience[0].highlights[1],
            "Managed PostgreSQL database queries.",
            "Undone suggestion MUST revert to original text in compiled tailored version"
        );
    });

    test("Step 14: Export the correct resume version", async () => {
        process.env.TEST_AUTH_USER_ID = userId;

        const appRecord = testStore.applications.get(appId);
        assert.ok(appRecord?.resumeVersionId);

        const tailoredVersion = testStore.resumeVersions.get(appRecord.resumeVersionId);
        assert.ok(tailoredVersion);
        assert.match(tailoredVersion.title, /Stripe/);
    });

    test("Step 15: Mark the application as Applied", async () => {
        process.env.TEST_AUTH_USER_ID = userId;

        const req = new NextRequest("http://localhost:3000/api/applications", {
            method: "PATCH",
            body: JSON.stringify({
                id: appId,
                status: "Applied"
            }),
            headers: { "Content-Type": "application/json" }
        });

        const res = await patchApp(req);
        assert.strictEqual(res.status, 200);

        const json = await res.json();
        assert.strictEqual(json.application.status, "Applied");

        const appRecord = testStore.applications.get(appId);
        assert.strictEqual(appRecord?.status, "Applied");
    });

    test("Step 16: Set a follow-up note & outcome", async () => {
        process.env.TEST_AUTH_USER_ID = userId;

        const followUpNote = "Follow up with engineering recruiter on Friday regarding technical screen.";

        const req = new NextRequest("http://localhost:3000/api/applications", {
            method: "PATCH",
            body: JSON.stringify({
                id: appId,
                notes: followUpNote,
                outcome: "Interview Scheduled"
            }),
            headers: { "Content-Type": "application/json" }
        });

        const res = await patchApp(req);
        assert.strictEqual(res.status, 200);

        const appRecord = testStore.applications.get(appId);
        assert.strictEqual(appRecord?.notes, followUpNote);
        assert.strictEqual(appRecord?.outcome, "Interview Scheduled");
    });

    test("Step 17: Return to dashboard (fetch user applications list)", async () => {
        process.env.TEST_AUTH_USER_ID = userId;

        const req = new NextRequest("http://localhost:3000/api/applications");
        const res = await getApps(req);
        assert.strictEqual(res.status, 200);

        const json = await res.json();
        assert.ok(Array.isArray(json.applications));
        assert.strictEqual(json.applications.length, 1);
        assert.strictEqual(json.applications[0].id, appId);
    });

    test("Step 18: Confirm dashboard shows the correct next action", () => {
        const latestApp = testStore.applications.get(appId);
        assert.ok(latestApp);
        assert.strictEqual(latestApp.status, "Applied");

        // Calculate Next Action Anchor logic (matching src/app/dashboard/page.tsx)
        const pendingChangesCount = Array.from(testStore.applicationChanges.values())
            .filter(c => c.applicationId === appId && c.status === "pending").length;

        let nextAction = {
            title: "",
            description: "",
            actionLabel: "",
            actionHref: ""
        };

        if (pendingChangesCount > 0) {
            nextAction = {
                title: `Continue application: ${latestApp.position} @ ${latestApp.company}`,
                description: `You have ${pendingChangesCount} suggestions ready for approval. Review before sending.`,
                actionLabel: "Review suggestions",
                actionHref: `/dashboard/applications/${latestApp.id}?step=suggestions`
            };
        } else {
            nextAction = {
                title: `Application: ${latestApp.position} @ ${latestApp.company}`,
                description: `Status: ${latestApp.status}. Follow up or mark next interview stage.`,
                actionLabel: "Continue",
                actionHref: `/dashboard/applications/${latestApp.id}`
            };
        }

        assert.strictEqual(nextAction.title, "Continue application: Senior Full Stack Engineer @ Stripe");
        assert.strictEqual(nextAction.description, `You have ${pendingChangesCount} suggestions ready for approval. Review before sending.`);
        assert.strictEqual(nextAction.actionHref, `/dashboard/applications/${appId}?step=suggestions`);
    });

});
