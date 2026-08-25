import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

describe("Dashboard overlay accessibility", () => {
    test("profile control is a named keyboard-native button", () => {
        const source = readFileSync("src/components/dashboard/Header.tsx", "utf8");
        assert.match(source, /<button[\s\S]*?aria-label=\{`Open profile/);
    });

    test("drawers are modal dialogs with focus containment and restoration", () => {
        const hook = readFileSync("src/hooks/useDialogFocus.ts", "utf8");
        const drawer = readFileSync("src/components/dashboard/AddApplicationDrawer.tsx", "utf8");
        const profile = readFileSync("src/components/dashboard/ProfileModal.tsx", "utf8");
        assert.match(hook, /event\.key !== "Tab"/);
        assert.match(hook, /event\.key === "Escape"/);
        assert.match(hook, /previouslyFocused\?\.focus/);
        assert.match(drawer, /role="dialog" aria-modal="true"/);
        assert.match(profile, /role="dialog"/);
        assert.match(profile, /aria-modal="true"/);
    });
});
