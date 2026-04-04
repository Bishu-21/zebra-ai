import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/schema";
import { PLANS, PlanId } from "@/lib/constants/plans";
import { eq, sql } from "drizzle-orm";
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

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = await req.json();

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planId) {
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

        // 2. Map plan and find credits to add
        const currentPlan = PLANS[planId as PlanId];
        if (!currentPlan) {
            return NextResponse.json({ error: "Invalid plan provided" }, { status: 400 });
        }

        // 3. Atomically update credits in the user table
        await db.transaction(async (tx) => {
            const userId = session.user.id;
            
            await tx.update(userTable)
                .set({ 
                    credits: sql`${userTable.credits} + ${currentPlan.credits}`,
                    // Optionally update plan tier if it's the professional/elite plan
                    plan: currentPlan.id === "starter" ? "Starter" : (currentPlan.id === "pro" ? "Professional" : "Elite")
                })
                .where(eq(userTable.id, userId));
                
            // Note: In a production app, we would log the payment details 
            // in a separate `transactions` table here for audit trails.
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
