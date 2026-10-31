import { NextRequest, NextResponse, after } from "next/server";
import crypto from "crypto";
import { sanitizeSecretText } from "@/lib/db";
import { analyseSchema } from "@/lib/validation";
import { requireAuth, getUserOwnedResume, notFoundResponse } from "@/lib/auth-policy";
import { reserveUserCredits, refundUserCredits } from "@/lib/credit-policy";
import { checkDistributedRateLimit } from "@/lib/rate-limit";
import { resumeContentToPrompt } from "@/lib/resume-content";
import { dispatchBackgroundJob } from "@/lib/background-ops";
import { dispatchKafkaJob, RESUME_INGESTION_TOPIC } from "@/lib/kafka";
import { handleResumeIngestionMessage } from "@/lib/resume-audit-job";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
    const { auth: authCtx, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const rateCheck = await checkDistributedRateLimit(`ai-analyse:${authCtx.user.id}`, 10, 60_000);
    if (!rateCheck.success) {
        return NextResponse.json({ error: "Rate limit exceeded. Try again in a minute." }, { status: 429 });
    }

    const validation = analyseSchema.safeParse(await req.json().catch(() => ({})));
    if (!validation.success) {
        return NextResponse.json({ error: validation.error.issues[0]?.message || "Invalid request" }, { status: 400 });
    }

    const { resumeId, content, title } = validation.data;
    const resume = resumeId ? await getUserOwnedResume(authCtx.user.id, resumeId) : null;
    if (resumeId && !resume) return notFoundResponse("Resume");

    const sourceForAnalysis = resume
        ? resumeContentToPrompt(resume.content)
        : (content || "").trim();
    if (sourceForAnalysis.length < 50) {
        return NextResponse.json({ error: "The selected resume does not contain enough readable content." }, { status: 400 });
    }

    const credit = await reserveUserCredits(authCtx.user.id, 1);
    if (!credit.success) {
        return NextResponse.json({ error: credit.error || "Insufficient credits." }, { status: 402 });
    }

    const correlationId = crypto.randomUUID();
    const activeResumeId = resumeId || crypto.randomUUID();
    const payload = {
        jobId: "",
        userId: authCtx.user.id,
        resumeId: activeResumeId,
        sourceText: sourceForAnalysis,
        title: title || "Resume analysis draft",
        isNewDraft: !resumeId,
    };

    try {
        const job = await dispatchBackgroundJob(
            authCtx.user.id,
            "resume_audit",
            {
                resumeId: activeResumeId,
                sourceText: sourceForAnalysis,
                title: payload.title,
                isNewDraft: payload.isNewDraft,
            }
        );
        payload.jobId = job.id;
        const message = JSON.stringify(payload);

        after(async () => {
            await handleResumeIngestionMessage(message).catch((error: unknown) => {
                console.error(
                    "In-request resume analysis failed:",
                    sanitizeSecretText(error instanceof Error ? error.message : String(error)),
                );
            });
        });

        if (process.env.ENABLE_KAFKA_ANALYSIS_EVENTS === "true") after(async () => {
            await dispatchKafkaJob(
                RESUME_INGESTION_TOPIC,
                activeResumeId,
                payload,
                correlationId,
            ).catch((error: unknown) => {
                console.warn(
                    "Optional Kafka dispatch skipped:",
                    sanitizeSecretText(error instanceof Error ? error.message : String(error)),
                );
            });
        });

        return NextResponse.json(
            {
                success: true,
                jobId: job.id,
                resumeId: activeResumeId,
                status: "pending",
                remainingCredits: credit.remainingCredits,
            },
            { status: 202 }
        );
    } catch (error: unknown) {
        await refundUserCredits(authCtx.user.id, 1);
        console.error("Failed to queue resume analysis job:", sanitizeSecretText(error instanceof Error ? error.message : String(error)));
        return NextResponse.json(
            { error: "Failed to start analysis. Your credit was refunded." },
            { status: 500 }
        );
    }
}
