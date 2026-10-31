import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-policy";
import { db, sanitizeSecretText } from "@/lib/db";
import { user as userTable } from "@/lib/schema";

export async function GET() {
    const { auth, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    try {
        const currentUser = await db.query.user.findFirst({
            where: eq(userTable.id, auth.user.id),
            columns: { credits: true, plan: true },
        });
        return NextResponse.json({
            credits: currentUser?.credits ?? 0,
            plan: currentUser?.plan ?? "Free",
        });
    } catch (error) {
        console.error("GET /api/credits:", sanitizeSecretText(error instanceof Error ? error.message : String(error)));
        return NextResponse.json({ error: "Could not load credit balance." }, { status: 503 });
    }
}
