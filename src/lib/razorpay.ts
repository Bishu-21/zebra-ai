import Razorpay from "razorpay";

export function getRazorpay(): Razorpay | null {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    if (!keyId || !keySecret) return null;

    return new Razorpay({ key_id: keyId, key_secret: keySecret });
}
