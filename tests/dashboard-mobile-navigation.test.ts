import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

const shellSource = readFileSync("src/components/dashboard/DashboardShell.tsx", "utf8");
const headerSource = readFileSync("src/components/dashboard/Header.tsx", "utf8");
const sidebarSource = readFileSync("src/components/dashboard/Sidebar.tsx", "utf8");
const layoutSource = readFileSync("src/app/dashboard/layout.tsx", "utf8");

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

    test("async session work is not the dashboard layout default export", () => {
        assert.match(layoutSource, /export default function DashboardLayout/);
        assert.doesNotMatch(layoutSource, /export default async function DashboardLayout/);
        assert.match(layoutSource, /async function DashboardAuthenticatedLayout/);
        assert.match(layoutSource, /const dashboardFrameClassName = "min-h-screen bg-background flex font-sans text-foreground overflow-hidden"/);
        assert.doesNotMatch(shellSource, /min-h-screen bg-background flex font-sans text-foreground overflow-hidden/);
        assert.match(shellSource, /ssr: false/);
        assert.doesNotMatch(layoutSource, /suppressHydrationWarning/);
        assert.doesNotMatch(shellSource, /suppressHydrationWarning/);
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

    test("tool cards stay a server component so dashboard pages can pass icon functions", () => {
        const toolCard = readFileSync("src/components/dashboard/DashboardToolCard.tsx", "utf8");
        assert.doesNotMatch(toolCard, /"use client"/);
        assert.doesNotMatch(toolCard, /useDemoWorkspace/);
    });

    test("sidebar header does not repeat the account plan", () => {
        const sidebarHeader = sidebarSource.slice(
            sidebarSource.indexOf("Header Logo"),
            sidebarSource.indexOf("Menu Navigation Links"),
        );

        assert.doesNotMatch(sidebarHeader, /\{plan\}/);
        assert.doesNotMatch(sidebarSource, /\{plan\} Plan/);
        assert.match(sidebarSource, /formatAccountPlanLabel\(livePlan\)/);
        assert.match(sidebarSource, /liveCredits\} \{liveCredits === 1 \? "credit" : "credits"/);
    });
});
