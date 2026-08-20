import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-policy";
import { extractJobIntelligence, isAzureConfigured } from "@/lib/azure/language";
import { checkDistributedRateLimit } from "@/lib/rate-limit";
import { MAX_JOB_DESC_LENGTH } from "@/lib/validation";

const jobIntelligenceSchema = z.object({
    jobDescription: z
        .string()
        .trim()
        .min(20, "Job description is too short")
        .max(MAX_JOB_DESC_LENGTH),
});

export async function POST(req: NextRequest) {
    try {
        const { auth, errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

        const rateCheck = await checkDistributedRateLimit(`job-intelligence:${auth.user.id}`, 15, 60_000);
        if (!rateCheck.success) {
            return NextResponse.json(
                { error: "Rate limit exceeded. Please wait before enriching another job description." },
                { status: 429 },
            );
        }

        const validation = jobIntelligenceSchema.safeParse(await req.json());
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0]?.message || "Invalid job description" },
                { status: 400 },
            );
        }

        if (!isAzureConfigured) {
            return NextResponse.json({
                success: false,
                error: "Azure AI Language is not configured",
                fallback: true,
            });
        }

        const intelligence = await extractJobIntelligence(validation.data.jobDescription);
        if (!intelligence) {
            return NextResponse.json(
                { error: "Job intelligence could not be extracted" },
                { status: 502 },
            );
        }

        return NextResponse.json({ success: true, data: intelligence });
    } catch (error) {
        const name = error instanceof Error ? error.name : "UnknownError";
        console.error(`Job intelligence failed (${name}).`);
        return NextResponse.json({ error: "Job intelligence is temporarily unavailable" }, { status: 502 });
    }
}
