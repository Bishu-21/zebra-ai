import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resumes as resumesTable } from "@/lib/schema";
import { handleApiError } from "@/lib/api-error";
import crypto from "crypto";
import { MAX_TITLE_LENGTH, MAX_CONTENT_LENGTH } from "@/lib/validation";
import { requireAuth } from "@/lib/auth-policy";

export async function POST(req: NextRequest) {
  try {
    const { auth: authCtx, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const { text, title } = await req.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    if (text.length < 50) {
      return NextResponse.json({ error: "Content is too short (min 50 characters)" }, { status: 400 });
    }

    if (text.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: `Content is too large (max ${MAX_CONTENT_LENGTH / 1024}KB of text).` },
        { status: 400 }
      );
    }

    const safeTitle = (title || "Imported LaTeX").trim();
    if (safeTitle.length > MAX_TITLE_LENGTH) {
      return NextResponse.json({ error: `Title must be under ${MAX_TITLE_LENGTH} characters.` }, { status: 400 });
    }

    // Create new resume record with raw text content
    const newId = crypto.randomUUID();
    await db.insert(resumesTable).values({
      id: newId,
      userId: authCtx.user.id,
      title: safeTitle || "Imported LaTeX",
      content: text,
      status: "Draft",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ 
      success: true, 
      id: newId, 
      title: safeTitle 
    });

  } catch (error: unknown) {
    return handleApiError(error, "POST /api/resumes/import-raw");
  }
}
