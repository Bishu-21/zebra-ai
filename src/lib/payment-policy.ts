import crypto from "crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { transactions as transactionsTable, user as userTable } from "@/lib/schema";
import { PLANS, PlanId } from "@/lib/constants/plans";

export interface CapturedPaymentInput {
    orderId: string;
    paymentId: string;
    amount?: number;
    currency?: string;
    userId?: string;
}

export type PaymentGrantResult =
    | { status: "granted"; addedCredits: number }
    | { status: "already_processed"; addedCredits: number }
    | { status: "not_found" }
    | { status: "invalid"; reason: string };

export function verifyRazorpayHmac(message: string, signature: string, secret: string): boolean {
    if (!/^[a-f\d]{64}$/i.test(signature)) return false;

    const expected = crypto.createHmac("sha256", secret).update(message).digest();
    const received = Buffer.from(signature, "hex");
    return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}

function planLabel(planId: PlanId): string {
    if (planId === "starter") return "Starter";
    if (planId === "pro") return "Pro";
    return "Enterprise";
}

/**
 * Grant credits exactly once for a captured Razorpay payment.
 *
 * Both browser verification and webhook recovery call this function. The
 * conditional transaction update is the idempotency boundary, so duplicate
 * `payment.captured` and `order.paid` events cannot grant credits twice.
 */
export async function grantCreditsForCapturedPayment(
    input: CapturedPaymentInput,
): Promise<PaymentGrantResult> {
    const ownershipPredicate = input.userId
        ? and(
            eq(transactionsTable.orderId, input.orderId),
            eq(transactionsTable.userId, input.userId),
        )
        : eq(transactionsTable.orderId, input.orderId);

    const pendingTx = await db.query.transactions.findFirst({
        where: ownershipPredicate,
    });

    if (!pendingTx) return { status: "not_found" };

    const planId = pendingTx.planId as PlanId;
    const plan = PLANS[planId];
    if (!plan) return { status: "invalid", reason: "Unknown transaction plan." };

    const expectedAmount = plan.priceInINR * 100;
    if (
        pendingTx.credits !== plan.credits
        || pendingTx.amount !== expectedAmount
        || pendingTx.currency.toUpperCase() !== "INR"
    ) {
        return { status: "invalid", reason: "Stored transaction values do not match the plan." };
    }

    if (input.amount !== undefined && input.amount !== pendingTx.amount) {
        return { status: "invalid", reason: "Captured amount does not match the order." };
    }
    if (input.currency && input.currency.toUpperCase() !== pendingTx.currency.toUpperCase()) {
        return { status: "invalid", reason: "Captured currency does not match the order." };
    }

    if (pendingTx.status === "success") {
        return { status: "already_processed", addedCredits: plan.credits };
    }
    if (pendingTx.status !== "pending") {
        return { status: "invalid", reason: "Transaction is not pending." };
    }

    const granted = await db.transaction(async (tx) => {
        const [txUpdate] = await tx.update(transactionsTable)
            .set({
                paymentId: input.paymentId,
                status: "success",
                updatedAt: new Date(),
            })
            .where(and(
                eq(transactionsTable.id, pendingTx.id),
                eq(transactionsTable.status, "pending"),
            ))
            .returning({ id: transactionsTable.id });

        if (!txUpdate) return false;

        const [updatedUser] = await tx.update(userTable)
            .set({
                credits: sql`${userTable.credits} + ${plan.credits}`,
                plan: planLabel(planId),
            })
            .where(eq(userTable.id, pendingTx.userId))
            .returning({ id: userTable.id });

        if (!updatedUser) {
            throw new Error("Payment owner no longer exists.");
        }
        return true;
    });

    return granted
        ? { status: "granted", addedCredits: plan.credits }
        : { status: "already_processed", addedCredits: plan.credits };
}
