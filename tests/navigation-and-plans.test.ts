import { test, describe } from "node:test";
import assert from "node:assert";
import { DASHBOARD_NAV_ITEMS, getBreadcrumbForPath } from "../src/lib/constants/navigation";
import { PLANS, PlanId } from "../src/lib/constants/plans";
import { BOARD_STATUSES } from "../src/components/dashboard/JobBoard";

describe("Navigation & Plans Configuration Test Suite [Unit Test]", () => {

    test("1. Canonical Navigation items contain all required sections", () => {
        const expectedLabels = [
            "Home",
            "Applications",
            "Resumes",
            "Work",
            "Cover Letters",
            "Portfolio",
            "Analytics",
            "Settings"
        ];

        const actualLabels = DASHBOARD_NAV_ITEMS.map(item => item.label);
        for (const expected of expectedLabels) {
            assert.ok(
                actualLabels.includes(expected),
                `Expected navigation items to include "${expected}". Found: ${actualLabels.join(", ")}`
            );
        }

        // Verify Settings points to real route /dashboard/settings
        const settingsItem = DASHBOARD_NAV_ITEMS.find(i => i.label === "Settings");
        assert.ok(settingsItem, "Settings item must exist in navigation");
        assert.strictEqual(settingsItem.href, "/dashboard/settings");

        // Verify Applications points to /dashboard/job-tracker
        const appItem = DASHBOARD_NAV_ITEMS.find(i => i.label === "Applications");
        assert.ok(appItem, "Applications item must exist in navigation");
        assert.strictEqual(appItem.href, "/dashboard/job-tracker");
    });

    test("2. Dynamic Breadcrumb Generator maps routes correctly", () => {
        assert.deepStrictEqual(getBreadcrumbForPath("/dashboard"), {
            title: "Home"
        });

        assert.deepStrictEqual(getBreadcrumbForPath("/dashboard/job-tracker"), {
            title: "Applications"
        });

        assert.deepStrictEqual(getBreadcrumbForPath("/dashboard/resumes"), {
            title: "Resumes"
        });

        assert.deepStrictEqual(getBreadcrumbForPath("/dashboard/resumes/my-resume-123"), {
            parent: { label: "Resumes", href: "/dashboard/resumes" },
            title: "Resume Editor"
        });

        assert.deepStrictEqual(getBreadcrumbForPath("/dashboard/applications/app-123"), {
            parent: { label: "Applications", href: "/dashboard/job-tracker" },
            title: "Application Workspace"
        });

        assert.deepStrictEqual(getBreadcrumbForPath("/dashboard/settings"), {
            title: "Settings"
        });
    });

    test("3. Commercial Model Plans consistency and credit allocations", () => {
        const planKeys = Object.keys(PLANS) as PlanId[];
        assert.deepStrictEqual(planKeys, ["starter", "pro", "enterprise"]);

        for (const key of planKeys) {
            const plan = PLANS[key];
            assert.ok(plan.id, `Plan ${key} must have an id`);
            assert.ok(plan.name, `Plan ${key} must have a name`);
            assert.ok(plan.credits > 0, `Plan ${key} must provide positive credits`);
            assert.ok(plan.priceInINR > 0, `Plan ${key} must have valid INR price`);
            assert.ok(plan.displayPrice.startsWith("₹"), `Plan ${key} display price must be in INR format`);
        }
    });

    test("4. Board statuses contain all 8 canonical stages", () => {
        const expected = [
            "Draft",
            "Preparing",
            "Tailoring",
            "Applied",
            "Interviewing",
            "Offer",
            "Rejected",
            "Withdrawn"
        ];
        assert.deepStrictEqual(Array.from(BOARD_STATUSES), expected);
    });
});
