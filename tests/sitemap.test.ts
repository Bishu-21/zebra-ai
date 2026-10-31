import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";
import sitemap from "../src/app/sitemap";

test("search sitemap includes public pages and excludes private or internal routes", () => {
    const entries = sitemap();
    assert.deepEqual(entries.map(entry => new URL(entry.url).pathname).sort(),
        ["/", "/cookies", "/privacy", "/refunds", "/sitemap", "/terms"]);
    assert.equal(new Set(entries.map(entry => entry.url)).size, entries.length);
    for (const entry of entries) {
        const url = new URL(entry.url);
        assert.equal(url.origin, "https://zebra-ai.app");
        assert.equal(url.hash, "");
        assert.equal(url.search, "");
        assert.ok(existsSync(`src/app${url.pathname === "/" ? "" : url.pathname}/page.tsx`));
        assert.equal(entry.lastModified, undefined, "do not invent modification dates on every build");
    }
});
