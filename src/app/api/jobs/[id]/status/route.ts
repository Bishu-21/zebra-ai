import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-policy";
import { getBackgroundJob } from "@/lib/background-ops";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { auth: authCtx, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const job = await getBackgroundJob(authCtx.user.id, id);
    if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({
        success: true,
        job: {
            id: job.id,
            operationType: job.operationType,
            status: job.status,
            progressPercent: job.progressPercent,
            result: job.result,
            errorMessage: job.errorMessage,
            startedAt: job.startedAt,
            completedAt: job.completedAt,
        },
    });
}
