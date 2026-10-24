import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("Cover letter accessibility and responsive dialogs", () => {
    const generatorSource = readFileSync("src/components/dashboard/GenerateCoverLetter.tsx", "utf8");
    const actionsSource = readFileSync("src/components/dashboard/CoverLetterActions.tsx", "utf8");

    it("attaches dialog semantics and useDialogFocus to the generator content container, not the backdrop", () => {
        assert.match(generatorSource, /useDialogFocus\(isOpen,\s*handleClose\)/);
        assert.match(generatorSource, /className="fixed inset-0 bg-neutral-950\/60 backdrop-blur-sm"[^>]*aria-hidden="true"/);
        assert.doesNotMatch(generatorSource, /aria-hidden="true"[^>]*role="dialog"/);
        assert.match(generatorSource, /ref=\{dialogRef\}/);
        assert.match(generatorSource, /role="dialog"/);
        assert.match(generatorSource, /aria-modal="true"/);
        assert.match(generatorSource, /aria-labelledby="cover-letter-dialog-title"/);
        assert.match(generatorSource, /id="cover-letter-dialog-title"/);
    });

    it("attaches dialog semantics and useDialogFocus to the preview content container in CoverLetterActions", () => {
        assert.match(actionsSource, /useDialogFocus\(isViewOpen,\s*handleClose\)/);
        assert.match(actionsSource, /className="fixed inset-0 bg-neutral-950\/60 backdrop-blur-sm"/);
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

    it("uses monochrome design tokens without low-contrast text classes", () => {
        assert.doesNotMatch(generatorSource, /text-black\/30/);
        assert.doesNotMatch(generatorSource, /text-black\/40/);
        assert.doesNotMatch(generatorSource, /text-black\/20/);
        assert.doesNotMatch(actionsSource, /text-\[#B5B5B5\]/);
        assert.doesNotMatch(actionsSource, /text-black\/30/);
        assert.doesNotMatch(actionsSource, /text-black\/40/);
        assert.match(generatorSource, /text-neutral-950/);
        assert.match(generatorSource, /text-neutral-700/);
        assert.match(actionsSource, /text-neutral-950/);
        assert.match(actionsSource, /text-neutral-600/);
    });

    it("supports responsive viewports down to 320px with adaptive padding and max dimensions", () => {
        assert.match(generatorSource, /max-h-\[calc\(100dvh-1rem\)\]/);
        assert.match(actionsSource, /max-h-\[calc\(100dvh-1rem\)\]/);
        assert.doesNotMatch(actionsSource, /min-h-\[297mm\]/);
        assert.match(generatorSource, /p-4 sm:p-6 md:p-8/);
        assert.match(actionsSource, /p-4 sm:p-6 md:p-8/);
    });
});
