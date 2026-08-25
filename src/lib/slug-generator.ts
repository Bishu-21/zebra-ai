import { db } from "@/lib/db";
import { portfolios as portfoliosTable } from "@/lib/schema";
import { eq, and, ne } from "drizzle-orm";

/**
 * Normalizes a display name into a clean, lowercased URL slug.
 */
export function slugifyName(name: string): string {
    const clean = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
    return clean || "portfolio";
}

/**
 * Generates a collision-free unique portfolio slug for a given user.
 * Example: 'bishal-sarkar', 'bishal-sarkar-2', 'bishal-sarkar-3' or 'bishal-sarkar-a1b2'
 */
export async function getOrCreateUniquePortfolioSlug(userId: string, userName?: string | null): Promise<string> {
    // 1. Check if user already has a portfolio entry with a slug
    const existing = await db.query.portfolios.findFirst({
        where: eq(portfoliosTable.userId, userId),
    });

    if (existing?.slug) {
        return existing.slug;
    }

    const baseSlug = slugifyName(userName || "user");
    let candidateSlug = baseSlug;
    let counter = 1;

    // Check collision against portfolios table for other users
    while (counter <= 50) {
        const check = await db.query.portfolios.findFirst({
            where: and(
                eq(portfoliosTable.slug, candidateSlug),
                ne(portfoliosTable.userId, userId)
            ),
        });

        if (!check) {
            break; // Unique candidate found
        }

        counter++;
        candidateSlug = `${baseSlug}-${counter}`;
    }

    // Fallback if loop exhausted
    if (counter > 50) {
        const shortHash = userId.slice(0, 6);
        candidateSlug = `${baseSlug}-${shortHash}`;
    }

    // Upsert / save unique slug in portfolios table
    const now = new Date();
    if (existing) {
        await db.update(portfoliosTable)
            .set({ slug: candidateSlug, updatedAt: now })
            .where(eq(portfoliosTable.id, existing.id));
    } else {
        const id = `port_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await db.insert(portfoliosTable).values({
            id,
            userId,
            slug: candidateSlug,
            title: userName || "Portfolio",
            isPublished: false,
            theme: "default",
            createdAt: now,
            updatedAt: now,
        });
    }

    return candidateSlug;
}
