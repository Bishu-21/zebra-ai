import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { portfolios as portfoliosTable } from "@/lib/schema";
import { nextPortfolioWorkIds } from "@/lib/portfolio-public";

export async function syncPortfolioWorkVisibility(userId: string, workId: string, isPublic: boolean) {
    const portfolio = await db.query.portfolios.findFirst({
        where: eq(portfoliosTable.userId, userId),
    });
    if (!portfolio) return;
    const next = nextPortfolioWorkIds(portfolio.selectedWorkIds, workId, isPublic);
    if (!next) return;
    await db.update(portfoliosTable)
        .set({ selectedWorkIds: next, updatedAt: new Date() })
        .where(eq(portfoliosTable.id, portfolio.id));
}
