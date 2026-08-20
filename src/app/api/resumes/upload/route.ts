import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db, sanitizeSecretText } from "@/lib/db";
import { resumes as resumesTable } from "@/lib/schema";
import { requireAuth } from "@/lib/auth-policy";
import { MAX_STORED_RESUME_LENGTH, MAX_TITLE_LENGTH } from "@/lib/validation";
import { reserveUserCredits, refundUserCredits } from "@/lib/credit-policy";
import { extractResumeText, ingestResumeText } from "@/lib/resume-ingestion";
import { stringifyResumeContent } from "@/lib/resume-content";

export async function POST(req: NextRequest) {
    const { auth: authCtx, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const formData = await req.formData();
    const fileValue = formData.get("file");
    if (!(fileValue instanceof File)) {
        return NextResponse.json({ error: "Choose a PDF, DOCX, or TXT resume." }, { status: 400 });
    }

    const requestedTitle = formData.get("title");
    const title = (typeof requestedTitle === "string" && requestedTitle.trim()
        ? requestedTitle.trim()
        : fileValue.name.replace(/\.[^/.]+$/, "").trim()) || "Uploaded Resume";
    if (title.length > MAX_TITLE_LENGTH) {
        return NextResponse.json({ error: `Title must be under ${MAX_TITLE_LENGTH} characters.` }, { status: 400 });
    }

    let sourceText: string;
    try {
        sourceText = await extractResumeText(fileValue);
    } catch (error: unknown) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Could not read the uploaded document." },
            { status: 400 },
        );
    }

    const credit = await reserveUserCredits(authCtx.user.id, 1);
    if (!credit.success) {
        return NextResponse.json({ error: credit.error || "Insufficient credits." }, { status: 402 });
    }

    try {
        const result = await ingestResumeText(sourceText, {
            originalFileName: fileValue.name,
            mimeType: fileValue.type,
        });
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
        console.error("Resume upload ingestion failed:", sanitizeSecretText(error instanceof Error ? error.message : String(error)));
        return NextResponse.json(
            { error: "The resume could not be structured, so nothing was saved. Your credit was refunded." },
            { status: 502 },
        );
    }
}
