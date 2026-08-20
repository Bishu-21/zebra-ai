import { describe, it } from "node:test";
import assert from "node:assert";
import { upsertEvidenceNode, getCandidateEvidenceGraph, syncWorkItemsToEvidenceGraph } from "../src/lib/evidence-graph";
import { buildRequirementMatrix } from "../src/lib/requirement-matrix";
import { runPreflightValidation } from "../src/lib/preflight-validator";
import { compileAtsDocument } from "../src/lib/ats-compiler";
import { testStore } from "../src/lib/test-store";
import type { CandidateEvidenceNode } from "../src/lib/evidence-graph";
import type { RequirementMatrixResult } from "../src/lib/requirement-matrix";

// Enable mock test store
process.env.TEST_AUTH_USER_ID = "usr_test_123";

describe("Evidence-to-Job Compiler Pipeline", () => {
    it("should build structured evidence graph and sync work items", async () => {
        testStore.clear();
        const userId = "usr_test_123";

        // Add explicit evidence node
        const node1 = await upsertEvidenceNode(userId, {
            companyOrProject: "E-Commerce App",
            skill: "React",
            action: "Built high-throughput checkout interface with Redux Toolkit",
            measurableOutcome: "Reduced cart abandon rate by 18%",
            proofUrl: "https://github.com/test/checkout",
        });

        assert.strictEqual(node1.companyOrProject, "E-Commerce App");
        assert.strictEqual(node1.confidence, "asserted");

        // Sync work items
        await syncWorkItemsToEvidenceGraph(userId, [
            {
                id: "work_1",
                title: "Cloud Microservices Engine",
                description: "Implemented REST API endpoints with Node.js and PostgreSQL",
                tools: ["Node.js", "REST API", "PostgreSQL"],
                result: "Served 50,000 requests/sec",
            }
        ]);

        const graph = await getCandidateEvidenceGraph(userId);
        assert.ok(graph.length >= 4, "Should have created evidence nodes for skills");
    });

    it("should construct Requirement-to-Evidence Matrix with exact, terminology mismatch, and missing classifications", async () => {
        testStore.clear();
        const userId = "usr_test_123";
        const appId = "app_test_456";

        await upsertEvidenceNode(userId, {
            companyOrProject: "Payment Gateway Integration",
            skill: "REST API",
            action: "Developed secure RESTful payment endpoints",
            measurableOutcome: "Processed $1M+ test volume",
        });

        const evidenceGraph = await getCandidateEvidenceGraph(userId);

        const jd = "Looking for a Senior Developer proficient in React, REST API, and Kubernetes.";

        const matrix = await buildRequirementMatrix(userId, appId, jd, evidenceGraph);

        assert.strictEqual(matrix.applicationId, appId);
        assert.ok(matrix.items.length >= 2);

        const restItem = matrix.items.find(i => i.canonicalRequirement.toLowerCase() === "rest api");
        assert.ok(restItem);
        assert.strictEqual(restItem?.matchStatus, "exact_match");
        assert.strictEqual(restItem?.resultStatus, "Supported");
        assert.strictEqual(restItem?.classification, "Must-have");
        assert.ok(restItem?.candidateEvidence?.includes("Developed secure RESTful payment endpoints"));
        assert.ok(restItem?.suggestedPhrasing?.includes("Processed $1M+ test volume"));

        const k8sItem = matrix.items.find(i => i.canonicalRequirement.toLowerCase() === "kubernetes");
        assert.ok(k8sItem);
        assert.strictEqual(k8sItem?.matchStatus, "missing_evidence");
        assert.strictEqual(k8sItem?.resultStatus, "Gap");
        assert.ok(k8sItem?.candidatePrompt?.includes("Zebra did not find relevant evidence"));
    });

    it("should validate ATS preflight compliance and detect layout parsing risks", async () => {
        testStore.clear();
        const userId = "usr_test_123";
        const appId = "app_test_789";

        const matrix: RequirementMatrixResult = {
            applicationId: appId,
            items: [],
            exactMatchCount: 2,
            terminologyMismatchCount: 0,
            weakEvidenceCount: 0,
            missingEvidenceCount: 0,
            overallMatchPercentage: 100,
        };

        const cleanReport = await runPreflightValidation(userId, appId, matrix, "Standard Developer Job", "<div>Single column text</div>");
        assert.strictEqual(cleanReport.parseSafety, "PASS");
        assert.strictEqual(cleanReport.isClean, true);
        assert.ok(cleanReport.matchBreakdown);
        assert.ok(cleanReport.detailedAudit);
        assert.strictEqual(cleanReport.detailedAudit.parsingHazards.length, 0);

        const tableReport = await runPreflightValidation(userId, appId, matrix, "US Citizen clearance required", "<table><tr><td>Multi column table</td></tr></table>");
        assert.strictEqual(tableReport.parseSafety, "FAIL", "Should fail parse safety on table elements");
        assert.ok(tableReport.eligibilityBlockers.length > 0, "Should contain explicit eligibility blocker warnings");
        assert.ok(tableReport.detailedAudit.parsingHazards.length > 0, "Should contain 9-point audit parsing hazard entry");
        assert.ok(tableReport.detailedAudit.eligibilityConfirmations.length > 0, "Should contain eligibility confirmations entry");
    });

    it("should compile single-column ATS document guaranteed by evidence lineage", async () => {
        const userId = "usr_test_123";
        const graph: CandidateEvidenceNode[] = [
            {
                id: "ev_node_1",
                userId,
                companyOrProject: "Fintech Dashboard",
                roleOrContext: "Frontend Engineer",
                skill: "TypeScript",
                action: "Built real-time transaction monitor using TypeScript and WebSockets",
                measurableOutcome: "Reduced latency to under 50ms",
                confidence: "verified",
                source: "manual",
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        ];

        const now = new Date();
        const matrix: RequirementMatrixResult = {
            applicationId: "app_999",
            items: [
                {
                    id: "mat_1",
                    applicationId: "app_999",
                    userId,
                    requirementKey: "typescript",
                    canonicalRequirement: "TypeScript",
                    classification: "Must-have",
                    candidateEvidence: "Built real-time transaction monitor using TypeScript and WebSockets",
                    resultStatus: "Supported",
                    requirementCategory: "tech_skill",
                    evidenceNodeId: "ev_node_1",
                    matchStatus: "exact_match",
                    confidenceScore: 95,
                    suggestedPhrasing: "Built real-time transaction monitor using TypeScript and WebSockets.",
                    candidatePrompt: null,
                    createdAt: now,
                    updatedAt: now,
                }
            ],
            exactMatchCount: 1,
            terminologyMismatchCount: 0,
            weakEvidenceCount: 0,
            missingEvidenceCount: 0,
            overallMatchPercentage: 100,
        };

        const compiled = compileAtsDocument(
            { name: "John Doe", email: "john@example.com", phone: "+1 555-0199" },
            graph,
            matrix,
            "Frontend Engineer",
            "Acme Corp",
            "ats_portal_optimized"
        );

        assert.ok(compiled.htmlContent.includes("John Doe"));
        assert.ok(compiled.htmlContent.includes("john@example.com"));
        assert.ok(compiled.htmlContent.includes("SUMMARY"), "Must contain standard heading SUMMARY");
        assert.ok(compiled.htmlContent.includes("SKILLS"), "Must contain standard heading SKILLS");
        assert.ok(compiled.htmlContent.includes("EXPERIENCE &amp; PROJECTS"), "Must contain standard heading EXPERIENCE");
        assert.ok(compiled.markdownContent.includes("## SUMMARY"), "Must contain Markdown export structure");
        assert.strictEqual(compiled.parseSafetyStatus, "PASS");
        assert.ok(!compiled.htmlContent.includes("<table"), "Must not contain tables");

        const visualRich = compileAtsDocument(
            { name: "John Doe", email: "john@example.com" },
            graph,
            matrix,
            "Frontend Engineer",
            "Acme Corp",
            "visual_rich_sharing"
        );

        assert.strictEqual(visualRich.templateMode, "visual_rich_sharing");
        assert.ok(visualRich.htmlContent.includes("Visually Rich Template"));
    });
});
