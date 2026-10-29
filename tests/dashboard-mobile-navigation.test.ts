import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

const shellSource = readFileSync("src/components/dashboard/DashboardShell.tsx", "utf8");
const headerSource = readFileSync("src/components/dashboard/Header.tsx", "utf8");
const sidebarSource = readFileSync("src/components/dashboard/Sidebar.tsx", "utf8");

describe("Dashboard mobile navigation regressions", () => {
    test("closed mobile navigation is inert and open navigation contains focus", () => {
        assert.match(sidebarSource, /inert=\{isMobile && !isDrawerOpen \? true : undefined\}/);
        assert.match(sidebarSource, /useDialogFocus<HTMLElement>\(isMobile && isDrawerOpen, closeDrawer\)/);
        assert.match(sidebarSource, /ref=\{navigationRef\}/);
    });

    test("drawer callbacks remain stable when open state changes", () => {
        assert.match(shellSource, /const openNav = useCallback\(\(\) => setIsNavOpen\(true\), \[\]\)/);
        assert.match(shellSource, /const closeNav = useCallback\(\(\) => setIsNavOpen\(false\), \[\]\)/);
        assert.match(shellSource, /onCloseAction=\{closeNav\}/);
        assert.match(shellSource, /onOpenNavAction=\{openNav\}/);
        assert.doesNotMatch(shellSource, /onCloseAction=\{\(\) => setIsNavOpen\(false\)\}/);
    });

    test("menu trigger exposes the controlled drawer state", () => {
        assert.match(headerSource, /aria-controls="dashboard-navigation"/);
        assert.match(headerSource, /aria-expanded=\{isNavOpen\}/);
        assert.match(sidebarSource, /id="dashboard-navigation"/);
        assert.match(shellSource, /isNavOpen=\{isNavOpen\}/);
    });

    test("open drawer supports Escape and prevents background scrolling", () => {
        assert.match(shellSource, /event\.key === "Escape"/);
        assert.match(shellSource, /document\.body\.style\.overflow = "hidden"/);
    });

    test("sidebar shell is a native aside so SSR HTML matches the first client render", () => {
        assert.match(sidebarSource, /const \[isMobile, setIsMobile\] = useState\(false\)/);
        assert.match(sidebarSource, /<aside/);
        assert.match(sidebarSource, /hideOffCanvas \? "-translate-x-full" : "translate-x-0"/);
        assert.doesNotMatch(sidebarSource, /<m\.aside/);
        assert.doesNotMatch(sidebarSource, /from "framer-motion"/);
        assert.doesNotMatch(sidebarSource, /AnimatePresence/);
        assert.doesNotMatch(sidebarSource, /suppressHydrationWarning/);
    });

    test("sidebar header does not repeat the account plan", () => {
        const sidebarHeader = sidebarSource.slice(
            sidebarSource.indexOf("Header Logo"),
            sidebarSource.indexOf("Menu Navigation Links"),
        );

        assert.doesNotMatch(sidebarHeader, /\{plan\}/);
        assert.match(sidebarSource, /\{plan\} Plan/);
    });
});
