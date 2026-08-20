import { NextResponse } from "next/server";
import { withRequestPolicy } from "@/lib/request-policy";
import { getUserOwnedApplication, getUserOwnedWorkItems } from "@/lib/auth-policy";
import { getCandidateEvidenceGraph, syncWorkItemsToEvidenceGraph } from "@/lib/evidence-graph";
import { buildRequirementMatrix } from "@/lib/requirement-matrix";
import { runPreflightValidation } from "@/lib/preflight-validator";
import { compileAtsDocument } from "@/lib/ats-compiler";
import { storeCanonicalDocument } from "@/lib/document-storage";

export const GET = withRequestPolicy(
    { requireAuth: true },
    async (req, ctx) => {
        const userId = ctx.auth!.user.id;
        // Parse application ID from request URL path
        const url = new URL(req.url);
        const pathSegments = url.pathname.split("/");
        const appIdIndex = pathSegments.indexOf("applications") + 1;
        const applicationId = pathSegments[appIdIndex];

        if (!applicationId) {
            return NextResponse.json({ error: "Application ID missing" }, { status: 400 });
        }

        const application = await getUserOwnedApplication(userId, applicationId);
        if (!application) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }

        // Fetch candidate evidence graph
        let evidenceGraph = await getCandidateEvidenceGraph(userId);

        // If evidence graph is empty, attempt to seed from work items if available
        if (evidenceGraph.length === 0) {
            const selectedWorkIds = Array.isArray(application.selectedWorkIds)
                ? application.selectedWorkIds.filter((id): id is string => typeof id === "string")
                : [];
            const workItemsList = await getUserOwnedWorkItems(userId, selectedWorkIds);
            if (workItemsList.length > 0) {
                evidenceGraph = await syncWorkItemsToEvidenceGraph(userId, workItemsList);
            }
        }

        // Build Requirement-to-Evidence Matrix
        const matrixResult = await buildRequirementMatrix(
            userId,
            applicationId,
            application.jobDescription,
            evidenceGraph
        );

        // Run Preflight Validation
        const preflight = await runPreflightValidation(
            userId,
            applicationId,
            matrixResult,
            application.jobDescription,
            application.selectedResume?.content
        );

        return NextResponse.json({
            matrix: matrixResult,
            preflight,
            evidenceGraph,
        });
    }
);

export const POST = withRequestPolicy(
    { requireAuth: true, creditCost: 1, operationName: "ats_compiler_execution" },
    async (req, ctx) => {
        const userId = ctx.auth!.user.id;
        const url = new URL(req.url);
        const pathSegments = url.pathname.split("/");
        const appIdIndex = pathSegments.indexOf("applications") + 1;
        const applicationId = pathSegments[appIdIndex];

        if (!applicationId) {
            return NextResponse.json({ error: "Application ID missing" }, { status: 400 });
        }

        const application = await getUserOwnedApplication(userId, applicationId);
        if (!application) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }

        const evidenceGraph = await getCandidateEvidenceGraph(userId);
        const matrixResult = await buildRequirementMatrix(
            userId,
            applicationId,
            application.jobDescription,
            evidenceGraph
        );

        // Compile ATS Document
        const basics = {
            name: ctx.auth!.user.name || "Candidate",
            email: ctx.auth!.user.email || "candidate@example.com",
        };

        let body: { templateMode?: unknown } = {};
        try {
            body = await req.json() as { templateMode?: unknown };
        } catch {
            // default empty
        }
        const templateMode = body.templateMode === "visual_rich_sharing" ? "visual_rich_sharing" : "ats_portal_optimized";

        const compiledDoc = compileAtsDocument(
            basics,
            evidenceGraph,
            matrixResult,
            application.position,
            application.company,
            templateMode
        );

        // Store canonical documents
        const htmlDoc = await storeCanonicalDocument(
            userId,
            "ats_html",
            compiledDoc.htmlContent,
            compiledDoc.evidenceLineage,
            applicationId
        );

        const txtDoc = await storeCanonicalDocument(
            userId,
            "ats_txt",
            compiledDoc.textContent,
            compiledDoc.evidenceLineage,
            applicationId
        );

        const preflight = await runPreflightValidation(
            userId,
            applicationId,
            matrixResult,
            application.jobDescription,
            compiledDoc.htmlContent
        );

        return NextResponse.json({
            compiledDoc,
            canonicalHtmlArtifactId: htmlDoc.id,
            canonicalTxtArtifactId: txtDoc.id,
            preflight,
        });
    }
);
