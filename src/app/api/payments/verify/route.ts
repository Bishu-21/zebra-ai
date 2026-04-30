import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable, transactions as transactionsTable } from "@/lib/schema";
import { PLANS, PlanId } from "@/lib/constants/plans";
import { eq, and, sql } from "drizzle-orm";
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
        const secret = process.env.RAZORPAY_KEY_SECRET!;
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            console.error("Signature mismatch detected.");
            return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
        }

        // 2. Lookup the transaction in our database
        // We look up by orderId AND userId for extra security
        const [transaction] = await db
            .select()
            .from(transactionsTable)
            .where(
                and(
                    eq(transactionsTable.orderId, razorpay_order_id),
                    eq(transactionsTable.userId, session.user.id)
                )
            );

        if (!transaction) {
            return NextResponse.json({ error: "Transaction record not found" }, { status: 404 });
        }

        // 3. Idempotency Check: Ensure we don't process the same payment twice
        if (transaction.status === "completed") {
            return NextResponse.json({ 
                success: true, 
                message: "Credits already allocated for this payment" 
            });
        }

        if (transaction.status !== "pending") {
            return NextResponse.json({ error: "Invalid transaction status" }, { status: 400 });
        }

        // 4. Resolve Plan Details (Strictly from Server-Side Data)
        const plan = PLANS[transaction.planId as PlanId];
        if (!plan) {
            return NextResponse.json({ error: "Unknown plan configuration" }, { status: 400 });
        }

        // 5. Atomic Update: Credits + Transaction Status
        await db.transaction(async (tx) => {
            // Update User Credits
            await tx.update(userTable)
                .set({ 
                    credits: sql`${userTable.credits} + ${plan.credits}`,
                    plan: plan.id === "starter" ? "Starter" : (plan.id === "pro" ? "Professional" : "Elite")
                })
                .where(eq(userTable.id, session.user.id));
                
            // Update Transaction Status
            await tx.update(transactionsTable)
                .set({ 
                    status: "completed",
                    paymentId: razorpay_payment_id,
                    updatedAt: new Date()
                })
                .where(eq(transactionsTable.id, transaction.id));
        });

        return NextResponse.json({ 
            success: true, 
            message: "Payment verified and credits added successfully",
            addedCredits: plan.credits 
        });

    } catch (error: unknown) {
        console.error("Payment Verification Error:", error);
        return NextResponse.json({ error: "Internal verification error" }, { status: 500 });
    }
}
