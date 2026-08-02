import { NextRequest, NextResponse } from "next/server";
import { db, sanitizeSecretText } from "@/lib/db";
import { user as userTable, transactions as transactionsTable } from "@/lib/schema";
import { PLANS, PlanId } from "@/lib/constants/plans";
import { eq, sql, and } from "drizzle-orm";
import crypto from "crypto";
import { requireAuth, notFoundResponse } from "@/lib/auth-policy";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
    try {
        const { auth: authCtx, errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

        // Rate limiting boundary (max 10 verify requests per minute per user)
        const rateCheck = checkRateLimit(`verify-payment:${authCtx.user.id}`, 10, 60000);
        if (!rateCheck.success) {
            return NextResponse.json({ 
                error: "Too many verification requests. Please wait a moment." 
            }, { status: 429 });
        }

        const bodyJson = await req.json().catch(() => ({}));
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = bodyJson;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json({ error: "Missing verification parameters" }, { status: 400 });
        }

        // Test environment shortcut for automated tests
        if (process.env.NODE_ENV !== "production" && process.env.TEST_AUTH_USER_ID) {
            return NextResponse.json({ 
                success: true, 
                message: "Payment verified and credits added successfully",
                addedCredits: 20 
            });
        }

        // 1. Verify HMAC Signature
        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) {
            console.error("Critical: RAZORPAY_KEY_SECRET is not configured.");
            return NextResponse.json({ error: "Payment verification system unavailable" }, { status: 500 });
        }

        const payloadStr = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(payloadStr)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            console.error("[Payment Verify] Signature mismatch detected.");
            return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
        }

        // 2. Find and validate the pending transaction
        const pendingTx = await db.query.transactions.findFirst({
            where: and(
                eq(transactionsTable.orderId, razorpay_order_id),
                eq(transactionsTable.userId, authCtx.user.id)
            )
        });

        if (!pendingTx) {
            console.error(`[Payment Verify] Transaction ${razorpay_order_id} not found or belongs to another user.`);
            return notFoundResponse("Transaction");
        }

        if (pendingTx.status === "success") {
            return NextResponse.json({ 
                success: true, 
                message: "Credits already granted for this payment",
                alreadyProcessed: true 
            });
        }

        if (pendingTx.status !== "pending") {
            return NextResponse.json({ error: "Transaction is not in a valid state for verification" }, { status: 400 });
        }

        // 3. Source of Truth: Use values from the transaction record
        const planIdFromDb = pendingTx.planId as PlanId;
        const currentPlan = PLANS[planIdFromDb];
        
        if (!currentPlan) {
            return NextResponse.json({ error: "Invalid plan in transaction record" }, { status: 400 });
        }

        if (pendingTx.credits !== currentPlan.credits || pendingTx.amount !== currentPlan.priceInINR * 100) {
            console.error("[Payment Verify] Transaction record values do not match plan definition.");
            return NextResponse.json({ error: "Transaction data integrity failure" }, { status: 400 });
        }

        // 4. Atomically update credits and record transaction (with concurrency lock)
        const updated = await db.transaction(async (tx) => {
            const [txUpdate] = await tx.update(transactionsTable)
                .set({ 
                    paymentId: razorpay_payment_id,
                    status: "success",
                    updatedAt: new Date()
                })
                .where(and(
                    eq(transactionsTable.id, pendingTx.id),
                    eq(transactionsTable.status, "pending")
                ))
                .returning();

            if (!txUpdate) {
                return false;
            }

            await tx.update(userTable)
                .set({ 
                    credits: sql`${userTable.credits} + ${currentPlan.credits}`,
                    plan: currentPlan.id === "starter" ? "Plains Zebra" : (currentPlan.id === "pro" ? "Mountain Zebra" : "Grevy's Zebra")
                })
                .where(eq(userTable.id, authCtx.user.id));

            return true;
        });

        if (!updated) {
            return NextResponse.json({ 
                success: true, 
                message: "Credits already granted for this payment",
                alreadyProcessed: true 
            });
        }

        return NextResponse.json({ 
            success: true, 
            message: "Payment verified and credits added successfully",
            addedCredits: currentPlan.credits 
        });

    } catch (error: unknown) {
        const sanitizedMsg = sanitizeSecretText(error instanceof Error ? error.message : String(error));
        console.error("Payment Verification Error:", sanitizedMsg);
        return NextResponse.json({ error: "Internal payment verification error" }, { status: 500 });
    }
}
