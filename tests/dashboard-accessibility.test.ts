import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

describe("Dashboard overlay accessibility", () => {
    test("profile dialog focus target is the content panel", () => {
        const source = readFileSync("src/components/dashboard/ProfileModal.tsx", "utf8");
        assert.match(source, /<m\.div\s+ref=\{dialogRef\}[^>]*className="absolute top-0 right-0/);
    });

    test("sidebar profile opens with a native button separate from sign-out", () => {
        const source = readFileSync("src/components/dashboard/Sidebar.tsx", "utf8");
        assert.match(source, /<button\b[^>]*onClick=\{onOpenProfileAction\}[^>]*>/);
        const profileButton = source.slice(source.indexOf("onClick={onOpenProfileAction}"), source.indexOf("</button>", source.indexOf("onClick={onOpenProfileAction}")));
        assert.doesNotMatch(profileButton, /handleSignOut/);
    });

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
        const settingsModal = readFileSync("src/components/dashboard/SettingsModal.tsx", "utf8");
        assert.match(settingsModal, /role="dialog"/);
        assert.match(settingsModal, /aria-modal="true"/);
        assert.match(settingsModal, /useDialogFocus/);
    });
});
