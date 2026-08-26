import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { NextRequest } from "next/server";
import { encodeCursor, paginateRows, parsePagination } from "../src/lib/pagination";

describe("Collection pagination", () => {
    test("defaults to 25 and caps requested limits at 50", () => {
        assert.equal(parsePagination(new NextRequest("http://localhost/api/resumes")).limit, 25);
        assert.equal(parsePagination(new NextRequest("http://localhost/api/resumes?limit=500")).limit, 50);
        assert.equal(parsePagination(new NextRequest("http://localhost/api/resumes?limit=0")).limit, 1);
    });

    test("round-trips opaque timestamp/id cursors", () => {
        const timestamp = new Date("2026-08-26T10:00:00.000Z");
        const cursor = encodeCursor({ id: "resume_123", timestamp });
        const parsed = parsePagination(new NextRequest(`http://localhost/api/resumes?cursor=${cursor}`));
        assert.equal(parsed.cursor?.id, "resume_123");
        assert.equal(parsed.cursor?.timestamp.toISOString(), timestamp.toISOString());
    });

    test("returns one bounded page and a continuation cursor", () => {
        const rows = [1, 2, 3].map(index => ({ id: `r${index}`, updatedAt: new Date(2026, 0, index) }));
        const result = paginateRows(rows, 2, row => ({ id: row.id, timestamp: row.updatedAt }));
        assert.deepEqual(result.items.map(row => row.id), ["r1", "r2"]);
        assert.equal(result.page.hasMore, true);
        assert.ok(result.page.nextCursor);
    });
});
