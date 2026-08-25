import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

const loaderSource = readFileSync("src/components/ui/ZebraLoader.tsx", "utf8");
const routeLoadingSource = readFileSync("src/app/dashboard/loading.tsx", "utf8");
const routeLoaderSource = readFileSync("src/components/ui/ZebraRouteLoader.tsx", "utf8");
const appLoadingSource = readFileSync("src/app/loading.tsx", "utf8");
const workSource = readFileSync("src/app/dashboard/work/page.tsx", "utf8");
const settingsSource = readFileSync("src/app/dashboard/settings/page.tsx", "utf8");
const globalStyles = readFileSync("src/app/globals.css", "utf8");

describe("Zebra loading experience", () => {
    test("uses the existing Zebra mark in the dashboard route boundary", () => {
        assert.match(loaderSource, /src="\/zebra_star\.svg"/);
        assert.match(routeLoadingSource, /<ZebraRouteLoader \/>/);
        assert.match(appLoadingSource, /<ZebraLoader/);
    });

    test("replaces prominent plain-text workspace fallbacks", () => {
        assert.match(workSource, /label="Loading your work"/);
        assert.match(settingsSource, /label="Loading settings"/);
        assert.doesNotMatch(workSource, />\s*Loading your work\.\.\.\s*</);
        assert.doesNotMatch(settingsSource, />\s*Loading settings\.\.\.\s*</);
    });

    test("announces loading state without exposing decorative motion", () => {
        assert.match(loaderSource, /role="status"/);
        assert.match(loaderSource, /aria-live="polite"/);
        assert.match(loaderSource, /aria-hidden="true"/);
    });

    test("provides treading motion and a reduced-motion fallback", () => {
        assert.match(globalStyles, /@keyframes zebra-tread-mark/);
        assert.match(globalStyles, /@keyframes zebra-tread-contact/);
        assert.match(globalStyles, /@keyframes zebra-ground-stripe/);
        assert.match(globalStyles, /prefers-reduced-motion: reduce/);
        assert.match(globalStyles, /\.zebra-loader__mark, \.zebra-loader__contact/);
    });

    test("does not flash on fast routes or impose a minimum loading time", () => {
        assert.match(globalStyles, /animation: zebra-loader-reveal 160ms ease-out 140ms both/);
        assert.doesNotMatch(loaderSource, /setTimeout|minimum|minDuration/);
    });

    test("describes the destination page while routing", () => {
        assert.match(routeLoaderSource, /usePathname/);
        assert.match(routeLoaderSource, /Opening applications/);
        assert.match(routeLoaderSource, /Opening resumes/);
        assert.match(routeLoaderSource, /Opening application/);
    });
});
