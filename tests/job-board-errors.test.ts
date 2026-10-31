import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const board = readFileSync("src/components/dashboard/JobBoard.tsx", "utf8");
const drawer = readFileSync("src/components/dashboard/AddApplicationDrawer.tsx", "utf8");
const credits = readFileSync("src/components/dashboard/CreditTopUp.tsx", "utf8");
const career = readFileSync("src/components/dashboard/CareerProfilePrompt.tsx", "utf8");
const suggestions = readFileSync("src/components/dashboard/ApplicationSuggestionsModal.tsx", "utf8");

test("application status and delete failures are visible", () => {
    assert.match(board, /role="alert"/);
    assert.match(board, /Could not update application status/);
    assert.match(board, /Could not delete this application/);
    assert.match(board, /window\.confirm/);
});

test("add-application extract control has a visible name", () => {
    assert.match(drawer, /Extract<\/button>/);
});

test("checkout and career prompts trap focus like other dialogs", () => {
    assert.match(credits, /useDialogFocus/);
    assert.match(career, /useDialogFocus/);
});

test("application suggestion actions keep Approve and Reject labels", () => {
    assert.match(suggestions, /\bApprove\b/);
    assert.match(suggestions, /\bReject\b/);
});
