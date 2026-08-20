import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db, sanitizeSecretText } from "@/lib/db";
import { resumes as resumesTable } from "@/lib/schema";
import { requireAuth } from "@/lib/auth-policy";
import { MAX_CONTENT_LENGTH, MAX_STORED_RESUME_LENGTH, MAX_TITLE_LENGTH } from "@/lib/validation";
import { reserveUserCredits, refundUserCredits } from "@/lib/credit-policy";
import { ingestResumeText } from "@/lib/resume-ingestion";
import { stringifyResumeContent } from "@/lib/resume-content";

export async function POST(req: NextRequest) {
    const { auth: authCtx, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const body = await req.json().catch(() => ({})) as { text?: unknown; title?: unknown };
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Imported Resume";

    if (text.length < 50) {
        return NextResponse.json({ error: "Resume content must contain at least 50 characters." }, { status: 400 });
    }
    if (text.length > MAX_CONTENT_LENGTH) {
        return NextResponse.json({ error: `Content exceeds ${MAX_CONTENT_LENGTH.toLocaleString()} characters.` }, { status: 400 });
    }
    if (title.length > MAX_TITLE_LENGTH) {
        return NextResponse.json({ error: `Title must be under ${MAX_TITLE_LENGTH} characters.` }, { status: 400 });
    }

    const credit = await reserveUserCredits(authCtx.user.id, 1);
    if (!credit.success) {
        return NextResponse.json({ error: credit.error || "Insufficient credits." }, { status: 402 });
    }

    try {
        const result = await ingestResumeText(text, { mimeType: "text/plain" });
        const serialized = stringifyResumeContent(result.content);
        if (serialized.length > MAX_STORED_RESUME_LENGTH) {
            throw new Error("The structured resume is too large to store safely.");
        }

        const id = crypto.randomUUID();
        await db.insert(resumesTable).values({
            id,
            userId: authCtx.user.id,
            title,
            content: serialized,
            status: "Draft",
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return NextResponse.json({
            success: true,
            id,
            title,
            content: serialized,
            parseStatus: result.content._ingestionMeta?.parseStatus,
            warnings: result.warnings,
        });
    } catch (error: unknown) {
        await refundUserCredits(authCtx.user.id, 1);
        console.error("Raw resume ingestion failed:", sanitizeSecretText(error instanceof Error ? error.message : String(error)));
        return NextResponse.json(
            { error: "The resume could not be structured, so nothing was saved. Your credit was refunded." },
            { status: 502 },
        );
    }
}
