import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resumes as resumesTable } from "@/lib/schema";
import { handleApiError } from "@/lib/api-error";
import { duplicateResumeSchema } from "@/lib/validation";
import crypto from "crypto";
import { requireAuth, getUserOwnedResume, notFoundResponse } from "@/lib/auth-policy";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { auth: authCtx, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const { id } = await params;
    
    // 1. Get original resume and verify ownership
    const original = await getUserOwnedResume(authCtx.user.id, id);

    if (!original) {
      return notFoundResponse("Resume");
    }

    // 2. Parse body for target info
    let targetInfo = {};
    try {
        const body = await req.json();
        const validation = duplicateResumeSchema.safeParse(body);
        if (validation.success) {
            targetInfo = validation.data;
        }
    } catch {
        // Body might be empty, which is fine
    }

    const { targetRole, targetCompany } = targetInfo as { targetRole?: string; targetCompany?: string };

    // 3. Create duplicate
    const newId = crypto.randomUUID();
    const newTitle = targetRole && targetCompany 
      ? `${original.title} (${targetRole} @ ${targetCompany})`
      : targetRole
        ? `${original.title} (${targetRole})`
        : `${original.title} (Copy)`;

    await db.insert(resumesTable).values({
      id: newId,
      userId: authCtx.user.id,
      parentResumeId: original.id,
      title: newTitle,
      content: original.content,
      targetRole: targetRole || null,
      targetCompany: targetCompany || null,
      status: "Draft",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      id: newId,
      message: "Resume duplicated successfully",
    });

  } catch (error: unknown) {
    return handleApiError(error, "POST /api/resumes/[id]/duplicate");
  }
}
