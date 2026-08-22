import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { cache } from "react";
import { sanitizeSecretText } from "@/lib/db";

const SESSION_LOOKUP_TIMEOUT_MS = 8_000;

export class SessionUnavailableError extends Error {
    constructor() {
        super("The session store is temporarily unavailable.");
        this.name = "SessionUnavailableError";
    }
}

function collectErrorText(error: unknown): string {
    const values: unknown[] = [];
    const seen = new Set<unknown>();
    let current: unknown = error;

    while (current && !seen.has(current)) {
        seen.add(current);
        values.push(current);
        if (typeof current === "object" && current !== null) {
            const record = current as Record<string, unknown>;
            current = record.cause;
            if (record.body) values.push(record.body);
        } else {
            break;
        }
    }

    return values
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

    // Check for transient network/Neon DB connection markers
    return [
        "connection terminated",
        "connection timeout",
        "websocket was closed",
        "failed_to_get_session",
        "failed to get session",
        "session lookup timed out",
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
