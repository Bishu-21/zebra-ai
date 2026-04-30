import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { resumes } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import crypto from "crypto";
import { handleApiError } from "@/lib/api-error";

/**
 * POST /api/resumes/[id]/share — Generate a share token for public viewing
 * DELETE /api/resumes/[id]/share — Revoke sharing
 * GET /api/resumes/[id]/share — Get current share status
 */

import { shareSchema } from "@/lib/validation";

export async function POST(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = await paramsPromise;
    
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const validation = shareSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }

        const { isPublic } = validation.data;

        // Verify ownership
        const resume = await db.query.resumes.findFirst({
            where: and(eq(resumes.id, params.id), eq(resumes.userId, session.user.id)),
        });
        if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
            .where(eq(resumes.id, params.id));

        const shareUrl = `${getBaseUrl(req)}/share/${shareToken}`;
        return NextResponse.json({ shareToken, shareUrl, isPublic: isPublic ?? resume.isPublic });
    } catch (error: unknown) {
        return handleApiError(error, "Resume Share POST");
    }
}

export async function DELETE(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = await paramsPromise;
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await db.update(resumes)
            .set({ shareToken: null, isPublic: false, updatedAt: new Date() })
            .where(and(eq(resumes.id, params.id), eq(resumes.userId, session.user.id)));

        return NextResponse.json({ revoked: true });
    } catch (error: unknown) {
        return handleApiError(error, "Resume Share DELETE");
    }
}

export async function GET(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = await paramsPromise;
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const resume = await db.query.resumes.findFirst({
            where: and(eq(resumes.id, params.id), eq(resumes.userId, session.user.id)),
            columns: { shareToken: true, isPublic: true },
        });
        if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
    
    // Fallback to env var or localhost
    return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}
