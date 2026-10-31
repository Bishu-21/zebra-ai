import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import { formatAccountPlanLabel } from "../src/lib/constants/plans";

const header = readFileSync("src/components/dashboard/Header.tsx", "utf8");
const sidebar = readFileSync("src/components/dashboard/Sidebar.tsx", "utf8");
const settings = readFileSync("src/components/dashboard/SettingsView.tsx", "utf8");
const shell = readFileSync("src/components/dashboard/DashboardShell.tsx", "utf8");
const creditsRoute = readFileSync("src/app/api/credits/route.ts", "utf8");
const context = readFileSync("src/context/CreditsContext.tsx", "utf8");

describe("Credit display", () => {
    test("pack names are not shown as a Plan suffix next to the live balance", () => {
        assert.equal(formatAccountPlanLabel("Free"), "Free plan");
        assert.equal(formatAccountPlanLabel("10 credits"), "Pay-as-you-go");
        assert.equal(formatAccountPlanLabel("starter"), "Pay-as-you-go");
        assert.equal(formatAccountPlanLabel("50 credits"), "Pay-as-you-go");
    });

    test("header shows the live credit count on every breakpoint", () => {
        assert.match(header, /useCredits\(credits\)/);
        assert.match(header, /liveCredits\} \{liveCredits === 1 \? "credit" : "credits"/);
        assert.doesNotMatch(header, /hidden md:flex min-h-11 items-center rounded-full/);
    });

    test("settings billing reads the live balance instead of a session Unknown fallback", () => {
        assert.match(settings, /creditBalance = demo \? 3 : liveCredits\.credits/);
        assert.doesNotMatch(settings, /session\?\.user\.credits/);
        assert.doesNotMatch(settings, /Unknown/);
        assert.match(shell, /CreditsProvider credits=\{credits\} plan=\{plan\}/);
        assert.match(creditsRoute, /columns: \{ credits: true, plan: true \}/);
        assert.match(context, /fetch\("\/api\/credits"/);
        assert.match(context, /credits-changed/);
        assert.match(sidebar, /formatAccountPlanLabel\(livePlan\)/);
    });
});
