import { NextRequest, NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay";
import { db, executeWithDbRetry, sanitizeSecretText } from "@/lib/db";
import { transactions as transactionsTable } from "@/lib/schema";
import { PLANS, PlanId } from "@/lib/constants/plans";
import crypto from "crypto";
import { requireAuth } from "@/lib/auth-policy";
import { checkDistributedRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
    try {
        const { auth: authCtx, errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

        // Browser verification cannot recover a payment if the customer closes the tab.
        // Do not accept new orders until the signed webhook recovery path is configured.
        if (!process.env.RAZORPAY_WEBHOOK_SECRET?.trim()) {
            console.error("[Razorpay] Checkout disabled: webhook secret is missing.");
            return NextResponse.json({ error: "Checkout is temporarily unavailable. Please contact support." }, { status: 503 });
        }

        // Rate limiting boundary (max 10 order creation requests per minute per user)
        const rateCheck = await checkDistributedRateLimit(`create-order:${authCtx.user.id}`, 10, 60000);
        if (!rateCheck.success) {
            return NextResponse.json({
                error: "Too many payment initiation requests. Please wait a minute."
            }, { status: 429 });
        }

        const body = await req.json().catch(() => ({}));
        const { planId } = body;

        if (typeof planId !== "string" || !Object.hasOwn(PLANS, planId)) {
            return NextResponse.json({ error: "Invalid plan identifier" }, { status: 400 });
        }

        const plan = PLANS[planId as PlanId];
        const amountInPaise = plan.priceInINR * 100;
        if (!Number.isSafeInteger(amountInPaise) || amountInPaise < 100) {
            return NextResponse.json({ error: "Payment amount must be at least 100 paise" }, { status: 400 });
        }

        const options = {
            amount: amountInPaise,
            currency: "INR",
            receipt: `receipt_${Date.now()}_${authCtx.user.id.slice(0, 8)}`,
            notes: {
                userId: authCtx.user.id,
                planId: plan.id,
            }
        };

        const order = await razorpay.orders.create(options);

        // Record pending transaction with transient retry policy
        await executeWithDbRetry(() =>
            db.insert(transactionsTable).values({
                id: crypto.randomUUID(),
                userId: authCtx.user.id,
                provider: "razorpay",
                orderId: order.id,
                planId: plan.id,
                credits: plan.credits,
                amount: amountInPaise,
                currency: "INR",
                status: "pending",
                createdAt: new Date(),
                updatedAt: new Date(),
            })
        );

        return NextResponse.json({
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        });

    } catch (error: unknown) {
        const sanitizedMsg = sanitizeSecretText(error instanceof Error ? error.message : String(error));
        console.error("Razorpay Order Creation Error:", sanitizedMsg);
        const status = typeof error === "object" && error !== null && "statusCode" in error
            ? Number(error.statusCode) : 0;
        return NextResponse.json({
            error: status === 401 ? "Razorpay authentication failed. Contact support." : "Failed to initiate payment transaction safely. Please try again."
        }, { status: status === 401 ? 401 : 500 });
    }
}
