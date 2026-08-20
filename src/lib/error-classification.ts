function getErrorDetails(error: unknown): { name: string; message: string } {
    if (error instanceof Error) {
        return { name: error.name.toLowerCase(), message: error.message.toLowerCase() };
    }

    if (typeof error === "object" && error !== null) {
        const record = error as Record<string, unknown>;
        return {
            name: typeof record.name === "string" ? record.name.toLowerCase() : "",
            message: typeof record.message === "string" ? record.message.toLowerCase() : String(error).toLowerCase(),
        };
    }

    return { name: "", message: String(error).toLowerCase() };
}

/** Errors caused by the requester disconnecting before a streamed response completes. */
export function isExpectedRequestAbort(error: unknown): boolean {
    const { name, message } = getErrorDetails(error);

    return name === "aborterror" || [
        "destination stream closed early",
        "request aborted",
        "response aborted",
        "operation was aborted",
    ].some((marker) => message.includes(marker));
}

/** Navigation failures that are normally resolved by refetching the current route. */
export function isTransientNavigationError(error: unknown): boolean {
    if (isExpectedRequestAbort(error)) return true;

    const { message } = getErrorDetails(error);
    return [
        "network error",
        "failed to fetch",
        "load failed",
        "chunkloaderror",
        "loading chunk",
        "dynamically imported module",
    ].some((marker) => message.includes(marker));
}
