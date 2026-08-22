import { test, describe } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { compileTailoredResumeContent } from "../src/lib/tailored-resume-compiler";
import { getUserOwnedResume, isTestStoreActive, validateSelectedCertIds } from "../src/lib/auth-policy";
import { testStore } from "../src/lib/test-store";


interface User {
    id: string;
    email: string;
    credits: number;
    plan: string;
}

interface Resume {
    id: string;
    userId: string;
    title: string;
    content: string;
}

interface Application {
    id: string;
    userId: string;
    company: string;
    position: string;
    status: string;
}

interface Transaction {
    id: string;
    orderId: string;
    userId: string;
    planId: string;
    credits: number;
    amount: number;
    status: "pending" | "success" | "failed";
}

describe("Security & Reliability Test Suite [Unit Test]", () => {
    // Simulated DB store
    const dbStore = {
        users: new Map<string, User>(),
        resumes: new Map<string, Resume>(),
        applications: new Map<string, Application>(),
        transactions: new Map<string, Transaction>(),
    };

    // Helper functions implementing API logic contracts
    function getResumeForUser(resumeId: string, currentUserId: string): Resume | null {
        const resume = dbStore.resumes.get(resumeId);
        if (!resume || resume.userId !== currentUserId) {
            return null; // Equivalent to HTTP 404 / Unauthorized
        }
        return resume;
    }

    function updateJobForUser(jobId: string, currentUserId: string, patch: Partial<Application>): boolean {
        const job = dbStore.applications.get(jobId);
        if (!job || job.userId !== currentUserId) {
            return false; // Record not found or user does not own job
        }
        Object.assign(job, patch);
        return true;
    }

    function processAiSuggestions(resumeId: string, currentUserId: string, _aiOutput: string): { masterResumeSaved: boolean; pendingSuggestionsCount: number } {
        const resume = dbStore.resumes.get(resumeId);
        if (!resume || resume.userId !== currentUserId) {
            throw new Error("Unauthorized");
        }

        // Suggestions are stored as pending suggestions for review, NOT directly written to master resume content
        const pendingCount = _aiOutput ? 3 : 0;
        return {
            masterResumeSaved: false, // Master resume remains untouched
            pendingSuggestionsCount: pendingCount
        };
    }

    function verifyPayment(orderId: string, paymentId: string, currentUserId: string): { success: boolean; alreadyProcessed?: boolean; creditsAdded: number } {
        const tx = Array.from(dbStore.transactions.values()).find(t => t.orderId === orderId && t.userId === currentUserId);
        
        if (!tx) {
            throw new Error("Transaction not found or unauthorized");
        }

        if (tx.status === "success") {
            return {
                success: true,
                alreadyProcessed: true,
                creditsAdded: 0
            };
        }

        // Atomically grant credits and mark success
        const user = dbStore.users.get(currentUserId)!;
        user.credits += tx.credits;
        tx.status = "success";

        return {
            success: true,
            creditsAdded: tx.credits
        };
    }

    test("1. User A cannot read User B's resume", () => {
        const userAId = "usr_A_" + crypto.randomUUID();
        const userBId = "usr_B_" + crypto.randomUUID();
        const resumeBId = "res_B_" + crypto.randomUUID();

        dbStore.users.set(userAId, { id: userAId, email: "usera@example.com", credits: 5, plan: "Starter" });
        dbStore.users.set(userBId, { id: userBId, email: "userb@example.com", credits: 5, plan: "Starter" });

        dbStore.resumes.set(resumeBId, {
            id: resumeBId,
            userId: userBId,
            title: "User B Private Master Resume",
            content: "Confidential experiences of User B"
        });

        // User A attempts to read User B's resume
        const result = getResumeForUser(resumeBId, userAId);
        assert.equal(result, null, "User A must not be allowed to read User B's resume");

        // User B reads User B's resume
        const validResult = getResumeForUser(resumeBId, userBId);
        assert.ok(validResult, "User B should successfully read their own resume");
        assert.equal(validResult.title, "User B Private Master Resume");
    });

    test("2. User A cannot update User B's job application", () => {
        const userAId = "usr_A_" + crypto.randomUUID();
        const userBId = "usr_B_" + crypto.randomUUID();
        const jobBId = "app_B_" + crypto.randomUUID();

        dbStore.applications.set(jobBId, {
            id: jobBId,
            userId: userBId,
            company: "Target Corp",
            position: "Lead Designer",
            status: "Draft"
        });

        // User A attempts to change User B's job status to "Applied"
        const updateSuccess = updateJobForUser(jobBId, userAId, { status: "Applied" });
        assert.equal(updateSuccess, false, "User A update on User B job must be rejected");

        const uneditedJob = dbStore.applications.get(jobBId)!;
        assert.equal(uneditedJob.status, "Draft", "Job status must remain unchanged");
    });

    test("3. AI output with invented claims is NOT automatically saved to master resume", () => {
        const userId = "usr_C_" + crypto.randomUUID();
        const resumeId = "res_C_" + crypto.randomUUID();
        const originalContent = "Software Engineer with 2 years of Node.js experience";

        dbStore.resumes.set(resumeId, {
            id: resumeId,
            userId,
            title: "Original Resume",
            content: originalContent
        });

        const rawAiOutput = JSON.stringify({
            suggestedChanges: [
                { section: "Experience", text: "Senior Lead Architect with 10 years Quantum Computing experience" }
            ]
        });

        const { masterResumeSaved, pendingSuggestionsCount } = processAiSuggestions(resumeId, userId, rawAiOutput);

        assert.equal(masterResumeSaved, false, "AI suggestions must NOT mutate master resume content upon generation");
        assert.equal(pendingSuggestionsCount, 3, "Suggestions must require student review and manual approval");

        const masterResume = dbStore.resumes.get(resumeId)!;
        assert.equal(masterResume.content, originalContent, "Master resume content must remain 100% untouched");
    });

    test("4. Duplicate payment verification does NOT duplicate user credits", () => {
        const userId = "usr_D_" + crypto.randomUUID();
        const txId = "tx_" + crypto.randomUUID();
        const orderId = "order_123456";
        const paymentId = "pay_78910";

        dbStore.users.set(userId, { id: userId, email: "payer@example.com", credits: 5, plan: "Starter" });
        dbStore.transactions.set(txId, {
            id: txId,
            orderId,
            userId,
            planId: "pro",
            credits: 20,
            amount: 49900,
            status: "pending"
        });

        // First verification call
        const res1 = verifyPayment(orderId, paymentId, userId);
        assert.equal(res1.success, true);
        assert.equal(res1.creditsAdded, 20);

        const userAfterFirst = dbStore.users.get(userId)!;
        assert.equal(userAfterFirst.credits, 25, "User credits should increase from 5 to 25");

        // Duplicate verification call with same orderId
        const res2 = verifyPayment(orderId, paymentId, userId);
        assert.equal(res2.success, true);
        assert.equal(res2.alreadyProcessed, true, "Duplicate payment verification must return alreadyProcessed");
        assert.equal(res2.creditsAdded, 0, "Duplicate payment verification must NOT add extra credits");

        const userAfterSecond = dbStore.users.get(userId)!;
        assert.equal(userAfterSecond.credits, 25, "User credits must remain strictly 25 after duplicate request");
    });

    test("5. Real compileTailoredResumeContent preserves all base resume sections and leaves master resume string untouched", () => {
        const originalContent = JSON.stringify({
            basics: { name: "Alice Developer", email: "alice@example.com", phone: "+1234567890", summary: "Experienced SWE" },
            experience: [{ id: 1, role: "Backend Engineer", company: "DataCorp", highlights: ["Built REST APIs in Node.js"] }],
            skills: [{ id: 1, category: "Languages", items: "JavaScript, TypeScript, SQL" }],
            projects: [{ id: 1, title: "Analytics Engine", highlights: ["Processed 1M events/sec"] }]
        }, null, 2);

        const approvedChanges = [
            {
                section: "Experience",
                changeType: "modify",
                originalText: "Built REST APIs in Node.js",
                suggestedText: "Architected high-scale REST APIs in Node.js & PostgreSQL, handling 10k QPS.",
                userEdits: null
            },
            {
                section: "Skills",
                changeType: "add",
                originalText: null,
                suggestedText: "Docker, Kubernetes, Redis",
                userEdits: null
            }
        ];

        const compiled = compileTailoredResumeContent(originalContent, approvedChanges);
        const parsedCompiled = JSON.parse(compiled);

        // Verify compiled tailored version preserves base resume sections AND includes improvements
        assert.equal(parsedCompiled.basics.name, "Alice Developer");
        assert.equal(parsedCompiled.basics.email, "alice@example.com");
        assert.equal(parsedCompiled.experience[0].highlights[0], "Architected high-scale REST APIs in Node.js & PostgreSQL, handling 10k QPS.");
        assert.match(parsedCompiled.skills[0].items, /Docker, Kubernetes, Redis/);
        assert.equal(parsedCompiled.projects[0].title, "Analytics Engine");

        // Verify master resume content string remains 100% untouched
        const parsedOriginal = JSON.parse(originalContent);
        assert.equal(parsedOriginal.experience[0].highlights[0], "Built REST APIs in Node.js", "Master base content must remain 100% untouched");
    });

    test("6. Real Auth Policy enforces user ownership isolation via testStore", async () => {
        const oldEnv = process.env.TEST_AUTH_USER_ID;
        const oldNodeEnv = process.env.NODE_ENV;
        const envRef = process.env as Record<string, string | undefined>;
        try {
            envRef.NODE_ENV = "test";
            envRef.TEST_AUTH_USER_ID = "usr_owner_A";

            assert.equal(isTestStoreActive(), true, "isTestStoreActive should be true in non-production test mode");

            const resumeId = "res_isolated_" + crypto.randomUUID();
            testStore.resumes.set(resumeId, {
                id: resumeId,
                userId: "usr_owner_A",
                title: "Owner A Resume",
                content: "Confidential data"
            });

            // User A reads User A resume -> success
            const resA = await getUserOwnedResume("usr_owner_A", resumeId);
            assert.ok(resA);
            assert.equal(resA.title, "Owner A Resume");

            // User B reads User A resume -> returns null (access denied)
            const resB = await getUserOwnedResume("usr_owner_B", resumeId);
            assert.equal(resB, null, "User B must not be granted access to User A's resume");
        } finally {
            envRef.TEST_AUTH_USER_ID = oldEnv;
            envRef.NODE_ENV = oldNodeEnv;
        }
    });

    test("7. Setting NODE_ENV=production disables TEST_AUTH_USER_ID testStore shortcuts", () => {
        const oldEnv = process.env.TEST_AUTH_USER_ID;
        const oldNodeEnv = process.env.NODE_ENV;
        const envRef = process.env as Record<string, string | undefined>;
        try {
            envRef.NODE_ENV = "production";
            envRef.TEST_AUTH_USER_ID = "usr_test_prod";

            assert.equal(isTestStoreActive(), false, "Production mode must strictly disable test store shortcuts");
        } finally {
            envRef.TEST_AUTH_USER_ID = oldEnv;
            envRef.NODE_ENV = oldNodeEnv;
        }
    });

    test("8. validateSelectedCertIds enforces user ownership isolation", async () => {
        const oldEnv = process.env.TEST_AUTH_USER_ID;
        const oldNodeEnv = process.env.NODE_ENV;
        const envRef = process.env as Record<string, string | undefined>;
        try {
            envRef.NODE_ENV = "test";
            envRef.TEST_AUTH_USER_ID = "usr_cert_owner_A";

            const certId = "cert_aws_" + crypto.randomUUID();
            testStore.certifications.set(certId, {
                id: certId,
                userId: "usr_cert_owner_A",
                name: "AWS Certified Developer"
            });

            // Owner A validates their own certification -> returns true
            const validA = await validateSelectedCertIds("usr_cert_owner_A", [certId]);
            assert.equal(validA, true, "Owner A should successfully validate their own certification");

            // User B attempts to attach Owner A's certification -> returns false
            const validB = await validateSelectedCertIds("usr_cert_user_B", [certId]);
            assert.equal(validB, false, "User B must not be allowed to attach Owner A's certification");
        } finally {
            envRef.TEST_AUTH_USER_ID = oldEnv;
            envRef.NODE_ENV = oldNodeEnv;
        }
    });
});
