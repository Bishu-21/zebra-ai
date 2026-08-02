/**
 * Rate Limiting Utility
 * 
 * Simple in-memory sliding window rate limiter to protect expensive server endpoints.
 */

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

/** Clear all rate limit records (useful for test resets). */
export function clearRateLimits() {
    store.clear();
}
