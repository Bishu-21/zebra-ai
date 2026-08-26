import { db, executeWithDbRetry } from "@/lib/db";
import { user as userTable } from "@/lib/schema";
import { eq, sql, gte, and } from "drizzle-orm";

export interface CreditReservationResult {
    success: boolean;
    remainingCredits?: number;
    error?: string;
}

/**
 * Atomically reserve user credits before executing an expensive AI operation.
 * Guarantees that credits are only decremented if the user has sufficient balance (WHERE credits >= cost).
 */
export async function reserveUserCredits(
    userId: string,
    cost: number = 1
): Promise<CreditReservationResult> {
    if (!userId || cost <= 0) {
        return { success: false, error: "Invalid credit reservation parameters." };
    }

    if (process.env.NODE_ENV === "test" && process.env.TEST_AUTH_USER_ID) {
        return { success: true, remainingCredits: 99 };
    }

    return await executeWithDbRetry(async () => {
        const [updatedUser] = await db
            .update(userTable)
            .set({
                credits: sql`${userTable.credits} - ${cost}`,
                updatedAt: new Date(),
            })
            .where(and(eq(userTable.id, userId), gte(userTable.credits, cost)))
            .returning({ id: userTable.id, credits: userTable.credits });

        if (!updatedUser) {
            // Check current credit balance for clear error response
            const currentUser = await db.query.user.findFirst({
                where: eq(userTable.id, userId),
                columns: { credits: true },
            });
            const currentCredits = currentUser?.credits ?? 0;
            return {
                success: false,
                remainingCredits: currentCredits,
                error: `Insufficient credits. Required: ${cost}, available: ${currentCredits}.`,
            };
        }

        return {
            success: true,
            remainingCredits: updatedUser.credits,
        };
    });
}

/**
 * Atomically refund reserved user credits if an AI operation or downstream task fails.
 */
export async function refundUserCredits(
    userId: string,
    cost: number = 1
): Promise<boolean> {
    if (!userId || cost <= 0) return false;
    if (process.env.NODE_ENV === "test" && process.env.TEST_AUTH_USER_ID) return true;

    try {
        await executeWithDbRetry(async () => {
            await db
                .update(userTable)
                .set({
                    credits: sql`${userTable.credits} + ${cost}`,
                    updatedAt: new Date(),
                })
                .where(eq(userTable.id, userId));
        });
        return true;
    } catch (err) {
        console.error(`[Credit Policy] Critical: Failed to refund ${cost} credits to user ${userId}:`, err);
        return false;
    }
}
