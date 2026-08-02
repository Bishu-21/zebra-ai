import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { portfolios as portfoliosTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, validateSelectedWorkIds, notFoundResponse } from "@/lib/auth-policy";

const portfolioSchema = z.object({
    slug: z.string().min(3, "Slug must be at least 3 characters").max(50).regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
    title: z.string().min(1, "Title is required"),
    bio: z.string().optional(),
    selectedWorkIds: z.array(z.string()).optional(),
    isPublished: z.boolean().default(false),
    theme: z.string().default("default"),
});

export async function GET() {
    try {
        const { auth: authCtx, errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

        const portfolio = await db.query.portfolios.findFirst({
            where: eq(portfoliosTable.userId, authCtx.user.id),
        });

        return NextResponse.json({ portfolio: portfolio || null });
    } catch (error: unknown) {
        console.error("GET /api/portfolio Error:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch portfolio" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { auth: authCtx, errorResponse } = await requireAuth();
        if (errorResponse) return errorResponse;

        const body = await req.json();
        const parsed = portfolioSchema.parse(body);
        const now = new Date();

        if (parsed.selectedWorkIds && parsed.selectedWorkIds.length > 0) {
            const valid = await validateSelectedWorkIds(authCtx.user.id, parsed.selectedWorkIds);
            if (!valid) {
                return notFoundResponse("One or more selected work items");
            }
        }

        const existing = await db.query.portfolios.findFirst({
            where: eq(portfoliosTable.userId, authCtx.user.id),
        });

        if (existing) {
            const [updated] = await db.update(portfoliosTable)
                .set({
                    slug: parsed.slug,
                    title: parsed.title,
                    bio: parsed.bio || null,
                    selectedWorkIds: parsed.selectedWorkIds || [],
                    isPublished: parsed.isPublished,
                    theme: parsed.theme,
                    updatedAt: now,
                })
                .where(eq(portfoliosTable.id, existing.id))
                .returning();
            return NextResponse.json({ portfolio: updated });
        } else {
            const id = `port_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            const [created] = await db.insert(portfoliosTable).values({
                id,
                userId: authCtx.user.id,
                slug: parsed.slug,
                title: parsed.title,
                bio: parsed.bio || null,
                selectedWorkIds: parsed.selectedWorkIds || [],
                isPublished: parsed.isPublished,
                theme: parsed.theme,
                createdAt: now,
                updatedAt: now,
            }).returning();
            return NextResponse.json({ portfolio: created });
        }
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues?.[0]?.message || "Validation failed" }, { status: 400 });
        }
        console.error("POST /api/portfolio Error:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to save portfolio" }, { status: 500 });
    }
}

