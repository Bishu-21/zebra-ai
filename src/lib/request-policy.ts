import { NextResponse } from "next/server";
import { requireAuth, AuthContext } from "@/lib/auth-policy";
import { refundUserCredits, reserveUserCredits } from "@/lib/credit-policy";
import { getErrorMessage } from "@/lib/async-error-handler";
import { z } from "zod";

export interface RequestPolicyOptions<TBody = unknown> {
    requireAuth?: boolean;
    creditCost?: number;
    operationName?: string;
    bodySchema?: z.ZodSchema<TBody>;
}

export interface PolicyContext<TBody = unknown> {
    auth: AuthContext | null;
    body: TBody;
}

/**
 * Unified Request Policy middleware wrapper for Next.js API Routes.
 * Guarantees standard authorization, credit reservation, schema validation,
 * and error boundaries. Expensive endpoints enforce their own distributed
 * rate limits because limits vary by operation.
 */
const MAX_CREDIT_REFUND_ATTEMPTS = 3;

export function withRequestPolicy<TBody = unknown>(
    options: RequestPolicyOptions<TBody>,
    handler: (req: Request, ctx: PolicyContext<TBody>) => Promise<NextResponse>
) {
    return async (req: Request): Promise<NextResponse> => {
        let authCtx: AuthContext | null = null;
        let reservedUserId: string | null = null;
        let reservedCost = 0;
        let refunded = false;
        let refundInFlight: Promise<void> | null = null;

        const refundReservedCredits = async () => {
            if (!reservedUserId || reservedCost <= 0 || refunded) return;
            if (!refundInFlight) {
                const userId = reservedUserId;
                const cost = reservedCost;
                refundInFlight = (async () => {
                    for (let attempt = 1; attempt <= MAX_CREDIT_REFUND_ATTEMPTS && !refunded; attempt++) {
                        if (await refundUserCredits(userId, cost)) {
                            refunded = true;
                            return;
                        }
                    }
                    console.error(
                        `Request Policy Error in ${options.operationName || "unnamed route"}: failed to refund ${cost} credits after ${MAX_CREDIT_REFUND_ATTEMPTS} writes.`,
                    );
                })();
            }
            await refundInFlight;
        };

        try {
            // 1. Auth policy check
            if (options.requireAuth !== false) {
                const { auth, errorResponse } = await requireAuth();
                if (errorResponse) return errorResponse;
                authCtx = auth;
            }

            // 2. Body Schema validation (if specified)
            let body: TBody = {} as TBody;
            if (options.bodySchema && (req.method === "POST" || req.method === "PUT" || req.method === "PATCH")) {
                try {
                    const rawJson = await req.json();
                    const parseResult = options.bodySchema.safeParse(rawJson);
                    if (!parseResult.success) {
                        return NextResponse.json({
                            error: "Validation failed",
                            details: parseResult.error.flatten(),
                        }, { status: 400 });
                    }
                    body = parseResult.data;
                } catch {
                    return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
                }
            }

            // 3. Credit policy check & reservation (if creditCost > 0 and authenticated)
            if (options.creditCost && options.creditCost > 0 && authCtx?.user?.id) {
                const userId = authCtx.user.id;
                const creditRes = await reserveUserCredits(userId, options.creditCost);
                if (!creditRes.success) {
                    return NextResponse.json({
                        error: creditRes.error || "Insufficient credits",
                        required: options.creditCost,
                        available: creditRes.remainingCredits ?? 0,
                    }, { status: 402 });
                }
                reservedUserId = userId;
                reservedCost = options.creditCost;
            }

            // 4. Delegate to underlying handler. A reserved charge is kept only
            // when the handler finishes with a successful response.
            const response = await handler(req, { auth: authCtx, body });
            if (response.status >= 400) {
                await refundReservedCredits();
            }
            return response;
        } catch (err) {
            await refundReservedCredits();
            console.error(`Request Policy Error in ${options.operationName || "unnamed route"}:`, err);
            return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
        }
    };
}
