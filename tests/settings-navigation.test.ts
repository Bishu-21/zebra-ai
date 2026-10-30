import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

const source = readFileSync("src/components/dashboard/SettingsView.tsx", "utf8");
const modal = readFileSync("src/components/dashboard/SettingsModal.tsx", "utf8");
const header = readFileSync("src/components/dashboard/Header.tsx", "utf8");
const context = readFileSync("src/context/SettingsContext.tsx", "utf8");
const shell = readFileSync("src/components/dashboard/DashboardShell.tsx", "utf8");

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

    test("does not claim preferences are saved before persistence succeeds", () => {
        assert.match(context, /updateSettingsAction: \(newSettings: Partial<Settings>\) => boolean/);
        assert.match(context, /writeSettingsRecord\(updated\)/);
        assert.match(context, /if \(!persisted\) return false/);
        assert.doesNotMatch(source, /Changes saved automatically|Preference changes are saved automatically/);
        assert.match(source, /Could not save preferences on this device/);
        assert.match(source, /triggerNotice\(updateSettingsAction\(patch\), success\)/);
        assert.match(source, /noticeIsError/);
    });

    test("gear panel is a dialog with focus trapping and a named close control", () => {
        assert.match(header, /aria-label="Open preferences"/);
        assert.match(header, /onOpenSettingsAction/);
        assert.match(shell, /SettingsModal/);
        assert.match(modal, /useDialogFocus/);
        assert.match(modal, /role="dialog"/);
        assert.match(modal, /aria-modal="true"/);
        assert.match(modal, /aria-label="Close settings"/);
        assert.match(modal, /role="switch"/);
        assert.match(modal, /featureChrome\.dialog/);
        assert.match(modal, /Open full settings/);
        assert.doesNotMatch(modal, /Changes saved automatically/);
        assert.doesNotMatch(modal, /h-\[80vh\]|max-h-\[580px\]/);
    });

    test("settings capture route is production-hidden", () => {
        const page = readFileSync("src/app/dev/settings-check/page.tsx", "utf8");
        assert.match(page, /NODE_ENV === "production"/);
        assert.match(page, /notFound\(\)/);
    });
});
