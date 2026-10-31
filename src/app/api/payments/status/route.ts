import { NextResponse } from "next/server";
import { isCheckoutConfigured } from "@/lib/payment-policy";

export async function GET() {
    return NextResponse.json({ checkoutAvailable: isCheckoutConfigured() });
}
