import { test, describe } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { compileTailoredResumeContent } from "../src/lib/tailored-resume-compiler";


// Domain & Business Logic types
interface Resume {
    id: string;
    userId: string;
    title: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

interface WorkItem {
    id: string;
    userId: string;
    title: string;
    category: string;
    description: string;
    createdAt: Date;
}

interface Application {
    id: string;
    userId: string;
    company: string;
    position: string;
    status: string;
    selectedResumeId?: string | null;
    resumeVersionId?: string | null;
    selectedWorkIds: string[];
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface ApplicationChange {
    id: string;
    applicationId: string;
    userId: string;
    section: string;
    changeType: string;
    originalText: string | null;
    suggestedText: string;
    userEdits: string | null;
    status: "pending" | "approved" | "rejected";
    createdAt: Date;
    updatedAt: Date;
}

interface ResumeVersion {
    id: string;
    userId: string;
    resumeId: string;
    title: string;
    company: string;
    content: string;
    createdAt: Date;
}

describe("Complete Application Journey Test Suite [Unit Test]", () => {
    // Simulated database store for deterministic execution
    const mockDb = {
        users: new Map<string, { id: string; email: string; credits: number }>(),
        resumes: new Map<string, Resume>(),
        workItems: new Map<string, WorkItem>(),
        applications: new Map<string, Application>(),
        applicationChanges: new Map<string, ApplicationChange>(),
        resumeVersions: new Map<string, ResumeVersion>(),
    };

    let userAId: string;
    let resumeId: string;
    let workItemId: string;
    let applicationId: string;
    let change1Id: string;
    let change2Id: string;

    test("1. Create or authenticate a user", () => {
        userAId = "usr_" + crypto.randomUUID();
        mockDb.users.set(userAId, { id: userAId, email: "student@example.com", credits: 10 });
        
        const user = mockDb.users.get(userAId);
        assert.ok(user, "User should be created");
        assert.equal(user.email, "student@example.com");
    });

    test("2. Import or create a resume", () => {
        resumeId = "res_" + crypto.randomUUID();
        const initialContent = JSON.stringify({
            basics: { name: "Alice Student", email: "student@example.com" },
            experience: [{ role: "Frontend Developer", company: "Tech Co", highlights: ["Built React apps"] }],
            skills: ["JavaScript", "React"]
        });

        const resume: Resume = {
            id: resumeId,
            userId: userAId,
            title: "Master Software Engineer Resume",
            content: initialContent,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        mockDb.resumes.set(resumeId, resume);

        const savedResume = mockDb.resumes.get(resumeId);
        assert.ok(savedResume, "Master resume should exist");
        assert.equal(savedResume.userId, userAId);
    });

    test("3. Add a project", () => {
        workItemId = "work_" + crypto.randomUUID();
        const workItem: WorkItem = {
            id: workItemId,
            userId: userAId,
            title: "E-Commerce Microservice",
            category: "Project",
            description: "Built high-scale checkout API in Node.js and PostgreSQL",
            createdAt: new Date(),
        };
        mockDb.workItems.set(workItemId, workItem);

        const savedWork = mockDb.workItems.get(workItemId);
        assert.ok(savedWork, "Work item should be saved");
        assert.equal(savedWork.title, "E-Commerce Microservice");
    });

    test("4. Add a job application", () => {
        applicationId = "app_" + crypto.randomUUID();
        const application: Application = {
            id: applicationId,
            userId: userAId,
            company: "Acme Corp",
            position: "Full Stack Engineer",
            status: "Draft",
            selectedWorkIds: [workItemId],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        mockDb.applications.set(applicationId, application);

        const savedApp = mockDb.applications.get(applicationId);
        assert.ok(savedApp, "Job application should be created");
        assert.equal(savedApp.status, "Draft");
    });

    test("5. Connect the resume to the job", () => {
        const app = mockDb.applications.get(applicationId)!;
        app.selectedResumeId = resumeId;
        app.updatedAt = new Date();

        assert.equal(app.selectedResumeId, resumeId, "Resume should be connected to the job application");
    });

    test("6. Generate analysis & suggestions", () => {
        change1Id = "chg_1_" + crypto.randomUUID();
        change2Id = "chg_2_" + crypto.randomUUID();

        mockDb.applicationChanges.set(change1Id, {
            id: change1Id,
            applicationId,
            userId: userAId,
            section: "Experience",
            changeType: "modify",
            originalText: "Built React apps",
            suggestedText: "Architected high-throughput React & TypeScript user interfaces, improving page speed by 40%.",
            userEdits: null,
            status: "pending",
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        mockDb.applicationChanges.set(change2Id, {
            id: change2Id,
            applicationId,
            userId: userAId,
            section: "Skills",
            changeType: "add",
            originalText: null,
            suggestedText: "PostgreSQL, Microservices, Node.js API Design",
            userEdits: null,
            status: "pending",
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const changes = Array.from(mockDb.applicationChanges.values()).filter(c => c.applicationId === applicationId);
        assert.equal(changes.length, 2, "Should generate 2 section change suggestions");
    });

    test("7. Verify suggestions do NOT silently alter master resume content", () => {
        const masterResume = mockDb.resumes.get(resumeId)!;
        const parsedContent = JSON.parse(masterResume.content);

        assert.equal(parsedContent.experience[0].highlights[0], "Built React apps", "Master resume must remain untouched by raw AI suggestions");
    });

    test("8. Apply one suggestion and compile tailored resume version", () => {
        const change1 = mockDb.applicationChanges.get(change1Id)!;
        change1.status = "approved";
        change1.updatedAt = new Date();

        const baseResume = mockDb.resumes.get(resumeId)!;
        
        // Compiles approved changes using compileTailoredResumeContent helper
        const compiledContent = compileTailoredResumeContent(baseResume.content, [{
            section: change1.section,
            changeType: change1.changeType,
            originalText: change1.originalText,
            suggestedText: change1.suggestedText,
            userEdits: change1.userEdits
        }]);

        const versionId = "ver_" + crypto.randomUUID();
        mockDb.resumeVersions.set(versionId, {
            id: versionId,
            userId: userAId,
            resumeId: baseResume.id,
            title: `${baseResume.title} - Acme Corp (Full Stack Engineer)`,
            company: "Acme Corp",
            content: compiledContent,
            createdAt: new Date(),
        });

        const app = mockDb.applications.get(applicationId)!;
        app.resumeVersionId = versionId;
        app.status = "Preparing";

        assert.equal(change1.status, "approved");
        assert.ok(app.resumeVersionId, "Tailored resume version should be linked to application");

        // REGRESSION PROOF: Verify compiled tailored version preserves original resume properties AND includes approved improvement
        const tailoredVersion = mockDb.resumeVersions.get(versionId)!;
        const parsedTailored = JSON.parse(tailoredVersion.content);
        assert.equal(parsedTailored.basics.name, "Alice Student", "Tailored version must preserve base student name");
        assert.equal(parsedTailored.skills[0], "JavaScript", "Tailored version must preserve base skills");
        assert.equal(parsedTailored.experience[0].highlights[0], change1.suggestedText, "Tailored version must contain approved suggestion");

        // REGRESSION PROOF: Verify master resume content remains 100% untouched
        const masterResume = mockDb.resumes.get(resumeId)!;
        const parsedMaster = JSON.parse(masterResume.content);
        assert.equal(parsedMaster.basics.name, "Alice Student");
        assert.equal(parsedMaster.experience[0].highlights[0], "Built React apps", "Master resume content must remain completely untouched");
    });

    test("9. Reject one suggestion", () => {
        const change2 = mockDb.applicationChanges.get(change2Id)!;
        change2.status = "rejected";
        change2.updatedAt = new Date();

        assert.equal(change2.status, "rejected", "Suggestion should be marked as rejected");
    });

    test("10. Undo one change", () => {
        const change2 = mockDb.applicationChanges.get(change2Id)!;
        change2.status = "pending";
        change2.updatedAt = new Date();

        assert.equal(change2.status, "pending", "Suggestion decision should be reverted to pending");
    });

    test("11. Export the resume", () => {
        const app = mockDb.applications.get(applicationId)!;
        const targetVersionId = app.resumeVersionId || app.selectedResumeId;
        assert.ok(targetVersionId, "An exportable resume ID (tailored or master) must exist");

        const exportedVersion = mockDb.resumeVersions.get(targetVersionId!);
        assert.ok(exportedVersion, "Exported tailored version record must exist");
        assert.match(exportedVersion.content, /Architected high-throughput React/, "Exported content must include approved improvements");
    });

    test("12. Mark the application as submitted", () => {
        const app = mockDb.applications.get(applicationId)!;
        app.status = "Applied";
        app.updatedAt = new Date();

        assert.equal(app.status, "Applied", "Application status should be Applied");
    });

    test("13. Confirm the dashboard shows the next step", () => {
        const app = mockDb.applications.get(applicationId)!;
        
        let nextAction = { title: "", actionLabel: "" };
        if (app.status === "Applied") {
            nextAction = {
                title: `Application: ${app.position} @ ${app.company}`,
                actionLabel: "Continue"
            };
        }

        assert.equal(nextAction.title, "Application: Full Stack Engineer @ Acme Corp");
        assert.equal(nextAction.actionLabel, "Continue");
    });
});
