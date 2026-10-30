import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("voice remains available with compact navigation-only actions", () => {
    const assistant = readFileSync("src/components/dashboard/ZebuAssistant.tsx", "utf8");
    const token = readFileSync("src/app/api/zebu/live-token/route.ts", "utf8");
    const tool = readFileSync("src/app/api/zebu/tool/route.ts", "utf8");
    const turn = readFileSync("src/app/api/zebu/turn/route.ts", "utf8");
    assert.match(assistant, /useZebuLive/);
    assert.match(assistant, /live\.close\(\)/);
    assert.match(assistant, /zebu-fab--head/);
    assert.match(assistant, /DASHBOARD_NAV_ITEMS\.filter/);
    assert.match(token, /filter\(tool => tool\.name === "navigate_to_page"\)/);
    assert.match(tool, /parsed\.data\.name !== "navigate_to_page"/);
    assert.match(turn, /\["navigate", "none"\]\.includes/);
});
