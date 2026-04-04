import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { amount } = await req.json();

        if (!amount || typeof amount !== "number") {
            return NextResponse.json({ error: "Invalid credit amount" }, { status: 400 });
        }

        // Simulate successful payment and update database
        await db.transaction(async (tx) => {
            await tx.update(userTable)
                .set({ credits: sql`${userTable.credits} + ${amount}` })
                .where(eq(userTable.id, session.user.id));
        });

        return NextResponse.json({ success: true, newAmount: amount });
    } catch (error: any) {
        console.error("Credit Top-up Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
