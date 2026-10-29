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
const featureIcon = readFileSync("src/components/dashboard/FeatureIcon.tsx", "utf8");
const analyze = readFileSync("src/components/dashboard/AnalyzeResume.tsx", "utf8");
const tailor = readFileSync("src/components/dashboard/TailorResume.tsx", "utf8");
const importer = readFileSync("src/components/dashboard/ImportResume.tsx", "utf8");
const jobBoard = readFileSync("src/components/dashboard/JobBoard.tsx", "utf8");
const coverLettersPage = readFileSync("src/app/dashboard/cover-letters/page.tsx", "utf8");
const resumesPage = readFileSync("src/app/dashboard/resumes/page.tsx", "utf8");
const zebuStyles = readFileSync("src/app/globals.css", "utf8");
const navigation = readFileSync("src/lib/constants/navigation.ts", "utf8");

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
        assert.match(generator, /featureChrome.fieldIcon/);
        assert.match(readFileSync("src/components/dashboard/feature-chrome.ts", "utf8"), /pointer-events-none absolute left-3.5/);
        const extractBlock = generator.slice(
            generator.indexOf("Extract Description") - 400,
            generator.indexOf("Extract Description") + 80,
        );
        assert.doesNotMatch(extractBlock, /RiDownload2Line/);
        assert.match(generator, /RiDownload2Line[\s\S]{0,220}Export PDF/);
    });

    it("keeps download, copy, close, and delete icons on matching actions", () => {
        assert.match(actions, /aria-label="Download PDF"/);
        assert.match(actions, /AppIcon icon=\{RiDownload2Line\}/);
        assert.match(actions, /AppIcon icon=\{RiFileCopyLine\}/);
        assert.match(actions, /AppIcon icon=\{RiCloseLine\}/);
        assert.match(actions, /AppIcon icon=\{RiDeleteBinLine\}/);
        assert.doesNotMatch(actions, /RiDeleteBin6Line/);
        assert.doesNotMatch(actions, /RiExternalLinkLine/);
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
    it("reuses one FeatureIcon mapping for sidebar destinations and page identity", () => {
        assert.match(featureIcon, /Home: RiHome5Line/);
        assert.match(featureIcon, /Applications: RiBriefcaseLine/);
        assert.match(featureIcon, /Resumes: RiFileTextLine/);
        assert.match(featureIcon, /Work: RiFolder2Line/);
        assert.match(featureIcon, /"Cover Letters": RiArticleLine/);
        assert.match(featureIcon, /Portfolio: RiGlobalLine/);
        assert.match(featureIcon, /"LinkedIn Optimizer": RiLinkedinLine/);
        assert.match(featureIcon, /Analytics: RiLineChartLine/);
        assert.match(featureIcon, /Settings: RiSettings4Line/);
        assert.match(featureIcon, /<AppIcon icon=\{featureIcons\[feature\]\}/);

        assert.match(sidebar, /feature="Home"/);
        assert.match(sidebar, /feature="Applications"/);
        assert.match(sidebar, /feature="Resumes"/);
        assert.match(sidebar, /feature="Work"/);
        assert.match(sidebar, /feature="Cover Letters"/);
        assert.match(sidebar, /feature="Portfolio"/);
        assert.match(sidebar, /feature="LinkedIn Optimizer"/);
        assert.match(sidebar, /feature="Analytics"/);
        assert.match(sidebar, /feature="Settings"/);

        for (const label of ["Home", "Applications", "Resumes", "Work", "Cover Letters", "Portfolio", "LinkedIn Optimizer", "Analytics", "Settings"]) {
            assert.match(navigation, new RegExp(`label: "${label}"`));
        }

        assert.match(dashboard, /feature="Applications"[\s\S]{0,200}View applications/);
        assert.match(resumesPage, /title="Resumes"/);
        assert.match(coverLettersPage, /title="Cover Letters"/);
        assert.match(coverLettersPage, /feature="Cover Letters"/);
    });

    it("reuses the sidebar Cover Letters icon for feature identity, not actions", () => {
        const opener = generator.slice(
            generator.indexOf("data-cover-letter-trigger"),
            generator.indexOf("Generate Cover Letter") + 24,
        );
        assert.match(opener, /AppIcon icon=\{RiArticleLine\}/);
        assert.doesNotMatch(opener, /RiAddLine|RiMailSendLine|RiMagicLine/);

        assert.match(generator, /feature="Cover Letters"/);
        assert.match(generator, /Generating\.\.\.[\s\S]{0,400}AppIcon icon=\{RiMailSendLine\}/);
        assert.match(generator, /AppIcon icon=\{RiMailSendLine\} size=\{16\} className="text-neutral-600"/);
        assert.match(generator, /Generation cost/);

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
        assert.match(resumesPage, /max-\[640px\]:pr-16/);
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
