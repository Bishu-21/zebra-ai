import { NextResponse } from "next/server";
import { withRequestPolicy } from "@/lib/request-policy";
import { getUserOwnedApplication } from "@/lib/auth-policy";
import { getEvidenceForWorkItems } from "@/lib/evidence-graph";
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

        // GET is read-only and uses only evidence explicitly selected for this application.
        const selectedWorkIds = Array.isArray(application.selectedWorkIds)
            ? application.selectedWorkIds.filter((id): id is string => typeof id === "string")
            : [];
        const evidenceGraph = await getEvidenceForWorkItems(userId, selectedWorkIds);

        // Build Requirement-to-Evidence Matrix
        const matrixResult = await buildRequirementMatrix(
            userId,
            applicationId,
            application.jobDescription,
            evidenceGraph,
            { persist: false },
        );

        // Run Preflight Validation
        const preflight = await runPreflightValidation(
            userId,
            applicationId,
            matrixResult,
            application.jobDescription,
            application.selectedResume?.content,
            undefined,
            { persist: false },
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

        const selectedWorkIds = Array.isArray(application.selectedWorkIds)
            ? application.selectedWorkIds.filter((id): id is string => typeof id === "string")
            : [];
        const evidenceGraph = await getEvidenceForWorkItems(userId, selectedWorkIds);
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
