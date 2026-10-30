import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

const workspace = readFileSync("src/components/dashboard/ApplicationWorkspace.tsx", "utf8");
const modal = readFileSync("src/components/dashboard/ApplicationSuggestionsModal.tsx", "utf8");
const jobBoard = readFileSync("src/components/dashboard/JobBoard.tsx", "utf8");
const capturePage = readFileSync("src/app/dev/application-workspace/page.tsx", "utf8");

describe("Applications workspace readability and names", () => {
    test("section navigation is named, current, and wraps instead of clipping", () => {
        assert.match(workspace, /aria-label="Application sections"/);
        assert.match(workspace, /aria-current=\{selected \? "page" : undefined\}/);
        assert.match(workspace, /aria-label=\{section\.badge \? `\$\{section\.label\}, \$\{section\.badge\.ariaLabel\}` : section\.label\}/);
        assert.match(workspace, /flex flex-wrap gap-2/);
        assert.doesNotMatch(workspace, /overflow-x-auto md:flex-col/);
        assert.match(workspace, /aria-label=\{section\.badge\.ariaLabel\}/);
        assert.match(workspace, /pending suggestions/);
        assert.match(workspace, /missing evidence items/);
        assert.match(workspace, /aria-hidden="true"/);
        assert.match(workspace, /border-white\/80/);
        assert.match(workspace, /min-h-11/);
    });

    test("status is labeled once in the workspace chrome", () => {
        assert.match(workspace, /htmlFor="application-status"/);
        assert.match(workspace, /id="application-status"/);
        assert.doesNotMatch(workspace, /Status: \{opt\.label\}/);
        assert.match(workspace, /grid-cols-1 gap-3/);
    });

    test("workspace reuses dashboard icon helpers for back and save", () => {
        assert.match(workspace, /FeatureIcon feature="Applications"/);
        assert.match(workspace, /AppIcon icon=\{RiArrowLeftLine\}/);
        assert.match(workspace, /AppIcon icon=\{RiSave3Line\}/);
        assert.match(workspace, /featureChrome\.primaryButton/);
    });

    test("suggestions dialog names the close control and keeps Approve and Reject text", () => {
        assert.match(modal, /role="dialog"/);
        assert.match(modal, /aria-modal="true"/);
        assert.match(modal, /aria-labelledby="application-suggestions-title"/);
        assert.match(modal, /aria-label="Close suggestions"/);
        assert.match(modal, /useDialogFocus/);
        assert.match(modal, /AppIcon icon=\{RiCloseLine\}/);
        assert.match(modal, /Reject/);
        assert.match(modal, /Approve/);
        assert.match(modal, /flex flex-wrap items-center justify-end gap-2/);
    });

    test("job board status and icon actions stay named", () => {
        assert.match(jobBoard, /aria-label=\{`Status for \$\{job\.position\} at \$\{job\.company\}`\}/);
        assert.match(jobBoard, /aria-label="Open application"/);
        assert.match(jobBoard, /aria-label="Delete application"/);
    });

    test("job URL control and suggestions header stay usable at 390px", () => {
        const overview = readFileSync("src/components/dashboard/application-workspace/OverviewTab.tsx", "utf8");
        const suggestions = readFileSync("src/components/dashboard/application-workspace/SuggestionsTab.tsx", "utf8");
        assert.match(overview, /aria-label="Open job listing"/);
        assert.match(overview, /AppIcon icon=\{RiLink\}/);
        assert.doesNotMatch(overview, /RiExternalLinkLine/);
        assert.match(suggestions, /flex flex-col gap-3/);
        assert.match(suggestions, /Re-analyze/);
    });

    test("synthetic capture route is production-hidden", () => {
        assert.match(capturePage, /NODE_ENV === "production"/);
        assert.match(capturePage, /notFound\(\)/);
        assert.match(capturePage, /APPLICATION_WORKSPACE_FIXTURE/);
    });
});
