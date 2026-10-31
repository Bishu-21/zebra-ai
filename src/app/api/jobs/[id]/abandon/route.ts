import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-policy";
import { failResumeAuditAndRefund, getBackgroundJob } from "@/lib/background-ops";
import { ANALYSIS_POLL_TIMEOUT_MS } from "@/lib/analysis-job-poll";

const ABANDON_PENDING_MESSAGE = "Abandoned before analysis started. Credit refunded.";
const ABANDON_TIMEOUT_MESSAGE = "Analysis timed out. Credit refunded.";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { auth: authCtx, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const body = await req.json().catch(() => ({})) as { reason?: string };
    const timeout = body.reason === "timeout";

    const job = await getBackgroundJob(authCtx.user.id, id);
    if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.operationType !== "resume_audit") {
        return NextResponse.json({ error: "This job cannot be abandoned." }, { status: 400 });
    }

    if (job.status === "completed" || job.status === "failed") {
        return NextResponse.json({
            success: true,
            refunded: false,
            status: job.status,
        });
    }

    if (job.status === "processing" && !timeout) {
        return NextResponse.json({
            success: true,
            refunded: false,
            status: job.status,
        });
    }

    if (timeout && Date.now() - job.createdAt.getTime() < ANALYSIS_POLL_TIMEOUT_MS) {
        return NextResponse.json({ success: true, refunded: false, status: job.status });
    }

    const claimed = await failResumeAuditAndRefund(authCtx.user.id, id,
        timeout ? ABANDON_TIMEOUT_MESSAGE : ABANDON_PENDING_MESSAGE, !timeout);

    return NextResponse.json({
        success: true,
        refunded: claimed,
        status: claimed ? "failed" : (await getBackgroundJob(authCtx.user.id, id))?.status ?? job.status,
    });
}
