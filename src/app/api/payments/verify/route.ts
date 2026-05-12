import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable, transactions as transactionsTable } from "@/lib/schema";
import { PLANS, PlanId } from "@/lib/constants/plans";
import { eq, sql, and } from "drizzle-orm";
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

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json({ error: "Missing verification parameters" }, { status: 400 });
        }

        // 1. Verify HMAC Signature
        // Reference: https://razorpay.com/docs/payments/server-integration/nodejs/payment-gateway/generate-signature/
        const secret = process.env.RAZORPAY_KEY_SECRET!;
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        if (!isAuthentic) {
            console.error("Signature mismatch. Potentially fraudulent attempt detected.");
            return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
        }

        // 2. Find and validate the pending transaction
        const pendingTx = await db.query.transactions.findFirst({
            where: and(
                eq(transactionsTable.orderId, razorpay_order_id),
                eq(transactionsTable.userId, session.user.id)
            )
        });

        if (!pendingTx) {
            console.error(`Suspicious activity: Transaction ${razorpay_order_id} not found or belongs to another user.`);
            return NextResponse.json({ error: "Transaction not found or unauthorized" }, { status: 404 });
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
        // This prevents users from paying for a 'starter' plan but sending 'elite' in the request body
        const planIdFromDb = pendingTx.planId as PlanId;
        const currentPlan = PLANS[planIdFromDb];
        
        if (!currentPlan) {
            return NextResponse.json({ error: "Invalid plan in transaction record" }, { status: 400 });
        }

        // Additional sanity check: ensure the credits and amount in DB match the plan definition
        if (pendingTx.credits !== currentPlan.credits || pendingTx.amount !== currentPlan.priceInINR * 100) {
            console.error("Critical: Transaction record values do not match plan definition.");
            return NextResponse.json({ error: "Transaction data integrity failure" }, { status: 400 });
        }

        // 4. Atomically update credits and record transaction
        await db.transaction(async (tx) => {
            const userId = session.user.id;
            
            // Update user credits and plan
            await tx.update(userTable)
                .set({ 
                    credits: sql`${userTable.credits} + ${currentPlan.credits}`,
                    plan: currentPlan.id === "starter" ? "Starter" : (currentPlan.id === "pro" ? "Professional" : "Elite")
                })
                .where(eq(userTable.id, userId));
                
            // Update existing pending transaction
            await tx.update(transactionsTable)
                .set({ 
                    paymentId: razorpay_payment_id,
                    status: "success",
                    updatedAt: new Date()
                })
                .where(eq(transactionsTable.id, pendingTx.id));
        });

        return NextResponse.json({ 
            success: true, 
            message: "Payment verified and credits added successfully",
            addedCredits: currentPlan.credits 
        });

    } catch (error: any) {
        console.error("Payment Verification Error:", error);
        return NextResponse.json({ error: "Internal verification error" }, { status: 500 });
    }
}
