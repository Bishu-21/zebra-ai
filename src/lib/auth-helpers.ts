import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { cache } from "react";
import { sanitizeSecretText } from "@/lib/db";

/**
 * Check if a session retrieval error is a transient database/network error that can be retried.
 * Explicitly returns false for 401 Unauthorized, invalid token, or credential failures.
 */
function isRetryableSessionError(error: unknown): boolean {
    if (!error) return false;

    // Extract all error messages and causes
    const values: unknown[] = [];
    const seen = new Set<unknown>();
    let current: unknown = error;

    while (current && !seen.has(current)) {
        seen.add(current);
        values.push(current);

        if (typeof current === "object" && current !== null) {
            const record = current as Record<string, unknown>;
            if (record.status === 401 || record.statusCode === 401 || record.name === "APIError" && record.status === 401) {
                return false; // Authentication/Authorization failures must NEVER be retried
            }
            current = record.cause;
            if (record.body) values.push(record.body);
        } else {
            break;
        }
    }

    const text = values
        .map((value) => {
            if (typeof value === "string") return value;
            if (value instanceof Error) return value.message;
            try {
                return JSON.stringify(value);
            } catch {
                return String(value);
            }
        })
        .join(" ")
        .toLowerCase();

    // Check for explicit auth failure markers
    if (text.includes("unauthorized") || text.includes("invalid token") || text.includes("session expired") || text.includes("invalid_credentials")) {
        return false;
    }

    // Check for transient network/Neon DB connection markers
    return [
        "connection terminated",
        "connection timeout",
        "websocket was closed",
        "failed_to_get_session",
        "failed to get session",
        "econnreset",
        "etimedout",
        "503",
        "504"
    ].some((marker) => text.includes(marker));
}

/**
 * Internal session fetcher with bounded retry logic and log sanitization.
 */
async function fetchSessionWithRetry() {
    if (process.env.NODE_ENV !== "production" && process.env.TEST_AUTH_USER_ID) {
        if (process.env.TEST_AUTH_USER_ID === "UNAUTHENTICATED") {
            return null;
        }
        const userId = process.env.TEST_AUTH_USER_ID;
        return {
            user: {
                id: userId,
                name: "Integration Test User",
                email: `${userId}@example.com`,
                emailVerified: true,
                image: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            session: {
                id: `sess_${userId}`,
                userId: userId,
                expiresAt: new Date(Date.now() + 86400000),
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        };
    }

    const maxRetries = 2;
    let attempt = 0;

    while (true) {
        try {
            const reqHeaders = await headers();
            return await auth.api.getSession({
                headers: reqHeaders,
            });
        } catch (err: unknown) {
            attempt++;
            if (attempt > maxRetries || !isRetryableSessionError(err)) {
                if (isRetryableSessionError(err)) {
                    const msg = sanitizeSecretText(err instanceof Error ? err.message : String(err));
                    console.error(`[Auth Session Error] Transient connection failure after ${maxRetries} retries: ${msg}`);
                }
                return null;
            }

            const delay = 150 * Math.pow(2, attempt - 1);
            const msg = sanitizeSecretText(err instanceof Error ? err.message : String(err));
            console.warn(`[Auth Session Retry] Transient failure on attempt ${attempt}/${maxRetries}. Retrying in ${delay}ms. Error: ${msg}`);
            await new Promise((res) => setTimeout(res, delay));
        }
    }
}

/**
 * Retrieve the authenticated user session.
 * Wrapped in React.cache() to deduplicate lookups across layout and page within the same request.
 */
export const getSafeSession = cache(async () => {
    return await fetchSessionWithRetry();
});
