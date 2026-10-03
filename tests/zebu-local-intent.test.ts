import assert from "node:assert/strict";
import test from "node:test";
import { parseZebuWorkspaceCommand } from "../src/lib/zebu-local-intent";
import { applicationFormToolResult } from "../src/lib/zebu-live-ui-actions";

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
});

test("live voice can request the application form without creating a record", () => {
  assert.deepEqual(applicationFormToolResult(), {
    result: { success: true, note: "Application form requested; no record has been created." },
    uiAction: { type: "start_flow", flow: "application" },
  });
});
