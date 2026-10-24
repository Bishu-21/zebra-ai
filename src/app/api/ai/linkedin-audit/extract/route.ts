import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-policy";
import { checkDistributedRateLimit } from "@/lib/rate-limit";
import { extractResumeText } from "@/lib/resume-ingestion";
import { sanitizeSecretText } from "@/lib/db";

export async function POST(request: NextRequest) {
  const { auth, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  const rate = await checkDistributedRateLimit(`linkedin-extract:${auth.user.id}`, 10, 60_000);
  if (!rate.success) return NextResponse.json({ error: "Too many uploads. Try again in a minute." }, { status: 429 });
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > 5 * 1024 * 1024 + 32 * 1024) return NextResponse.json({ error: "File exceeds the 5 MB limit." }, { status: 413 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a LinkedIn PDF export or text file." }, { status: 400 });
  if (!/\.(pdf|txt)$/i.test(file.name)) return NextResponse.json({ error: "Only PDF and TXT profile exports are supported." }, { status: 400 });
  try {
    const profileText = await extractResumeText(file);
    if (profileText.length > 30000) return NextResponse.json({ error: "Profile text exceeds 30,000 characters. Remove unrelated content and try again." }, { status: 400 });
    return NextResponse.json({ profileText });
  } catch (error) {
    console.warn("LinkedIn export extraction failed:", sanitizeSecretText(error instanceof Error ? error.message : String(error)));
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not read the profile export." }, { status: 400 });
  }
}
