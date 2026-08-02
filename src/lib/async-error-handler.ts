/**
 * Utility helper for standardizing transient API, network, validation, and AI errors.
 */

export function getErrorMessage(err: unknown, fallbackMessage = "An unexpected error occurred"): string {
    if (!err) return fallbackMessage;
    if (typeof err === "string" && err.trim().length > 0) return err.trim();
    if (err instanceof Error) {
        if (err.name === "TypeError" || err.message.includes("Failed to fetch") || err.message.includes("NetworkError") || err.message.includes("network")) {
            return "Network connection error. Please check your connection and retry.";
        }
        return err.message || fallbackMessage;
    }
    return fallbackMessage;
}

export function isRetryableError(err: unknown): boolean {
    const msg = getErrorMessage(err).toLowerCase();
    return (
        msg.includes("network") ||
        msg.includes("connection") ||
        msg.includes("timeout") ||
        msg.includes("failed to fetch") ||
        msg.includes("temporary") ||
        msg.includes("high traffic") ||
        msg.includes("try again")
    );
}
