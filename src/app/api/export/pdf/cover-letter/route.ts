import { NextRequest, NextResponse } from "next/server";
import { generateCoverLetterHtml } from "@/lib/cover-letter-renderer";
import { requireAuth } from "@/lib/auth-policy";
import { renderPdfBuffer } from "@/lib/pdf-browser";
import { handleApiError } from "@/lib/api-error";

const MAX_COVER_LETTER_PDF_PAYLOAD_BYTES = 256 * 1024;

/**
 * COVER LETTER PDF EXPORT API
 *
 * Generates a high-quality PDF from cover letter content using Puppeteer.
 */

export async function POST(req: NextRequest) {
    try {
        const { errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

        const contentLength = Number(req.headers.get("content-length") || 0);
        if (contentLength > MAX_COVER_LETTER_PDF_PAYLOAD_BYTES) {
            return NextResponse.json({ error: "PDF payload is too large" }, { status: 413 });
        }
        const payload: unknown = await req.json();
        if (!payload || typeof payload !== "object" || JSON.stringify(payload).length > MAX_COVER_LETTER_PDF_PAYLOAD_BYTES) {
            return NextResponse.json({ error: "Invalid or oversized PDF payload" }, { status: 400 });
        }
        const body = payload as Record<string, unknown>;
        const content = typeof body.content === "string" ? body.content.trim() : "";
        const title = typeof body.title === "string" ? body.title.slice(0, 200) : "Cover Letter";
        if (!content) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, "") || "cover-letter";

        // 1. Generate the HTML content
        const html = generateCoverLetterHtml(content, title || "Cover Letter");

        const pdfBuffer = await renderPdfBuffer(html);
        return new Response(Buffer.from(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${safeTitle}.pdf"`,
            }
        });
    } catch (outerError: unknown) {
        return handleApiError(outerError, "POST /api/export/pdf/cover-letter");
    }
}
