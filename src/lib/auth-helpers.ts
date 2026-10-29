import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { cache } from "react";
import { sanitizeSecretText } from "@/lib/db";
import { collectErrorText, isTransientDbError } from "@/lib/db-errors";

const SESSION_LOOKUP_TIMEOUT_MS = 15_000;

export class SessionUnavailableError extends Error {
    constructor() {
        super("The session store is temporarily unavailable.");
        this.name = "SessionUnavailableError";
    }
}

function isAuthenticationFailure(error: unknown): boolean {
    const text = collectErrorText(error);
    return [
        "unauthorized",
        "invalid token",
        "session expired",
        "invalid_credentials",
    ].some((marker) => text.includes(marker));
}

async function withSessionTimeout<T>(operation: Promise<T>): Promise<T> {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
        return await Promise.race([
            operation,
            new Promise<never>((_, reject) => {
                timeout = setTimeout(
                    () => reject(new Error("Session lookup timed out.")),
                    SESSION_LOOKUP_TIMEOUT_MS,
                );
            }),
        ]);
    } finally {
        if (timeout) clearTimeout(timeout);
    }
}

/**
 * Check if a session retrieval error is a transient database/network error that can be retried.
 * Explicitly returns false for 401 Unauthorized, invalid token, or credential failures.
 */
function isRetryableSessionError(error: unknown): boolean {
    if (!error) return false;

    if (isAuthenticationFailure(error)) return false;
    const text = collectErrorText(error);

    if (isTransientDbError(error)) return true;

    return [
        "failed_to_get_session",
        "failed to get session",
        "session lookup timed out",
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

    const maxRetries = 1;
    let attempt = 0;

    while (true) {
        try {
            const reqHeaders = await headers();
            return await withSessionTimeout(auth.api.getSession({ headers: reqHeaders }));
        } catch (err: unknown) {
            attempt++;
            const retryable = isRetryableSessionError(err);
            if (!retryable) {
                if (isAuthenticationFailure(err)) return null;
                const msg = sanitizeSecretText(err instanceof Error ? err.message : String(err));
                console.error(`[Auth Session Error] Session lookup failed: ${msg}`);
                throw new SessionUnavailableError();
            }

            // Promise.race cannot cancel Better Auth's database query. Starting a
            // second query after our own deadline would leave the first running
            // and can congest the small Neon pool during a cold start.
            if (collectErrorText(err).includes("session lookup timed out")) {
                console.error("[Auth Session Error] Session lookup exceeded the 15-second deadline.");
                throw new SessionUnavailableError();
            }

            if (attempt > maxRetries) {
                const msg = sanitizeSecretText(err instanceof Error ? err.message : String(err));
                console.error(`[Auth Session Error] Connection failure after ${maxRetries + 1} attempts: ${msg}`);
                throw new SessionUnavailableError();
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
