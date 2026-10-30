import assert from "node:assert/strict";
import { test } from "node:test";
import { parseZebuPlan } from "../src/lib/zebu-plan-parse";

test("parses a strict Zebu JSON plan", () => {
  const plan = parseZebuPlan(JSON.stringify({
    spokenResponse: "You have three saved applications.",
    action: { type: "quick_stats" },
  }));
  assert.equal(plan.spokenResponse, "You have three saved applications.");
  assert.equal(plan.action.type, "quick_stats");
});

test("keeps a spoken reply when the model wraps JSON or omits a valid action", () => {
  const wrapped = parseZebuPlan('```json\n{"spokenResponse":"Opening Applications.","action":{"type":"navigate","route":"/dashboard/job-tracker"}}\n```');
  assert.equal(wrapped.spokenResponse, "Opening Applications.");
  assert.equal(wrapped.action.type, "navigate");

  const loose = parseZebuPlan('{"spokenResponse":"I can help with that.","action":{"type":"invented"}}');
  assert.equal(loose.spokenResponse, "I can help with that.");
  assert.equal(loose.action.type, "none");
});

test("uses plain text when the model does not return JSON", () => {
  const plan = parseZebuPlan("You have two upcoming deadlines this week.");
  assert.equal(plan.spokenResponse, "You have two upcoming deadlines this week.");
  assert.equal(plan.action.type, "none");
});
