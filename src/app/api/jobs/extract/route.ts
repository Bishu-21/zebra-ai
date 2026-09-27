import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-policy";
import { checkDistributedRateLimit } from "@/lib/rate-limit";
import { extractResumeText } from "@/lib/resume-ingestion";
import { validateJobDocument, validateJobText } from "@/lib/job-document";
import { sanitizeSecretText } from "@/lib/db";

export async function POST(request: NextRequest) {
  const { auth, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  const rate = await checkDistributedRateLimit(`job-extract:${auth.user.id}`, 10, 60_000);
  if (!rate.success) return NextResponse.json({ error: "Too many uploads. Try again in a minute." }, { status: 429 });
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > 5 * 1024 * 1024 + 32 * 1024) return NextResponse.json({ error: "File exceeds the 5 MB limit." }, { status: 413 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a PDF or TXT job description." }, { status: 400 });
  const fileError = validateJobDocument(file);
  if (fileError) return NextResponse.json({ error: fileError }, { status: 400 });
  try {
    const jobDescription = await extractResumeText(file);
    const textError = validateJobText(jobDescription);
    if (textError) return NextResponse.json({ error: textError }, { status: 400 });
    return NextResponse.json({ jobDescription });
  } catch (error) {
    console.warn("Job document extraction failed:", sanitizeSecretText(error instanceof Error ? error.message : String(error)));
    return NextResponse.json({ error: "Could not read this job document. Check the file or paste the description." }, { status: 400 });
  }
}
