import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const chrome = readFileSync("src/components/dashboard/feature-chrome.ts", "utf8");
const dashboardPage = readFileSync("src/components/dashboard/DashboardPage.tsx", "utf8");
const resumes = readFileSync("src/app/dashboard/resumes/page.tsx", "utf8");
const importer = readFileSync("src/components/dashboard/ImportResume.tsx", "utf8");
const tailor = readFileSync("src/components/dashboard/TailorResume.tsx", "utf8");
const analyze = readFileSync("src/components/dashboard/AnalyzeResume.tsx", "utf8");
const coverLetters = readFileSync("src/app/dashboard/cover-letters/page.tsx", "utf8");
const generator = readFileSync("src/components/dashboard/GenerateCoverLetter.tsx", "utf8");

describe("dashboard feature chrome", () => {
    it("exposes shared sidebar-aligned tokens without uppercase labels", () => {
        assert.match(chrome, /primaryButton: "inline-flex min-h-11/);
        assert.match(chrome, /rounded-xl/);
        assert.match(chrome, /border-neutral-200/);
        assert.match(chrome, /font-sans/);
        assert.match(chrome, /fieldIcon: "pointer-events-none absolute left-3.5/);
        assert.doesNotMatch(chrome, /uppercase/);
    });

    it("uses a shared page heading without uppercase stat labels", () => {
        assert.match(dashboardPage, /text-xl font-semibold/);
        assert.match(dashboardPage, /title in featureIcons/);
        assert.match(dashboardPage, /text-xs font-medium text-muted-foreground/);
        assert.doesNotMatch(dashboardPage, /uppercase/);
    });

    it("styles Resumes, import, and job-match dialogs with the shared chrome", () => {
        assert.match(resumes, /featureChrome.primaryButton/);
        assert.match(resumes, /featureChrome.card/);
        assert.match(resumes, /aria-label="Download PDF"/);
        assert.match(importer, /featureChrome.dialogHeader/);
        assert.match(importer, /useDialogFocus/);
        assert.match(tailor, /featureChrome.dialog/);
        assert.match(tailor, /AppIcon icon=\{RiLink\}/);
        assert.match(analyze, /featureChrome.dialog/);
        assert.match(analyze, /useDialogFocus/);
        assert.match(analyze, /feature="Resumes"/);
        assert.doesNotMatch(resumes, /font-extrabold|uppercase tracking/);
        assert.doesNotMatch(importer, /uppercase tracking-wider/);
        assert.doesNotMatch(tailor, /uppercase tracking-wider/);
        assert.doesNotMatch(analyze, /uppercase tracking-wider/);
    });

    it("keeps cover-letter document preview distinct from dashboard chrome", () => {
        assert.match(coverLetters, /featureChrome.card/);
        assert.match(generator, /featureChrome.dialogHeader/);
        assert.match(generator, /STIX Two Text/);
        assert.match(generator, /fontFamily: "'STIX Two Text', serif"/);
    });
});
