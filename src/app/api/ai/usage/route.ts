import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, lt, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { aiUsage } from "@/lib/schema";
import { requireAuth } from "@/lib/auth-policy";
import { handleApiError } from "@/lib/api-error";
import { paginateRows, parsePagination } from "@/lib/pagination";
import { presentAiUsageEntry } from "@/lib/ai-usage-history";

export async function GET(req: NextRequest) {
    try {
        const { auth, errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

        const { limit, cursor } = parsePagination(req);
        const cursorCondition = cursor ? or(
            lt(aiUsage.createdAt, cursor.timestamp),
            and(eq(aiUsage.createdAt, cursor.timestamp), lt(aiUsage.id, cursor.id)),
        ) : undefined;

        const rows = await db.select({
            id: aiUsage.id,
            operationName: aiUsage.operationName,
            provider: aiUsage.provider,
            creditsCost: aiUsage.creditsCost,
            status: aiUsage.status,
            createdAt: aiUsage.createdAt,
        })
            .from(aiUsage)
            .where(and(eq(aiUsage.userId, auth.user.id), cursorCondition))
            .orderBy(desc(aiUsage.createdAt), desc(aiUsage.id))
            .limit(limit + 1);

        const page = paginateRows(rows, limit, (item) => ({ id: item.id, timestamp: item.createdAt }));
        return NextResponse.json({
            usage: page.items.map(presentAiUsageEntry),
            page: page.page,
        });
    } catch (error: unknown) {
        return handleApiError(error, "GET /api/ai/usage");
    }
}
