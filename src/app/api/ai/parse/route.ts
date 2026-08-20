import { NextRequest, NextResponse } from "next/server";
import { parseSchema } from "@/lib/validation";
import { requireAuth } from "@/lib/auth-policy";
import { checkDistributedRateLimit } from "@/lib/rate-limit";
import { reserveUserCredits, refundUserCredits } from "@/lib/credit-policy";
import { sanitizeSecretText } from "@/lib/db";
import { ingestResumeText } from "@/lib/resume-ingestion";

export async function POST(req: NextRequest) {
    const { auth: authCtx, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const rateCheck = await checkDistributedRateLimit(`ai-parse:${authCtx.user.id}`, 10, 60_000);
    if (!rateCheck.success) {
        return NextResponse.json({ error: "Rate limit exceeded. Try again in a minute." }, { status: 429 });
    }

    const validation = parseSchema.safeParse(await req.json().catch(() => ({})));
    if (!validation.success) {
        return NextResponse.json({ error: validation.error.issues[0]?.message || "Invalid payload" }, { status: 400 });
    }

    const credit = await reserveUserCredits(authCtx.user.id, 1);
    if (!credit.success) {
        return NextResponse.json({ error: credit.error || "Insufficient credits." }, { status: 402 });
    }

    try {
        const result = await ingestResumeText(validation.data.text);
        return NextResponse.json(result.content);
    } catch (error: unknown) {
        await refundUserCredits(authCtx.user.id, 1);
        console.error("AI resume parse failed:", sanitizeSecretText(error instanceof Error ? error.message : String(error)));
        return NextResponse.json(
            { error: "Resume structuring failed. The original content is unchanged and your credit was refunded." },
            { status: 502 },
        );
    }
}
