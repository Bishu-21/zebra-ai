/**
 * Rate Limiting Utility
 *
 * Local/test requests use an in-memory sliding window. Production endpoint
 * enforcement uses an atomic Postgres fixed-window bucket so limits are shared
 * across every server instance.
 */

import crypto from "crypto";
import { sql } from "drizzle-orm";
import { db, executeWithDbRetry } from "@/lib/db";
import { rateLimitBuckets } from "@/lib/schema";

interface RateLimitRecord {
    timestamps: number[];
}

const store = new Map<string, RateLimitRecord>();

/**
 * Check and record a rate-limit attempt for a given key.
 * 
 * @param key Unique identifier (e.g. `user_id:endpoint`)
 * @param limit Max allowed requests within window
 * @param windowMs Time window in milliseconds (default 60000ms = 1 min)
 */
export function checkRateLimit(
    key: string,
    limit: number = 20,
    windowMs: number = 60000
): { success: boolean; limit: number; remaining: number; resetMs: number } {
    const now = Date.now();
    const windowStart = now - windowMs;

    let record = store.get(key);
    if (!record) {
        record = { timestamps: [] };
        store.set(key, record);
    }

    // Filter out timestamps outside the sliding window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= limit) {
        const oldest = record.timestamps[0];
        const resetMs = oldest ? oldest + windowMs - now : windowMs;
        return {
            success: false,
            limit,
            remaining: 0,
            resetMs: Math.max(resetMs, 1000),
        };
    }

    record.timestamps.push(now);

    return {
        success: true,
        limit,
        remaining: limit - record.timestamps.length,
        resetMs: windowMs,
    };
}

/**
 * Enforce a rate limit across all production instances.
 *
 * The stored key is a SHA-256 digest, so user IDs and endpoint identifiers are
 * not retained in the rate-limit table. Rejected attempts increment the current
 * bucket but can never extend it beyond the original fixed-window expiry.
 */
export async function checkDistributedRateLimit(
    key: string,
    limit: number = 20,
    windowMs: number = 60000
): Promise<{ success: boolean; limit: number; remaining: number; resetMs: number }> {
    if (process.env.NODE_ENV !== "production") {
        return checkRateLimit(key, limit, windowMs);
    }

    const nowMs = Date.now();
    const windowStartedAtMs = Math.floor(nowMs / windowMs) * windowMs;
    const expiresAtMs = windowStartedAtMs + windowMs;
    const keyDigest = crypto.createHash("sha256").update(key).digest("hex");
    const now = new Date(nowMs);
    const windowStartedAt = new Date(windowStartedAtMs);
    const expiresAt = new Date(expiresAtMs);

    const [bucket] = await executeWithDbRetry(() =>
        db.insert(rateLimitBuckets)
            .values({
                key: keyDigest,
                count: 1,
                windowStartedAt,
                expiresAt,
            })
            .onConflictDoUpdate({
                target: rateLimitBuckets.key,
                set: {
                    count: sql`CASE WHEN ${rateLimitBuckets.expiresAt} <= ${now} THEN 1 ELSE ${rateLimitBuckets.count} + 1 END`,
                    windowStartedAt: sql`CASE WHEN ${rateLimitBuckets.expiresAt} <= ${now} THEN ${windowStartedAt} ELSE ${rateLimitBuckets.windowStartedAt} END`,
                    expiresAt: sql`CASE WHEN ${rateLimitBuckets.expiresAt} <= ${now} THEN ${expiresAt} ELSE ${rateLimitBuckets.expiresAt} END`,
                },
            })
            .returning({ count: rateLimitBuckets.count, expiresAt: rateLimitBuckets.expiresAt })
    );

    const count = bucket?.count ?? limit + 1;
    const resetAtMs = bucket?.expiresAt?.getTime() ?? expiresAtMs;
    return {
        success: count <= limit,
        limit,
        remaining: Math.max(0, limit - count),
        resetMs: Math.max(1000, resetAtMs - nowMs),
    };
}

/** Clear all rate limit records (useful for test resets). */
export function clearRateLimits() {
    store.clear();
}
