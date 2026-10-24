import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

const providersSource = readFileSync("src/components/Providers.tsx", "utf8");
const settingsSource = readFileSync("src/components/dashboard/SettingsView.tsx", "utf8");
const liveSource = readFileSync("src/hooks/useZebuLive.ts", "utf8");
const stylesheetGuardSource = readFileSync("src/lib/stylesheet-rejection.ts", "utf8");
const clientInstrumentationSource = readFileSync("src/instrumentation-client.ts", "utf8");

describe("Unhandled rejection regressions", () => {
    test("motion features do not depend on a navigation-time dynamic import", () => {
        assert.match(providersSource, /import \{ domAnimation, LazyMotion \} from "framer-motion"/);
        assert.match(providersSource, /features=\{domAnimation\}/);
        assert.doesNotMatch(providersSource, /import\("@\/lib\/motion-features"\)/);
    });

    test("does not globally suppress reasonless promise failures", () => {
        assert.doesNotMatch(providersSource, /unhandledrejection|event\.preventDefault/);
    });

    test("background settings and live-tool promises terminate with rejection handlers", () => {
        assert.match(settingsSource, /\.catch\(\(\) => \{ if \(active\) setProfile\(null\); \}\)/);
        assert.match(liveSource, /executeToolCalls\(message, liveSession\)\.catch/);
    });

    test("stylesheet load events are handled on the link promise", () => {
        assert.match(clientInstrumentationSource, /installStylesheetRejectionGuard\(\)/);
        assert.match(stylesheetGuardSource, /pending\.catch/);
        assert.match(stylesheetGuardSource, /Stylesheet failed to load/);
        assert.match(stylesheetGuardSource, /if \(!link\.isConnected\) return/);
        assert.doesNotMatch(stylesheetGuardSource, /unhandledrejection|preventDefault/);
    });
});
