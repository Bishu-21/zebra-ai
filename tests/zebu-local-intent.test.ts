import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parseZebuWorkspaceCommand } from "../src/lib/zebu-local-intent";
import { applicationFormToolResult } from "../src/lib/zebu-live-ui-actions";
import { resolveZebuPageRoute, zebuRoutesMatchSidebar } from "../src/lib/zebu-navigation";

test("clear application commands open the correct workspace flow", () => {
  assert.deepEqual(parseZebuWorkspaceCommand("Go to applications and create a new application for me"), {
    route: "/dashboard/job-tracker",
    openApplicationForm: true,
  });
  assert.deepEqual(parseZebuWorkspaceCommand("Please open applications"), {
    route: "/dashboard/job-tracker",
    openApplicationForm: false,
  });
  assert.deepEqual(parseZebuWorkspaceCommand("Add a new application"), {
    route: "/dashboard/job-tracker",
    openApplicationForm: true,
  });
});

test("workspace commands do not mistake questions or complaints for navigation", () => {
  assert.equal(parseZebuWorkspaceCommand("What applications do I have?"), null);
  assert.equal(parseZebuWorkspaceCommand("You have not opened applications"), null);
  assert.equal(parseZebuWorkspaceCommand("Open my application for Acme"), null);
  assert.equal(parseZebuWorkspaceCommand("Open resume analysis"), null);
});

test("LinkedIn Optimizer opens the sidebar route and is not treated as missing", () => {
  assert.equal(zebuRoutesMatchSidebar(), true);
  assert.equal(resolveZebuPageRoute("linkedin"), "/dashboard/linkedin");
  assert.deepEqual(parseZebuWorkspaceCommand("Open LinkedIn Optimizer"), {
    route: "/dashboard/linkedin",
    openApplicationForm: false,
  });
  assert.deepEqual(parseZebuWorkspaceCommand("Please take me to LinkedIn"), {
    route: "/dashboard/linkedin",
    openApplicationForm: false,
  });
  assert.deepEqual(parseZebuWorkspaceCommand("Go to settings"), {
    route: "/dashboard/settings",
    openApplicationForm: false,
  });
});

test("live and text prompts list LinkedIn Optimizer as a real destination", () => {
  const actions = readFileSync(new URL("../src/lib/zebu-actions.ts", import.meta.url), "utf8");
  const livePrompt = readFileSync(new URL("../src/lib/zebu-live-prompt.ts", import.meta.url), "utf8");
  const turn = readFileSync(new URL("../src/app/api/zebu/turn/route.ts", import.meta.url), "utf8");
  assert.match(actions, /enum: ZEBU_PAGE_KEYS/);
  assert.match(actions, /resolveZebuPageRoute/);
  assert.match(livePrompt, /navigate_to_page with page "linkedin"/);
  assert.match(turn, /zebuPageMappingPrompt/);
  assert.match(turn, /Do not deny that the page exists/);
});

test("live voice can request the application form without creating a record", () => {
  assert.deepEqual(applicationFormToolResult(), {
    result: { success: true, note: "Application form requested; no record has been created." },
    uiAction: { type: "start_flow", flow: "application" },
  });
});
