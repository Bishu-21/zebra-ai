import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { resumes as resumesTable } from "@/lib/schema";
import { headers } from "next/headers";
import { handleApiError } from "@/lib/api-error";
import crypto from "crypto";
import { MAX_FILE_SIZE, MAX_TITLE_LENGTH, MAX_CONTENT_LENGTH } from "@/lib/validation";
import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string || file.name.replace(/\.[^/.]+$/, "");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Server-side size limit check (5MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit` }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let content = "";
    const fileType = file.type;

    if (fileType === "application/pdf") {
      const pdfProxy = await getDocumentProxy(new Uint8Array(bytes));
      const result = await extractText(pdfProxy, { mergePages: true });
      content = result.text;
    } else if (
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.endsWith(".docx")
    ) {
      const result = await mammoth.extractRawText({ buffer });
      content = result.value;
    } else if (fileType === "text/plain") {
      content = buffer.toString("utf-8");
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF, DOCX, or TXT." },
        { status: 400 }
      );
    }

    if (!content.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from file. Please ensure it's not an image-only scan." },
        { status: 400 }
      );
    }

    // Server-side content length check
    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: `Extracted content is too large (max ${MAX_CONTENT_LENGTH / 1024}KB of text).` },
        { status: 400 }
      );
    }

    if (title.length > MAX_TITLE_LENGTH) {
      return NextResponse.json({ error: "Title is too long" }, { status: 400 });
    }

    // Create new resume record
    const newId = crypto.randomUUID();
    await db.insert(resumesTable).values({
      id: newId,
      userId: session.user.id,
      title: title || "Uploaded Resume",
      content: content,
      status: "Draft",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ 
      success: true, 
      id: newId, 
      content,
      title 
    });

  } catch (error: unknown) {
    return handleApiError(error, "POST /api/resumes/upload");
  }
}
