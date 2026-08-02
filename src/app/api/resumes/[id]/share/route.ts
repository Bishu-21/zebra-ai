import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resumes } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { handleApiError } from "@/lib/api-error";
import { shareSchema } from "@/lib/validation";
import { requireAuth, getUserOwnedResume, notFoundResponse } from "@/lib/auth-policy";

/**
 * POST /api/resumes/[id]/share — Generate a share token for public viewing
 * DELETE /api/resumes/[id]/share — Revoke sharing
 * GET /api/resumes/[id]/share — Get current share status
 */

export async function POST(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = await paramsPromise;
    
    try {
        const { auth: authCtx, errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

        const body = await req.json();
        const validation = shareSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }

        const { isPublic } = validation.data;

        // Verify ownership
        const resume = await getUserOwnedResume(authCtx.user.id, params.id);
        if (!resume) return notFoundResponse("Resume");

        // Generate token if it doesn't exist
        let shareToken = resume.shareToken;
        if (!shareToken) {
            shareToken = crypto.randomBytes(16).toString("hex");
        }
        
        await db.update(resumes)
            .set({ 
                shareToken, 
                isPublic: isPublic ?? resume.isPublic,
                updatedAt: new Date() 
            })
            .where(and(eq(resumes.id, params.id), eq(resumes.userId, authCtx.user.id)));

        const shareUrl = `${getBaseUrl(req)}/share/${shareToken}`;
        return NextResponse.json({ shareToken, shareUrl, isPublic: isPublic ?? resume.isPublic });
    } catch (error: unknown) {
        return handleApiError(error, "Resume Share POST");
    }
}

export async function DELETE(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = await paramsPromise;
    try {
        const { auth: authCtx, errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

        const [updated] = await db.update(resumes)
            .set({ shareToken: null, isPublic: false, updatedAt: new Date() })
            .where(and(eq(resumes.id, params.id), eq(resumes.userId, authCtx.user.id)))
            .returning({ id: resumes.id });

        if (!updated) {
            return notFoundResponse("Resume");
        }

        return NextResponse.json({ revoked: true });
    } catch (error: unknown) {
        return handleApiError(error, "Resume Share DELETE");
    }
}

export async function GET(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = await paramsPromise;
    try {
        const { auth: authCtx, errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

        const resume = await getUserOwnedResume(authCtx.user.id, params.id);
        if (!resume) return notFoundResponse("Resume");

        if (resume.shareToken) {
            const shareUrl = `${getBaseUrl(req)}/share/${resume.shareToken}`;
            return NextResponse.json({ 
                shared: true, 
                shareToken: resume.shareToken, 
                shareUrl, 
                isPublic: resume.isPublic 
            });
        }
        return NextResponse.json({ shared: false, isPublic: false });
    } catch (error: unknown) {
        return handleApiError(error, "Resume Share GET");
    }
}

function getBaseUrl(req: NextRequest): string {
    const host = req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || "https";
    
    if (host) return `${proto}://${host}`;
    
    return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}
