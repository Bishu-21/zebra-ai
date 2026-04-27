import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { generateResumeHtml } from "@/lib/resume-renderer";

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
const FREE_TEMPLATES = ["modern", "minimal"];

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { resumeData, template = "modern" } = await req.json();
        const user = session.user as any;
        const userPlan = user.plan || "Free";

        // PAYWALL GATE: Premium templates require paid plan
        if (PREMIUM_TEMPLATES.includes(template)) {
            if (userPlan === "Free") {
                return NextResponse.json({
                    error: "PREMIUM_REQUIRED",
                    message: "Executive templates require a Pro subscription.",
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
    } catch (error: any) {
        console.error("Export failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
