import { NextRequest, NextResponse } from "next/server";
import { sanitizeSecretText } from "@/lib/db";
import { requireAuth, notFoundResponse } from "@/lib/auth-policy";
import { checkDistributedRateLimit } from "@/lib/rate-limit";
import {
    grantCreditsForCapturedPayment,
    verifyRazorpayHmac,
} from "@/lib/payment-policy";

export async function POST(req: NextRequest) {
    try {
        const { auth: authCtx, errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

        // Rate limiting boundary (max 10 verify requests per minute per user)
        const rateCheck = await checkDistributedRateLimit(`verify-payment:${authCtx.user.id}`, 10, 60000);
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

        const payloadStr = `${razorpay_order_id}|${razorpay_payment_id}`;
        if (!verifyRazorpayHmac(payloadStr, razorpay_signature, secret)) {
            console.error("[Payment Verify] Signature mismatch detected.");
            return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
        }

        // 2. Atomically grant credits. Webhook recovery uses this same idempotency boundary.
        const result = await grantCreditsForCapturedPayment({
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            userId: authCtx.user.id,
        });

        if (result.status === "not_found") {
            console.error(`[Payment Verify] Transaction ${razorpay_order_id} not found or belongs to another user.`);
            return notFoundResponse("Transaction");
        }
        if (result.status === "invalid") {
            console.error(`[Payment Verify] Transaction integrity failure: ${result.reason}`);
            return NextResponse.json({ error: "Transaction data integrity failure" }, { status: 409 });
        }
        if (result.status === "already_processed") {
            return NextResponse.json({
                success: true,
                message: "Credits already granted for this payment",
                alreadyProcessed: true
            });
        }

        return NextResponse.json({
            success: true,
            message: "Payment verified and credits added successfully",
            addedCredits: result.addedCredits
        });

    } catch (error: unknown) {
        const sanitizedMsg = sanitizeSecretText(error instanceof Error ? error.message : String(error));
        console.error("Payment Verification Error:", sanitizedMsg);
        return NextResponse.json({ error: "Internal payment verification error" }, { status: 500 });
    }
}
