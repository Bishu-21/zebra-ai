import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-policy";
import { failPendingBackgroundJob, getBackgroundJob } from "@/lib/background-ops";
import { refundUserCredits } from "@/lib/credit-policy";

const ABANDON_MESSAGE = "Abandoned before the worker started. Credit refunded.";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { auth: authCtx, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const { id } = await params;
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

    if (job.status === "processing") {
        return NextResponse.json({
            success: true,
            refunded: false,
            status: job.status,
        });
    }

    const claimed = await failPendingBackgroundJob(authCtx.user.id, id, ABANDON_MESSAGE);
    if (claimed) {
        await refundUserCredits(authCtx.user.id, 1);
    }

    return NextResponse.json({
        success: true,
        refunded: claimed,
        status: claimed ? "failed" : (await getBackgroundJob(authCtx.user.id, id))?.status ?? job.status,
    });
}
