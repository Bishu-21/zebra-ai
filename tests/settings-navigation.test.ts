import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

const source = readFileSync("src/components/dashboard/SettingsView.tsx", "utf8");

describe("Settings navigation", () => {
    test("uses a compact sticky section switcher on mobile and retains the desktop rail", () => {
        assert.match(source, /sticky top-0 z-20/);
        assert.match(source, /overflow-x-auto scroll-smooth/);
        assert.match(source, /md:static md:w-64/);
        assert.match(source, /md:block md:space-y-1\.5/);
    });

    test("switches sections without triggering a Next route navigation", () => {
        assert.match(source, /window\.history\.replaceState/);
        assert.doesNotMatch(source, /useRouter|router\.replace/);
        assert.match(source, /scrollIntoView/);
    });

    test("implements accessible tabs, keyboard movement, and status announcements", () => {
        assert.match(source, /role="tablist"/);
        assert.match(source, /role="tab"/);
        assert.match(source, /aria-selected=\{isActive\}/);
        assert.match(source, /role="tabpanel"/);
        assert.match(source, /event\.key === "ArrowRight"/);
        assert.match(source, /role="status"/);
        assert.match(source, /aria-live="polite"/);
    });

    test("settings toggles are single native controls", () => {
        assert.match(source, /role="switch"/);
        assert.match(source, /aria-checked=\{checked\}/);
    });
});
