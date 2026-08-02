import { NextRequest } from "next/server";
import { generateResumeHtml } from "@/lib/resume-renderer";
import { handleApiError } from "@/lib/api-error";
import puppeteer, { type Browser } from "puppeteer-core";
import { requireAuth } from "@/lib/auth-policy";
import { getPdfBrowserConfig } from "@/lib/pdf-browser";

/**
 * PREMIUM PDF EXPORT API
 * 
 * Generates a high-quality PDF using a headless browser.
 * This provides a direct "Download" experience without the browser print dialog.
 */

export async function POST(req: NextRequest) {
    try {
        const { errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

        const { resumeData, template = "modern", title, fontFamily } = await req.json();
        const safeTitle = (title || "resume").toLowerCase().replace(/[^a-z0-9]+/g, '-');


        // 1. Generate the HTML content
        const html = generateResumeHtml(resumeData, template, fontFamily);

        let browser: Browser | null = null;
        try {
            // 2. Launch headless browser with dynamic executable resolution
            const launchConfig = await getPdfBrowserConfig();

            browser = await puppeteer.launch({
                args: launchConfig.args,
                defaultViewport: launchConfig.defaultViewport,
                executablePath: launchConfig.executablePath,
                headless: launchConfig.headless,
            });

            const page = await browser.newPage();
            
            // Handle page errors
            page.on('error', (err: unknown) => console.error('PDF page error:', err));
            page.on('pageerror', (err: unknown) => console.error('PDF page crash:', err));

            await page.setContent(html, { waitUntil: 'networkidle0' });

            // 3. Generate PDF buffer with zero margin (renderer handles padding)
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '0', right: '0', bottom: '0', left: '0' },
                scale: 1,
                preferCSSPageSize: true
            });

            await browser.close();
            browser = null;

            // 4. Return the PDF as a downloadable attachment
            return new Response(Buffer.from(pdfBuffer), {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="${safeTitle}.pdf"`,
                }
            });

        } catch (err: unknown) {
            console.error("PDF Export Process Failed:", err || "Undefined Rejection");
            return handleApiError(err, "POST /api/export/pdf inner");
        } finally {
            if (browser) {
                try {
                    await browser.close();
                } catch (e) {
                    console.error("Error closing browser in PDF export:", e);
                }
            }
        }
    } catch (outerError: unknown) {
        return handleApiError(outerError, "POST /api/export/pdf outer");
    }
}
