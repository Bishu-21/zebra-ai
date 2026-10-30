import type { ResumeAnalysisData } from "@/components/compiler/types";
import { readApiResponse } from "@/lib/api-response";

export const ANALYSIS_POLL_INTERVAL_MS = 2_000;
export const ANALYSIS_POLL_TIMEOUT_MS = 3 * 60 * 1000;

export interface ResumeAnalysisOutcome {
    analysis: ResumeAnalysisData;
    resumeId: string;
}

export interface AnalysisJobPollOptions {
    signal?: AbortSignal;
    fetchImpl?: typeof fetch;
    intervalMs?: number;
    timeoutMs?: number;
    now?: () => number;
    sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
}

function throwIfAborted(signal?: AbortSignal): void {
    if (signal?.aborted) throw new Error("Analysis cancelled");
}

export async function sleepWithAbort(ms: number, signal?: AbortSignal): Promise<void> {
    throwIfAborted(signal);
    await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
            signal?.removeEventListener("abort", onAbort);
            resolve();
        }, ms);
        const onAbort = () => {
            clearTimeout(timer);
            reject(new Error("Analysis cancelled"));
        };
        signal?.addEventListener("abort", onAbort, { once: true });
    });
}

function readCompletedResult(result: unknown, fallbackResumeId?: string): ResumeAnalysisOutcome {
    if (!result || typeof result !== "object") {
        throw new Error("Analysis completed without a result.");
    }
    const record = result as Record<string, unknown>;
    if (!record.analysis || typeof record.analysis !== "object") {
        throw new Error("Analysis completed without a result.");
    }
    const resumeId = typeof record.resumeId === "string" && record.resumeId
        ? record.resumeId
        : fallbackResumeId;
    if (!resumeId) throw new Error("Analysis completed without a resume id.");
    return { analysis: record.analysis as ResumeAnalysisData, resumeId };
}

export function isQueuedAnalysisResponse(status: number, body: Record<string, unknown>): body is Record<string, unknown> & { jobId: string } {
    const jobId = typeof body.jobId === "string" ? body.jobId : "";
    return Boolean(jobId) && (status === 202 || body.status === "pending");
}

async function abandonQueuedAnalysisJob(
    jobId: string,
    fetchImpl: typeof fetch,
): Promise<boolean> {
    try {
        const response = await fetchImpl(`/api/jobs/${jobId}/abandon`, { method: "POST" });
        const payload = await readApiResponse<{ refunded?: boolean }>(
            response,
            "Could not release the analysis credit",
        );
        return payload.refunded === true;
    } catch {
        return false;
    }
}

function timedOutError(refunded: boolean): Error {
    return new Error(
        refunded
            ? "Analysis timed out before it started. Your credit was refunded."
            : "Analysis timed out. Please try again.",
    );
}

function cancelledError(refunded: boolean): Error {
    return new Error(
        refunded
            ? "Analysis cancelled. Your credit was refunded."
            : "Analysis cancelled",
    );
}

export async function pollResumeAnalysisJob(
    jobId: string,
    fallbackResumeId?: string,
    options: AnalysisJobPollOptions = {},
): Promise<ResumeAnalysisOutcome> {
    const fetchImpl = options.fetchImpl ?? fetch;
    const intervalMs = options.intervalMs ?? ANALYSIS_POLL_INTERVAL_MS;
    const timeoutMs = options.timeoutMs ?? ANALYSIS_POLL_TIMEOUT_MS;
    const now = options.now ?? Date.now;
    const sleep = options.sleep ?? sleepWithAbort;
    const startedAt = now();

    const releaseIfUnstarted = async (reason: "timeout" | "cancelled"): Promise<never> => {
        const refunded = await abandonQueuedAnalysisJob(jobId, fetchImpl);
        throw reason === "timeout" ? timedOutError(refunded) : cancelledError(refunded);
    };

    while (true) {
        if (options.signal?.aborted) {
            await releaseIfUnstarted("cancelled");
        }
        if (now() - startedAt > timeoutMs) {
            await releaseIfUnstarted("timeout");
        }

        const response = await fetchImpl(`/api/jobs/${jobId}/status`, { signal: options.signal });
        const payload = await readApiResponse<{ job?: Record<string, unknown> }>(response, "Analysis failed");
        const job = payload.job;
        const status = typeof job?.status === "string" ? job.status : "";

        if (status === "completed") {
            return readCompletedResult(job?.result, fallbackResumeId);
        }
        if (status === "failed") {
            const message = typeof job?.errorMessage === "string" && job.errorMessage.trim()
                ? job.errorMessage
                : "Analysis failed";
            throw new Error(message);
        }

        try {
            await sleep(intervalMs, options.signal);
        } catch (error: unknown) {
            if (options.signal?.aborted || (error instanceof Error && /cancelled/i.test(error.message))) {
                await releaseIfUnstarted("cancelled");
            }
            throw error;
        }
        if (now() - startedAt > timeoutMs) {
            await releaseIfUnstarted("timeout");
        }
    }
}

export async function resolveResumeAnalysisResponse(
    response: Response,
    options: AnalysisJobPollOptions = {},
): Promise<ResumeAnalysisOutcome> {
    const body = await readApiResponse<Record<string, unknown>>(response, "Analysis failed");
    if (isQueuedAnalysisResponse(response.status, body)) {
        const fallbackResumeId = typeof body.resumeId === "string" ? body.resumeId : undefined;
        return pollResumeAnalysisJob(body.jobId, fallbackResumeId, options);
    }
    if (body.analysis && typeof body.analysis === "object" && typeof body.resumeId === "string" && body.resumeId) {
        return { analysis: body.analysis as ResumeAnalysisData, resumeId: body.resumeId };
    }
    throw new Error("Analysis failed");
}
