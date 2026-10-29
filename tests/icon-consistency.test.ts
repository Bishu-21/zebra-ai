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
const jobBoard = readFileSync("src/components/dashboard/JobBoard.tsx", "utf8");
const coverLettersPage = readFileSync("src/app/dashboard/cover-letters/page.tsx", "utf8");
const zebuStyles = readFileSync("src/app/globals.css", "utf8");

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

    it("reuses the sidebar Cover Letters icon for feature identity, not actions", () => {
        const opener = generator.slice(
            generator.indexOf("data-cover-letter-trigger"),
            generator.indexOf("Generate Cover Letter") + 24,
        );
        assert.match(opener, /AppIcon icon=\{RiArticleLine\}/);
        assert.doesNotMatch(opener, /RiAddLine|RiMailSendLine|RiMagicLine/);

        const headingStart = generator.indexOf("w-10 h-10 sm:w-12 sm:h-12 bg-neutral-950");
        const heading = generator.slice(headingStart, generator.indexOf("Cover Letter Generator") + 24);
        assert.match(heading, /AppIcon icon=\{RiArticleLine\}/);
        assert.doesNotMatch(heading, /RiMailSendLine|RiAddLine|RiMagicLine/);

        const generateCta = generator.slice(
            generator.indexOf("Generating..."),
            generator.indexOf("Generating...") + 520,
        );
        assert.match(generateCta, /AppIcon icon=\{RiMailSendLine\}/);
        assert.doesNotMatch(generateCta, /RiArticleLine/);
        assert.match(generator, /AppIcon icon=\{RiMailSendLine\} size=\{16\} className="text-neutral-600"/);
        assert.match(generator, /Generation cost/);

        assert.match(coverLettersPage, /RiArticleLine size=\{26\}/);
        assert.match(coverLettersPage, /RiArticleLine size=\{20\}/);
        assert.doesNotMatch(coverLettersPage, /RiMagicLine|RiFileTextLine/);
        assert.match(coverLettersPage, /RiTimeLine/);

        assert.match(actions, /AppIcon icon=\{RiArticleLine\}/);
        assert.doesNotMatch(actions, /RiMailSendLine/);
        assert.match(actions, /AppIcon icon=\{RiFileCopyLine\}/);
        assert.match(actions, /AppIcon icon=\{RiDownload2Line\}/);
        assert.match(actions, /AppIcon icon=\{RiDeleteBinLine\}/);
        assert.match(actions, /AppIcon icon=\{RiCloseLine\}/);
    });

    it("compacts the Zebu launcher at 390px so card text stays readable", () => {
        const mobileBlock = zebuStyles.slice(
            zebuStyles.indexOf("@media (max-width: 640px)"),
            zebuStyles.indexOf("@media (prefers-reduced-motion"),
        );
        assert.match(mobileBlock, /\.zebu-fab \{[^}]*min-width: 2\.75rem/);
        assert.match(mobileBlock, /\.zebu-fab > span \{/);
        assert.match(mobileBlock, /clip: rect\(0, 0, 0, 0\)/);
        assert.match(coverLettersPage, /max-\[640px\]:pr-16/);
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

    it("keeps job-board icon actions at a 44px target and search icons off the input", () => {
        assert.match(jobBoard, /h-11 w-11[^"]*" aria-label="Open job listing"/);
        assert.match(jobBoard, /h-11 w-11[^"]*" aria-label="Delete application"/);
        assert.match(jobBoard, /7\.5rem/);
        assert.match(jobBoard, /RiSearchLine aria-hidden="true" className="pointer-events-none/);
    });
});
