import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { razorpay } from "@/lib/razorpay";
import { db } from "@/lib/db";
import { transactions as transactionsTable } from "@/lib/schema";
import { PLANS, PlanId } from "@/lib/constants/plans";
import crypto from "crypto";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { planId } = await req.json();

        if (!planId || !(planId in PLANS)) {
            return NextResponse.json({ error: "Invalid plan identifier" }, { status: 400 });
        }

        const plan = PLANS[planId as PlanId];
        const amountInPaise = plan.priceInINR * 100; // Razorpay expects amount in subunits (paise for INR)

        const options = {
            amount: amountInPaise,
            currency: "INR",
            receipt: `receipt_${Date.now()}_${session.user.id.slice(0, 8)}`,
            notes: {
                userId: session.user.id,
                planId: plan.id,
                credits: plan.credits,
            }
        };

        const order = await razorpay.orders.create(options);

        // Record pending transaction
        await db.insert(transactionsTable).values({
            id: crypto.randomUUID(),
            userId: session.user.id,
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

    } catch (error: any) {
        console.error("Razorpay Order Creation Error:", error);
        return NextResponse.json({ error: error.message || "Failed to initiate transaction" }, { status: 500 });
    }
}
