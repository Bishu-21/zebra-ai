import { NextResponse } from "next/server";
import { requireAuth, AuthContext } from "@/lib/auth-policy";
import { reserveUserCredits } from "@/lib/credit-policy";
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
export function withRequestPolicy<TBody = unknown>(
    options: RequestPolicyOptions<TBody>,
    handler: (req: Request, ctx: PolicyContext<TBody>) => Promise<NextResponse>
) {
    return async (req: Request): Promise<NextResponse> => {
        try {
            let authCtx: AuthContext | null = null;

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
            }

            // 4. Delegate to underlying handler
            return await handler(req, { auth: authCtx, body });
        } catch (err) {
            console.error(`Request Policy Error in ${options.operationName || "unnamed route"}:`, err);
            return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
        }
    };
}
