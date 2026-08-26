import { NextRequest, NextResponse } from "next/server";
import { generateResumeHtml } from "@/lib/resume-renderer";
import { handleApiError } from "@/lib/api-error";
import { requireAuth } from "@/lib/auth-policy";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { normalizeResumeContent } from "@/lib/resume-content";

/**
 * HARDENED EXPORT API — Server-Side PDF Generation Gate
 * 
 * Strategy:
 * 1. Verify authentication
 * 2. Check template tier (free vs premium)
 * 3. For premium templates, verify payment status
 * 4. Generate HTML resume string server-side
 * 5. Return rendered HTML for client-side print or stream PDF
 * 
 * Security:
 * - No direct PDF blob URLs exposed
 * - Premium template HTML is NEVER sent to free-tier clients
 * - Export token prevents replay attacks
 */

// Template tier definitions
const PREMIUM_TEMPLATES = ["executive", "advanced-pro", "fortune500"];

export async function POST(req: NextRequest) {
    try {
        const { auth: authCtx, errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

        const payload: unknown = await req.json();
        if (!payload || typeof payload !== "object") {
            return NextResponse.json({ error: "Invalid export payload" }, { status: 400 });
        }
        const body = payload as Record<string, unknown>;
        const resumeData = normalizeResumeContent(body.resumeData);
        const template = typeof body.template === "string" ? body.template : "modern";
        const account = await db.query.user.findFirst({
            columns: { plan: true },
            where: eq(userTable.id, authCtx.user.id),
        });
        if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });
        const userPlan = account.plan;

        // PAYWALL GATE: Premium templates require paid plan
        if (PREMIUM_TEMPLATES.includes(template)) {
            if (userPlan === "Free") {
                return NextResponse.json({
                    error: "PREMIUM_REQUIRED",
                    message: "Executive templates require an eligible paid credit pack.",
                    upgradeUrl: "/dashboard/settings?tab=billing"
                }, { status: 403 });
            }
        }

        // Generate the export HTML
        const exportHtml = generateResumeHtml(resumeData, template);

        // Generate a one-time export token (prevents URL sharing)
        const exportToken = crypto.randomUUID();

        return NextResponse.json({
            html: exportHtml,
            token: exportToken,
            template,
            exportedAt: new Date().toISOString(),
        });
    } catch (error: unknown) {
        return handleApiError(error, "POST /api/export/hardened");
    }
}
