import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

const handler = toNextJsHandler(auth);

export async function GET(req: NextRequest) {
    try {
        return await handler.GET(req);
    } catch (e) {
        console.error("Auth GET Error:", e);
        return NextResponse.json({ error: "Auth failed" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        return await handler.POST(req);
    } catch (e) {
        console.error("Auth POST Error:", e);
        return NextResponse.json({ error: "Auth failed" }, { status: 500 });
    }
}
