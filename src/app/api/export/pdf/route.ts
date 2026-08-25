import { NextRequest, NextResponse } from "next/server";
import { generateResumeHtml } from "@/lib/resume-renderer";
import { handleApiError } from "@/lib/api-error";
import puppeteer, { type Browser } from "puppeteer-core";
import { requireAuth } from "@/lib/auth-policy";
import { getPdfBrowserConfig } from "@/lib/pdf-browser";
import { db } from "@/lib/db";
import { resumes as resumesTable, resumeVersions as resumeVersionsTable } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

/**
 * PREMIUM PDF EXPORT API
 *
 * Generates a high-quality PDF using a headless browser.
 * Supports both POST (direct data from editor) and GET (download by ID from vault).
 */

async function renderPdfBuffer(html: string): Promise<Uint8Array> {
    let browser: Browser | null = null;
    try {
        const launchConfig = await getPdfBrowserConfig();

        browser = await puppeteer.launch({
            args: launchConfig.args,
            defaultViewport: launchConfig.defaultViewport,
            executablePath: launchConfig.executablePath,
            headless: launchConfig.headless,
        });

        const page = await browser.newPage();

        page.on('error', (err: unknown) => console.error('PDF page error:', err));
        page.on('pageerror', (err: unknown) => console.error('PDF page crash:', err));

        await page.setContent(html, { waitUntil: "domcontentloaded" });
        await page.waitForNetworkIdle({ idleTime: 500, timeout: 10_000 });
        await page.evaluate(() => document.fonts.ready);

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
            scale: 1,
            preferCSSPageSize: true
        });

        return pdfBuffer;
    } finally {
        if (browser) {
            try {
                await browser.close();
            } catch (e) {
                console.error("Error closing browser in PDF export:", e);
            }
        }
    }
}

export async function POST(req: NextRequest) {
    try {
        const { errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

        const { resumeData, template = "modern", title, fontFamily } = await req.json();
        
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

        let resumeContent: any = null;
        let resumeTitle = "Resume";

        if (isVersion) {
            const version = await db.query.resumeVersions.findFirst({
                where: and(eq(resumeVersionsTable.id, resumeId), eq(resumeVersionsTable.userId, authCtx.user.id))
            });
            if (!version) return NextResponse.json({ error: "Version not found" }, { status: 404 });
            resumeContent = typeof version.content === "string" ? JSON.parse(version.content) : version.content;
            resumeTitle = version.title;
        } else {
            const resume = await db.query.resumes.findFirst({
                where: and(eq(resumesTable.id, resumeId), eq(resumesTable.userId, authCtx.user.id))
            });
            if (!resume) return NextResponse.json({ error: "Resume not found" }, { status: 404 });
            resumeContent = typeof resume.content === "string" ? JSON.parse(resume.content) : resume.content;
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
