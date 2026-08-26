import { NextRequest } from "next/server";

export const DEFAULT_PAGE_LIMIT = 25;
export const MAX_PAGE_LIMIT = 50;

export interface PageCursor {
    timestamp: Date;
    id: string;
}

export function decodeCursor(rawCursor: string | null | undefined): PageCursor | null {
    if (!rawCursor) return null;
    try {
        const decoded = JSON.parse(Buffer.from(rawCursor, "base64url").toString("utf8")) as { t?: unknown; id?: unknown };
        const timestamp = new Date(String(decoded.t || ""));
        if (!Number.isFinite(timestamp.getTime()) || typeof decoded.id !== "string" || !decoded.id) return null;
        return { timestamp, id: decoded.id };
    } catch {
        return null;
    }
}

export function parsePagination(req: NextRequest | Request): { limit: number; cursor: PageCursor | null } {
    const searchParams = req instanceof NextRequest ? req.nextUrl.searchParams : new URL(req.url).searchParams;
    const rawLimit = Number.parseInt(searchParams.get("limit") || "", 10);
    const limit = Number.isFinite(rawLimit)
        ? Math.min(MAX_PAGE_LIMIT, Math.max(1, rawLimit))
        : DEFAULT_PAGE_LIMIT;
    return { limit, cursor: decodeCursor(searchParams.get("cursor")) };
}

export function encodeCursor(item: { id: string; timestamp: Date }): string {
    return Buffer.from(JSON.stringify({ t: item.timestamp.toISOString(), id: item.id }), "utf8").toString("base64url");
}

export function paginateRows<T>(rows: T[], limit: number, cursorOf: (item: T) => { id: string; timestamp: Date }) {
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const last = items.at(-1);
    return {
        items,
        page: {
            limit,
            hasMore,
            nextCursor: hasMore && last ? encodeCursor(cursorOf(last)) : null,
        },
    };
}
