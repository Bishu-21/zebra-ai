import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const generator = readFileSync("src/components/dashboard/GenerateCoverLetter.tsx", "utf8");
const actions = readFileSync("src/components/dashboard/CoverLetterActions.tsx", "utf8");
const drawer = readFileSync("src/components/dashboard/AddApplicationDrawer.tsx", "utf8");
const sidebar = readFileSync("src/components/dashboard/Sidebar.tsx", "utf8");
const dashboard = readFileSync("src/app/dashboard/page.tsx", "utf8");
const toolbar = readFileSync("src/components/dashboard/resume-editor/EditorToolbar.tsx", "utf8");
const appIcon = readFileSync("src/components/ui/AppIcon.tsx", "utf8");
const analyze = readFileSync("src/components/dashboard/AnalyzeResume.tsx", "utf8");
const tailor = readFileSync("src/components/dashboard/TailorResume.tsx", "utf8");
const importer = readFileSync("src/components/dashboard/ImportResume.tsx", "utf8");

describe("icon meaning and family", () => {
    it("uses Remix icons through AppIcon with decorative hiding and no shrink", () => {
        assert.match(appIcon, /from "react-icons"/);
        assert.match(appIcon, /aria-hidden="true"/);
        assert.match(appIcon, /shrink-0/);
        assert.doesNotMatch(appIcon, /iconsax|lucide|heroicons/i);
    });

    it("maps cover-letter extract and URL fields to search and link icons", () => {
        assert.match(generator, /Extract Description/);
        assert.match(generator, /AppIcon icon=\{RiFileSearchLine\}/);
        assert.match(generator, /AppIcon icon=\{RiLink\}/);
        assert.doesNotMatch(generator, /RiExternalLinkLine/);
        assert.match(generator, /pointer-events-none absolute left-3.5/);
        const extractBlock = generator.slice(
            generator.indexOf("Extract Description") - 400,
            generator.indexOf("Extract Description") + 80,
        );
        assert.doesNotMatch(extractBlock, /RiDownload2Line/);
        assert.match(generator, /RiDownload2Line[\s\S]{0,120}Export PDF/);
    });

    it("keeps download, copy, close, and delete icons on matching actions", () => {
        assert.match(actions, /aria-label="Download PDF"/);
        assert.match(actions, /AppIcon icon=\{RiDownload2Line\}/);
        assert.match(actions, /AppIcon icon=\{RiFileCopyLine\}/);
        assert.match(actions, /AppIcon icon=\{RiCloseLine\}/);
        assert.match(actions, /AppIcon icon=\{RiDeleteBinLine\}/);
        assert.doesNotMatch(actions, /RiDeleteBin6Line/);
        assert.doesNotMatch(actions, /RiExternalLinkLine/);
        assert.match(generator, /AppIcon icon=\{RiArrowDownSLine\}/);
        assert.match(generator, /AppIcon icon=\{RiFileCopyLine\}/);
        assert.match(generator, /AppIcon icon=\{RiCloseLine\}/);
    });

    it("extracts job listings with a document-search icon and a non-clickable link field icon", () => {
        assert.match(drawer, /aria-label="Extract job details from URL"/);
        assert.match(drawer, /AppIcon icon=\{RiFileSearchLine\}/);
        assert.match(drawer, /AppIcon icon=\{RiLink\}[\s\S]*pointer-events-none/);
        assert.doesNotMatch(drawer, /RiDownload2Line|RiExternalLinkLine|RiArrowRightLine/);
    });
});

describe("dashboard navigation and tool dialogs", () => {
    it("gives workspace destinations distinct meaning-matched icons", () => {
        assert.match(sidebar, /"\/dashboard\/job-tracker": <RiBriefcaseLine/);
        assert.match(sidebar, /"\/dashboard\/resumes": <RiFileTextLine/);
        assert.match(sidebar, /"\/dashboard\/work": <RiFolder2Line/);
        assert.match(sidebar, /"\/dashboard\/cover-letters": <RiArticleLine/);
        assert.match(sidebar, /"\/dashboard\/portfolio": <RiGlobalLine/);
        assert.match(sidebar, /"\/dashboard\/linkedin": <RiLinkedinLine/);
        assert.match(sidebar, /"\/dashboard\/analytics": <RiLineChartLine/);
        assert.match(dashboard, /RiBriefcaseLine[\s\S]{0,200}View applications/);
        assert.doesNotMatch(
            dashboard.slice(dashboard.indexOf("View applications") - 220, dashboard.indexOf("View applications") + 40),
            /RiFlashlightLine/,
        );
    });

    it("uses a consistent close control on tool dialogs", () => {
        assert.match(analyze, /aria-label="Close resume review"/);
        assert.match(analyze, /RiCloseLine/);
        assert.doesNotMatch(analyze, /RiCloseCircleLine/);
        assert.match(tailor, /aria-label="Close job match"/);
        assert.match(tailor, /RiCloseLine/);
        assert.doesNotMatch(tailor, /RiCloseCircleLine/);
        assert.match(importer, /aria-label="Close import resume"/);
        assert.match(toolbar, /RiDownload2Line/);
        assert.match(toolbar, /RiFileCopyLine/);
        assert.match(toolbar, /RiDeleteBinLine/);
        assert.doesNotMatch(toolbar, /RiDeleteBin6Line|RiFileDownloadLine|RiClipboardLine/);
    });
});
