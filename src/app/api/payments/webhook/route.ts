import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sanitizeSecretText } from "@/lib/db";
import {
    grantCreditsForCapturedPayment,
    verifyRazorpayHmac,
} from "@/lib/payment-policy";

const MAX_WEBHOOK_BYTES = 1_000_000;

const capturedPaymentEventSchema = z.object({
    event: z.enum(["payment.captured", "order.paid"]),
    payload: z.object({
        payment: z.object({
            entity: z.object({
                id: z.string().min(1).max(100),
                order_id: z.string().min(1).max(100),
                amount: z.number().int().nonnegative(),
                currency: z.string().min(3).max(10),
                status: z.literal("captured"),
            }),
        }),
    }),
});

export async function POST(req: NextRequest) {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
    if (!webhookSecret) {
        console.error("[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET is not configured.");
        return NextResponse.json({ error: "Webhook unavailable" }, { status: 503 });
    }

    const declaredLength = Number(req.headers.get("content-length") || "0");
    if (Number.isFinite(declaredLength) && declaredLength > MAX_WEBHOOK_BYTES) {
        return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const rawBody = await req.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAX_WEBHOOK_BYTES) {
        return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const signature = req.headers.get("x-razorpay-signature")?.trim() || "";
    if (!verifyRazorpayHmac(rawBody, signature, webhookSecret)) {
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }

    let body: unknown;
    try {
        body = JSON.parse(rawBody);
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const eventName = typeof body === "object" && body !== null
        ? (body as { event?: unknown }).event
        : undefined;
    if (eventName !== "payment.captured" && eventName !== "order.paid") {
        return NextResponse.json({ received: true, ignored: true });
    }

    const parsed = capturedPaymentEventSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid captured-payment payload" }, { status: 400 });
    }

    const payment = parsed.data.payload.payment.entity;
    try {
        const result = await grantCreditsForCapturedPayment({
            orderId: payment.order_id,
            paymentId: payment.id,
            amount: payment.amount,
            currency: payment.currency,
        });

        if (result.status === "not_found") {
            // Non-2xx asks Razorpay to retry; the matching order may still be committing.
            return NextResponse.json({ error: "Order is not available yet" }, { status: 503 });
        }
        if (result.status === "invalid") {
            console.error(`[Razorpay Webhook] Transaction integrity failure: ${result.reason}`);
            return NextResponse.json({ error: "Transaction integrity failure" }, { status: 409 });
        }

        return NextResponse.json({
            received: true,
            credited: result.status === "granted",
            alreadyProcessed: result.status === "already_processed",
        });
    } catch (error: unknown) {
        console.error(
            "[Razorpay Webhook] Processing failed:",
            sanitizeSecretText(error instanceof Error ? error.message : String(error)),
        );
        return NextResponse.json({ error: "Webhook processing failed" }, { status: 503 });
    }
}
