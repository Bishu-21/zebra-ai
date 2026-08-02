import { NextRequest, NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay";
import { db, sanitizeSecretText } from "@/lib/db";
import { transactions as transactionsTable } from "@/lib/schema";
import { PLANS, PlanId } from "@/lib/constants/plans";
import crypto from "crypto";
import { requireAuth } from "@/lib/auth-policy";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
    try {
        const { auth: authCtx, errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

        // Rate limiting boundary (max 10 order creation requests per minute per user)
        const rateCheck = checkRateLimit(`create-order:${authCtx.user.id}`, 10, 60000);
        if (!rateCheck.success) {
            return NextResponse.json({ 
                error: "Too many payment initiation requests. Please wait a minute." 
            }, { status: 429 });
        }

        const body = await req.json().catch(() => ({}));
        const { planId } = body;

        if (!planId || !(planId in PLANS)) {
            return NextResponse.json({ error: "Invalid plan identifier" }, { status: 400 });
        }

        const plan = PLANS[planId as PlanId];
        const amountInPaise = plan.priceInINR * 100;

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

        // Record pending transaction
        await db.insert(transactionsTable).values({
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
        });

        return NextResponse.json({
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        });

    } catch (error: unknown) {
        const sanitizedMsg = sanitizeSecretText(error instanceof Error ? error.message : String(error));
        console.error("Razorpay Order Creation Error:", sanitizedMsg);
        return NextResponse.json({ error: "Failed to initiate payment transaction safely." }, { status: 500 });
    }
}
