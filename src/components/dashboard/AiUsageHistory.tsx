"use client";

import { useEffect, useState } from "react";
import type { AiUsageHistoryEntry } from "@/lib/ai-usage-history";

interface UsageResponse {
    usage: AiUsageHistoryEntry[];
    page: { hasMore: boolean; nextCursor: string | null };
}

export function AiUsageHistory() {
    const [entries, setEntries] = useState<AiUsageHistoryEntry[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const requestUsage = async (cursor?: string): Promise<UsageResponse> => {
        const query = new URLSearchParams({ limit: "10" });
        if (cursor) query.set("cursor", cursor);
        const response = await fetch(`/api/ai/usage?${query.toString()}`);
        if (!response.ok) throw new Error("Could not load AI usage history.");
        return response.json() as Promise<UsageResponse>;
    };

    const loadUsage = async (cursor?: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await requestUsage(cursor);
            setEntries((current) => cursor ? [...current, ...data.usage] : data.usage);
            setNextCursor(data.page.nextCursor);
            setHasMore(data.page.hasMore);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Could not load AI usage history.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let active = true;
        requestUsage()
            .then((data) => {
                if (!active) return;
                setEntries(data.usage);
                setNextCursor(data.page.nextCursor);
                setHasMore(data.page.hasMore);
            })
            .catch((loadError: unknown) => {
                if (active) setError(loadError instanceof Error ? loadError.message : "Could not load AI usage history.");
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, []);

    return (
        <section className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white" aria-labelledby="ai-usage-heading">
            <div className="border-b border-neutral-200/70 px-4 py-3.5">
                <h3 id="ai-usage-heading" className="text-xs font-bold text-[#0A0A0A]">AI usage history</h3>
                <p className="mt-0.5 text-xs text-neutral-500">Your recent AI operations and credit usage.</p>
            </div>

            {error && (
                <div className="p-4 text-xs text-red-600" role="alert">
                    {error} <button type="button" className="font-bold underline" onClick={() => void loadUsage()}>Try again</button>
                </div>
            )}

            {!error && entries.length === 0 && !loading && (
                <p className="p-4 text-xs text-neutral-500">No AI usage has been recorded yet.</p>
            )}

            {entries.length > 0 && (
                <div className="divide-y divide-neutral-200/70">
                    {entries.map((entry) => (
                        <div key={entry.id} className="grid grid-cols-[1fr_auto] gap-3 px-4 py-3 text-xs sm:grid-cols-[1fr_1fr_auto_auto] sm:items-center">
                            <div>
                                <p className="font-semibold text-[#0A0A0A]">{entry.operation}</p>
                                <p className="mt-0.5 text-neutral-400 sm:hidden">{entry.provider}</p>
                            </div>
                            <span className="hidden text-neutral-500 sm:block">{entry.provider}</span>
                            <div className="text-right sm:text-left">
                                <p className="font-semibold text-[#0A0A0A]">{entry.credits} {entry.credits === 1 ? "credit" : "credits"}</p>
                                <p className="mt-0.5 capitalize text-neutral-400">{entry.status}</p>
                            </div>
                            <time className="col-span-2 text-neutral-400 sm:col-span-1" dateTime={entry.createdAt}>
                                {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(entry.createdAt))}
                            </time>
                        </div>
                    ))}
                </div>
            )}

            {loading && <p className="p-4 text-xs text-neutral-500" role="status">Loading usage history...</p>}
            {!loading && !error && hasMore && nextCursor && (
                <div className="border-t border-neutral-200/70 p-3 text-center">
                    <button type="button" className="rounded-full border border-neutral-200 px-4 py-2 text-xs font-bold hover:bg-neutral-50" onClick={() => void loadUsage(nextCursor)}>
                        Load more
                    </button>
                </div>
            )}
        </section>
    );
}
