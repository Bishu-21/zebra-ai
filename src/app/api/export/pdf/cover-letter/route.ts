import { NextRequest, NextResponse } from "next/server";
import { generateCoverLetterHtml } from "@/lib/cover-letter-renderer";
import chromium from "@sparticuz/chromium-min";
import puppeteer, { type Browser } from "puppeteer-core";

/**
 * COVER LETTER PDF EXPORT API
 * 
 * Generates a high-quality PDF from cover letter content using Puppeteer.
 */

export async function POST(req: NextRequest) {
    try {
        const { content, title } = await req.json();
        
        if (!content) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        const safeTitle = (title || "cover-letter").toLowerCase().replace(/[^a-z0-9]+/g, '-');

        // 1. Generate the HTML content
        const html = generateCoverLetterHtml(content, title || "Cover Letter");

        let browser: Browser | null = null;
        try {
            // 2. Launch headless browser
            const isLocal = process.env.NODE_ENV === 'development';
            
            browser = await puppeteer.launch({
                args: isLocal ? [] : [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
                defaultViewport: (chromium as unknown as { defaultViewport: { width: number; height: number } }).defaultViewport,
                executablePath: isLocal 
                    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' 
                    : await chromium.executablePath(),
                headless: (chromium as unknown as { headless: boolean | "shell" }).headless,
            });

            const page = await browser.newPage();

            // Handle page errors
            page.on('error', (err: unknown) => console.error('CL page error:', err));
            page.on('pageerror', (err: unknown) => console.error('CL page crash:', err));

            await page.setContent(html, { waitUntil: 'networkidle0' });

            // 3. Generate PDF buffer
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '0', right: '0', bottom: '0', left: '0' },
                scale: 1,
                preferCSSPageSize: true
            });

            await browser.close();
            browser = null;

            // 4. Return the PDF
            return new Response(Buffer.from(pdfBuffer), {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="${safeTitle}.pdf"`,
                }
            });

        } catch (err: unknown) {
            console.error("Cover Letter PDF Export Failed:", err || "Undefined Rejection");
            return NextResponse.json({ 
                error: "Failed to generate Cover Letter PDF.",
                details: err instanceof Error ? err.message : String(err || "Unknown error")
            }, { status: 500 });
        } finally {
            if (browser) {
                try {
                    await browser.close();
                } catch (e) {
                    console.error("Error closing browser in cover letter PDF export:", e);
                }
            }
        }
    } catch (outerError: unknown) {
        console.error("Fatal Cover Letter PDF Error:", outerError || "Undefined Fatal Error");
        return NextResponse.json({ 
            error: "Internal Server Error",
            details: outerError instanceof Error ? outerError.message : "Fatal error with no details"
        }, { status: 500 });
    }
}
