import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Robust session retrieval helper with automatic single retry for idle serverless connection resets.
 */
export async function getSafeSession() {
    try {
        const reqHeaders = await headers();
        return await auth.api.getSession({
            headers: reqHeaders,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        if (
            message.includes("Connection terminated") || 
            message.includes("terminated unexpectedly") ||
            message.includes("FAILED_TO_GET_SESSION")
        ) {
            console.warn("Neon database connection was reset. Retrying session check once...");
            try {
                const reqHeaders = await headers();
                return await auth.api.getSession({
                    headers: reqHeaders,
                });
            } catch (retryErr) {
                console.error("Session retry after connection reset failed:", retryErr);
                return null;
            }
        }
        throw err;
    }
}
