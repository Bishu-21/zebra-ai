import { NextRequest, NextResponse } from "next/server";
import { generateResumeHtml } from "@/lib/resume-renderer";
import { handleApiError } from "@/lib/api-error";
import { requireAuth } from "@/lib/auth-policy";
import { renderPdfBuffer } from "@/lib/pdf-browser";
import { db } from "@/lib/db";
import { resumes as resumesTable, resumeVersions as resumeVersionsTable } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { normalizeResumeContent } from "@/lib/resume-content";
import type { ResumeRenderData } from "@/lib/resume-renderer";

const MAX_PDF_PAYLOAD_BYTES = 256 * 1024;

/**
 * PREMIUM PDF EXPORT API
 *
 * Generates a high-quality PDF using a headless browser.
 * Supports both POST (direct data from editor) and GET (download by ID from vault).
 */

export async function POST(req: NextRequest) {
    try {
        const { errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

        const contentLength = Number(req.headers.get("content-length") || 0);
        if (contentLength > MAX_PDF_PAYLOAD_BYTES) {
            return NextResponse.json({ error: "PDF payload is too large" }, { status: 413 });
        }
        const payload: unknown = await req.json();
        if (!payload || typeof payload !== "object" || JSON.stringify(payload).length > MAX_PDF_PAYLOAD_BYTES) {
            return NextResponse.json({ error: "Invalid or oversized PDF payload" }, { status: 400 });
        }
        const body = payload as Record<string, unknown>;
        const resumeData = normalizeResumeContent(body.resumeData);
        const template = ["modern", "professional", "minimal", "executive"].includes(String(body.template)) ? String(body.template) : "modern";
        const title = typeof body.title === "string" ? body.title.slice(0, 200) : undefined;
        const fontFamily = typeof body.fontFamily === "string" ? body.fontFamily : undefined;
        
        const candidateName = resumeData?.basics?.name || "";
        const docTitle = title || (candidateName ? `${candidateName} - Resume` : "Resume");
        const safeTitle = (candidateName || title || "Resume").replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_') || "Resume";

        // 1. Generate the HTML content with document title
        const html = generateResumeHtml(resumeData, template, fontFamily, docTitle);

        // 2. Generate PDF Buffer
        const pdfBuffer = await renderPdfBuffer(html);

        // 3. Return the PDF as a downloadable attachment
        return new Response(Buffer.from(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${safeTitle}.pdf"; filename*=UTF-8''${encodeURIComponent(safeTitle)}.pdf`,
            }
        });

    } catch (outerError: unknown) {
        return handleApiError(outerError, "POST /api/export/pdf outer");
    }
}

export async function GET(req: NextRequest) {
    try {
        const { auth: authCtx, errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

        const { searchParams } = new URL(req.url);
        const resumeId = searchParams.get("id");
        const isVersion = searchParams.get("version") === "true";

        if (!resumeId) {
            return NextResponse.json({ error: "Missing resume id" }, { status: 400 });
        }

        let resumeContent: ResumeRenderData;
        let resumeTitle = "Resume";

        if (isVersion) {
            const version = await db.query.resumeVersions.findFirst({
                where: and(eq(resumeVersionsTable.id, resumeId), eq(resumeVersionsTable.userId, authCtx.user.id))
            });
            if (!version) return NextResponse.json({ error: "Version not found" }, { status: 404 });
            resumeContent = normalizeResumeContent(typeof version.content === "string" ? JSON.parse(version.content) : version.content);
            resumeTitle = version.title;
        } else {
            const resume = await db.query.resumes.findFirst({
                where: and(eq(resumesTable.id, resumeId), eq(resumesTable.userId, authCtx.user.id))
            });
            if (!resume) return NextResponse.json({ error: "Resume not found" }, { status: 404 });
            resumeContent = normalizeResumeContent(typeof resume.content === "string" ? JSON.parse(resume.content) : resume.content);
            resumeTitle = resume.title;
        }

        const candidateName = resumeContent?.basics?.name || "";
        const docTitle = resumeTitle || (candidateName ? `${candidateName} - Resume` : "Resume");
        const safeTitle = (candidateName || resumeTitle || "Resume").replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_') || "Resume";

        const html = generateResumeHtml(resumeContent, "modern", undefined, docTitle);
        const pdfBuffer = await renderPdfBuffer(html);

        return new Response(Buffer.from(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${safeTitle}.pdf"; filename*=UTF-8''${encodeURIComponent(safeTitle)}.pdf`,
            }
        });
    } catch (err: unknown) {
        return handleApiError(err, "GET /api/export/pdf");
    }
}
