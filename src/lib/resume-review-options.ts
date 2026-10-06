import { readApiResponse } from "./api-response";

export interface ResumeReviewOption {
    id: string;
    title: string;
}

export async function loadResumeReviewOptions(
    fetcher: (url: string, init?: RequestInit) => Promise<Response> = fetch,
    signal?: AbortSignal,
): Promise<ResumeReviewOption[]> {
    const options = new Map<string, ResumeReviewOption>();
    const seenCursors = new Set<string>();
    let cursor: string | null = null;
    do {
        const query = new URLSearchParams({ limit: "50" });
        if (cursor) query.set("cursor", cursor);
        const response = await fetcher(`/api/resumes?${query}`, { signal, cache: "no-store" });
        const data = await readApiResponse<{
            resumes: ResumeReviewOption[];
            page: { hasMore: boolean; nextCursor: string | null };
        }>(response, "Could not load your saved resumes");
        for (const { id, title } of data.resumes) options.set(id, { id, title });
        if (!data.page.hasMore) break;
        cursor = data.page.nextCursor;
        if (!cursor || seenCursors.has(cursor)) throw new Error("Saved resume pagination did not advance. Please try again.");
        seenCursors.add(cursor);
    } while (cursor);
    return [...options.values()];
}
