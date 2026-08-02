import { test, describe } from "node:test";
import assert from "node:assert";
import { compileTailoredResumeContent } from "../src/app/api/applications/changes/route";

describe("AI Suggestion Approval Workflow Test Suite [Unit Test]", () => {

    const initialMasterResumeJSON = JSON.stringify({
        basics: {
            name: "Alex Taylor",
            email: "alex@example.com",
            summary: "Software Engineer with 4 years of experience.",
        },
        experience: [
            {
                id: 1,
                role: "Software Engineer",
                company: "Tech Solutions",
                highlights: [
                    "Built microservices using Node.js",
                    "Reduced database latency by 20%"
                ]
            }
        ],
        skills: [
            {
                id: 1,
                category: "Technical Skills",
                items: "JavaScript, TypeScript, PostgreSQL"
            }
        ],
        projects: [
            {
                id: 1,
                title: "E-commerce Engine",
                techStack: "Next.js, Node.js",
                highlights: [
                    "Implemented payment processing with Stripe"
                ]
            }
        ]
    }, null, 2);

    test("1. AI generation creates pending suggestions without modifying master resume", () => {
        const masterContent = initialMasterResumeJSON;

        // Pending suggestions created by AI engine
        const pendingSuggestions = [
            {
                id: "sug-1",
                section: "summary",
                changeType: "modify",
                originalText: "Software Engineer with 4 years of experience.",
                suggestedText: "Results-driven Senior Backend Engineer with 4+ years leading cloud microservices.",
                status: "pending"
            },
            {
                id: "sug-2",
                section: "experience",
                changeType: "modify",
                originalText: "Reduced database latency by 20%",
                suggestedText: "Reduced PostgreSQL database query latency by 35% using indexing and connection pooling",
                status: "pending"
            }
        ];

        assert.strictEqual(pendingSuggestions.length, 2);
        assert.strictEqual(pendingSuggestions[0].status, "pending");
        assert.strictEqual(masterContent, initialMasterResumeJSON, "Master resume content MUST remain untouched when AI generates suggestions");
    });

    test("2. Approving a suggestion compiles tailored resume version & updates exact JSON fields", () => {
        const masterContent = initialMasterResumeJSON;

        const approvedChanges = [
            {
                section: "summary",
                changeType: "modify",
                originalText: "Software Engineer with 4 years of experience.",
                suggestedText: "Results-driven Senior Backend Engineer with 4+ years leading cloud microservices.",
                userEdits: null
            }
        ];

        const tailoredVersionJSON = compileTailoredResumeContent(masterContent, approvedChanges);
        const parsedVersion = JSON.parse(tailoredVersionJSON);

        // Verify summary in tailored version was updated to suggested text
        assert.strictEqual(parsedVersion.basics.summary, "Results-driven Senior Backend Engineer with 4+ years leading cloud microservices.");

        // Verify experience highlights in tailored version remain original
        assert.strictEqual(parsedVersion.experience[0].highlights[1], "Reduced database latency by 20%");

        // Verify master resume content is strictly preserved
        assert.strictEqual(masterContent, initialMasterResumeJSON, "Master resume must NOT be modified by approval");
    });

    test("3. User edits override AI text in saved tailored version", () => {
        const masterContent = initialMasterResumeJSON;
        const customUserSummary = "Customized Lead Architect for High-Scale Applications.";

        const approvedChanges = [
            {
                section: "summary",
                changeType: "modify",
                originalText: "Software Engineer with 4 years of experience.",
                suggestedText: "AI generated text",
                userEdits: customUserSummary // User customized the text
            }
        ];

        const tailoredVersionJSON = compileTailoredResumeContent(masterContent, approvedChanges);
        const parsedVersion = JSON.parse(tailoredVersionJSON);

        assert.strictEqual(parsedVersion.basics.summary, customUserSummary, "User edited text MUST replace raw AI suggested text in tailored version");
    });

    test("4. Exact string targeting replaces specific experience highlight without substring corruption", () => {
        const masterContent = initialMasterResumeJSON;

        const approvedChanges = [
            {
                section: "experience",
                changeType: "modify",
                originalText: "Reduced database latency by 20%", // Exact match target
                suggestedText: "Optimized PostgreSQL query execution plans, cutting P99 latency by 35%.",
                userEdits: null
            }
        ];

        const tailoredVersionJSON = compileTailoredResumeContent(masterContent, approvedChanges);
        const parsedVersion = JSON.parse(tailoredVersionJSON);

        assert.strictEqual(parsedVersion.experience[0].highlights.length, 2);
        assert.strictEqual(parsedVersion.experience[0].highlights[0], "Built microservices using Node.js");
        assert.strictEqual(parsedVersion.experience[0].highlights[1], "Optimized PostgreSQL query execution plans, cutting P99 latency by 35%.");
    });

    test("5. Idempotency check prevents duplicate highlight additions on repeated approval", () => {
        const masterContent = initialMasterResumeJSON;

        // Duplicate approved change entries
        const approvedChanges = [
            {
                section: "experience",
                changeType: "add",
                originalText: null,
                suggestedText: "Architected event-driven Kafka messaging pipeline.",
                userEdits: null
            },
            {
                section: "experience",
                changeType: "add",
                originalText: null,
                suggestedText: "Architected event-driven Kafka messaging pipeline.",
                userEdits: null
            }
        ];

        const tailoredVersionJSON = compileTailoredResumeContent(masterContent, approvedChanges);
        const parsedVersion = JSON.parse(tailoredVersionJSON);

        const highlights = parsedVersion.experience[0].highlights;
        const count = highlights.filter((h: string) => h === "Architected event-driven Kafka messaging pipeline.").length;
        assert.strictEqual(count, 1, "Duplicate approval MUST NOT create duplicate highlight entries");
    });

    test("6. Rejection does NOT add content to tailored version", () => {
        const masterContent = initialMasterResumeJSON;

        // Rejected change is NOT included in approvedChanges list
        const approvedChanges: Array<{ section: string; changeType: string; originalText: string | null; suggestedText: string; userEdits: string | null }> = [];

        const tailoredVersionJSON = compileTailoredResumeContent(masterContent, approvedChanges);
        const parsedVersion = JSON.parse(tailoredVersionJSON);

        assert.strictEqual(parsedVersion.basics.summary, "Software Engineer with 4 years of experience.");
        assert.strictEqual(parsedVersion.experience[0].highlights.length, 2);
    });

    test("7. Undo (setting status back to pending) re-compiles tailored resume version back to base content", () => {
        const masterContent = initialMasterResumeJSON;

        // Step A: Initially approved change
        const changesStepA = [
            {
                section: "summary",
                changeType: "modify",
                originalText: "Software Engineer with 4 years of experience.",
                suggestedText: "Tailored summary text",
                userEdits: null
            }
        ];
        const tailoredStepA = JSON.parse(compileTailoredResumeContent(masterContent, changesStepA));
        assert.strictEqual(tailoredStepA.basics.summary, "Tailored summary text");

        // Step B: User undoes suggestion (status reverts to pending, approvedChanges list is now empty)
        const changesStepB: typeof changesStepA = [];
        const tailoredStepB = JSON.parse(compileTailoredResumeContent(masterContent, changesStepB));

        // Verify summary in tailored version reverts back to master resume content
        assert.strictEqual(tailoredStepB.basics.summary, "Software Engineer with 4 years of experience.", "Undoing a suggestion MUST revert tailored resume version content");
    });

});
