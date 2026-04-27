import { NextRequest, NextResponse } from "next/server";
import { generateResumeHtml } from "@/lib/resume-renderer";
import chromium from "@sparticuz/chromium-min";
import puppeteer from "puppeteer-core";

/**
 * PREMIUM PDF EXPORT API
 * 
 * Generates a high-quality PDF using a headless browser.
 * This provides a direct "Download" experience without the browser print dialog.
 */

export async function POST(req: NextRequest) {
    try {
        const { resumeData, template = "modern", title, fontFamily } = await req.json();
        const safeTitle = (title || "resume").toLowerCase().replace(/[^a-z0-9]+/g, '-');

        // 1. Generate the HTML content
        const html = generateResumeHtml(resumeData, template, fontFamily);

        // 2. Launch headless browser
        const isLocal = process.env.NODE_ENV === 'development';
        
        const browser = await puppeteer.launch({
            args: isLocal ? [] : [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: (chromium as any).defaultViewport,
            executablePath: isLocal 
                ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' 
                : await chromium.executablePath(),
            headless: (chromium as any).headless,
        });

        const page = await browser.newPage();
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

        // 4. Return the PDF as a downloadable attachment
        return new Response(pdfBuffer as any, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${safeTitle}.pdf"`,
            }
        });

    } catch (error: any) {
        console.error("PDF Export failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
