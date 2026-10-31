import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const dashboardError = readFileSync("src/app/dashboard/error.tsx", "utf8");
const globalError = readFileSync("src/app/global-error.tsx", "utf8");
const notFound = readFileSync("src/app/not-found.tsx", "utf8");
const dashboardNotFound = readFileSync("src/app/dashboard/not-found.tsx", "utf8");

test("error pages use plain recovery actions and do not show stack traces", () => {
    assert.match(dashboardError, /Try again/);
    assert.match(dashboardError, /Back to dashboard/);
    assert.doesNotMatch(dashboardError, /Segment Isolation|Re-initialize Workspace|error\.message|error\?\.digest/);
    assert.match(globalError, /Try again/);
    assert.match(globalError, /Reload page/);
    assert.doesNotMatch(globalError, /Stack Trace Fragment|error\.message &&/);
    assert.match(globalError, /console\.error/);
});

test("missing pages explain the miss and offer working destinations", () => {
    assert.match(notFound, /This page is not available/);
    assert.match(notFound, /href="\/"/);
    assert.match(notFound, /href="\/dashboard"/);
    assert.match(dashboardNotFound, /This workspace page was not found/);
    assert.match(dashboardNotFound, /href="\/dashboard"/);
});
