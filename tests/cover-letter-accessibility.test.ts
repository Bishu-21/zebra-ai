import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("Cover letter accessibility and responsive dialogs", () => {
    const generatorSource = readFileSync("src/components/dashboard/GenerateCoverLetter.tsx", "utf8");
    const actionsSource = readFileSync("src/components/dashboard/CoverLetterActions.tsx", "utf8");
    const chromeSource = readFileSync("src/components/dashboard/feature-chrome.ts", "utf8");
    const pageSource = readFileSync("src/app/dashboard/cover-letters/page.tsx", "utf8");

    it("attaches dialog semantics and useDialogFocus to the generator content container, not the backdrop", () => {
        assert.match(generatorSource, /useDialogFocus\(isOpen,\s*handleClose\)/);
        assert.match(generatorSource, /className=\{featureChrome\.backdrop\}/);
        assert.match(generatorSource, /aria-hidden="true"/);
        assert.doesNotMatch(generatorSource, /aria-hidden="true"[^>]*role="dialog"/);
        assert.match(generatorSource, /ref=\{dialogRef\}/);
        assert.match(generatorSource, /role="dialog"/);
        assert.match(generatorSource, /aria-modal="true"/);
        assert.match(generatorSource, /aria-labelledby="cover-letter-dialog-title"/);
        assert.match(generatorSource, /id="cover-letter-dialog-title"/);
    });

    it("attaches dialog semantics and useDialogFocus to the preview content container in CoverLetterActions", () => {
        assert.match(actionsSource, /useDialogFocus\(isViewOpen,\s*handleClose\)/);
        assert.match(actionsSource, /className=\{featureChrome\.backdrop\}/);
        assert.match(actionsSource, /ref=\{dialogRef\}/);
        assert.match(actionsSource, /role="dialog"/);
        assert.match(actionsSource, /aria-modal="true"/);
        assert.match(actionsSource, /aria-labelledby=\{`letter-title-\$\{letter\.id\}`\}/);
        assert.match(actionsSource, /id=\{`letter-title-\$\{letter\.id\}`\}/);
    });

    it("provides accessible labels on icon-only and compact action buttons", () => {
        assert.match(generatorSource, /aria-label="Close generator dialog"/);
        assert.match(actionsSource, /aria-label="Close preview"/);
        assert.match(actionsSource, /aria-label="Delete cover letter"/);
        assert.match(actionsSource, /aria-label="Preview cover letter"/);
        assert.match(actionsSource, /aria-label="Copy letter text"/);
        assert.match(actionsSource, /aria-label="Download PDF"/);
        assert.match(generatorSource, /htmlFor="cover-letter-resume-select"/);
        assert.match(generatorSource, /id="cover-letter-resume-select"/);
        assert.match(generatorSource, /htmlFor="cover-letter-title-input"/);
        assert.match(generatorSource, /id="cover-letter-title-input"/);
        assert.match(generatorSource, /htmlFor="cover-letter-url-input"/);
        assert.match(generatorSource, /id="cover-letter-url-input"/);
        assert.match(generatorSource, /htmlFor="cover-letter-jd-input"/);
        assert.match(generatorSource, /id="cover-letter-jd-input"/);
    });

    it("preserves destructive action confirmation and state handling", () => {
        assert.match(actionsSource, /confirm\("Are you sure you want to delete this cover letter\? This action cannot be undone\."\)/);
        assert.match(actionsSource, /isDeleting/);
    });

    it("uses sidebar-aligned sans tokens without low-contrast text classes", () => {
        assert.doesNotMatch(generatorSource, /text-black\/30/);
        assert.doesNotMatch(generatorSource, /text-black\/40/);
        assert.doesNotMatch(generatorSource, /text-black\/20/);
        assert.doesNotMatch(actionsSource, /text-\[#B5B5B5\]/);
        assert.doesNotMatch(actionsSource, /text-black\/30/);
        assert.doesNotMatch(actionsSource, /text-black\/40/);
        assert.match(generatorSource, /text-muted-foreground/);
        assert.match(generatorSource, /text-foreground/);
        assert.match(chromeSource, /font-sans/);
        assert.match(pageSource, /font-sans/);
        assert.match(chromeSource, /bg-black\/40/);
        assert.match(chromeSource, /disabled:bg-neutral-300 disabled:text-neutral-700/);
    });

    it("supports responsive viewports down to 320px with adaptive padding and max dimensions", () => {
        assert.match(chromeSource, /max-h-\[calc\(100dvh-1\.5rem\)\]/);
        assert.match(generatorSource, /featureChrome\.dialog/);
        assert.match(actionsSource, /featureChrome\.dialog/);
        assert.doesNotMatch(actionsSource, /min-h-\[297mm\]/);
        assert.match(generatorSource, /p-3 sm:items-center sm:p-4/);
        assert.match(actionsSource, /p-3 sm:items-center sm:p-4/);
        assert.doesNotMatch(pageSource, /max-\[640px\]:pr-16/);
        assert.match(pageSource, /max-\[640px\]:pb-24/);
    });

    it("uses the Cover Letters sidebar identity icon in headings, entry, and preview chrome", () => {
        assert.match(pageSource, /AppIcon icon=\{RiArticleLine\}/);
        assert.match(generatorSource, /AppIcon icon=\{RiArticleLine\}/);
        assert.match(actionsSource, /AppIcon icon=\{RiArticleLine\}/);
        assert.match(generatorSource, /Generate cover letter/);
        assert.doesNotMatch(generatorSource, /uppercase tracking-wider/);
        assert.doesNotMatch(actionsSource, /AI-Tailored Professional Letter/);
    });

    it("keeps download, copy, extract, and close as distinct action glyphs", () => {
        assert.match(generatorSource, /RiFileCopyLine/);
        assert.match(generatorSource, /RiDownload2Line/);
        assert.match(generatorSource, /RiCloseLine/);
        assert.match(generatorSource, /RiFileSearchLine/);
        assert.match(generatorSource, /RiMailSendLine/);
        assert.match(actionsSource, /RiFileCopyLine/);
        assert.match(actionsSource, /RiDownload2Line/);
        assert.match(actionsSource, /RiDeleteBinLine/);
        assert.match(actionsSource, /RiEyeLine/);
        assert.doesNotMatch(actionsSource, /RiDeleteBin6Line/);
    });

    it("renders letter previews through the shared document model without placeholder identity", () => {
        const documentSource = readFileSync("src/components/dashboard/CoverLetterDocument.tsx", "utf8");
        assert.match(generatorSource, /CoverLetterDocument/);
        assert.match(actionsSource, /CoverLetterDocument/);
        assert.match(documentSource, /composeCoverLetterDocument/);
        assert.match(documentSource, /Arial, Helvetica, sans-serif/);
        assert.doesNotMatch(generatorSource, /Applicant Name/);
        assert.doesNotMatch(generatorSource, /Zebra AI Generated/);
        assert.doesNotMatch(actionsSource, /Generated by Zebra AI/);
        assert.doesNotMatch(documentSource, /Applicant Name/);
        assert.doesNotMatch(documentSource, /session\.user\.name|user\.name/);
    });
});
