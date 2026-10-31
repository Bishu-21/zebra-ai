import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

const mobileNavSource = readFileSync("src/components/landing/PublicMobileNav.tsx", "utf8");
const homeSource = readFileSync("src/app/page.tsx", "utf8");
const heroSource = readFileSync("src/components/landing/Hero.tsx", "utf8");
const demoSource = readFileSync("src/components/landing/ProductDemo.tsx", "utf8");
const benefitsSource = readFileSync("src/components/landing/Benefits.tsx", "utf8");
const faqSource = readFileSync("src/data/faq.ts", "utf8");
const manifestSource = readFileSync("src/app/manifest.ts", "utf8");

describe("Public landing page regressions", () => {
  test("mobile navigation has an accessible, stateful menu", () => {
    assert.match(mobileNavSource, /aria-expanded=\{isOpen\}/);
    assert.match(mobileNavSource, /aria-controls="mobile-navigation-menu"/);
    assert.match(mobileNavSource, /event\.key === "Escape"/);
    assert.match(mobileNavSource, /document\.body\.style\.overflow = "hidden"/);
    assert.match(mobileNavSource, /onClick=\{closeMenu\}/);
    assert.match(mobileNavSource, /<NavAuth \/>/);
    assert.match(mobileNavSource, /how-it-works/);
  });

  test("mobile menu is mounted in the fixed header and desktop auth stays separate", () => {
    const desktopAuthPosition = homeSource.indexOf('<div className="hidden lg:block">');
    const mobileNavPosition = homeSource.indexOf("<PublicMobileNav />");
    const headerEndPosition = homeSource.indexOf("</nav>");

    assert.ok(desktopAuthPosition > -1);
    assert.ok(mobileNavPosition > desktopAuthPosition);
    assert.ok(mobileNavPosition < headerEndPosition);
    assert.match(homeSource, /hidden items-center gap-6 lg:flex/);
    assert.match(mobileNavSource, /lg:hidden/);
    assert.doesNotMatch(mobileNavSource, /md:hidden/);
  });

  test("landing layout stays inside the viewport on phones and tablets", () => {
    const pricingSource = readFileSync("src/components/landing/Pricing.tsx", "utf8");
    const sceneSource = readFileSync("src/components/demo/FeatureDemoScene.tsx", "utf8");
    const sidebarSource = readFileSync("src/components/dashboard/Sidebar.tsx", "utf8");
    const cssSource = readFileSync("src/app/globals.css", "utf8");

    assert.match(homeSource, /overflow-x-clip/);
    assert.match(heroSource, /flex-col gap-3 sm:mt-8 sm:w-auto sm:flex-row/);
    assert.match(heroSource, /text-\[2rem\].*sm:text-5xl lg:text-7xl/);
    assert.match(demoSource, /h-\[min\(62dvh,28rem\)\]/);
    assert.match(demoSource, /sm:h-\[min\(70dvh,42rem\)\]/);
    assert.match(demoSource, /lg:h-\[min\(78dvh,54rem\)\]/);
    assert.match(demoSource, /overflow-x-auto overscroll-x-contain/);
    assert.match(demoSource, /isolate overflow-hidden/);
    assert.match(pricingSource, /lg:grid-cols-3/);
    assert.doesNotMatch(pricingSource, /scale-105/);
    assert.match(sceneSource, /demo-workspace/);
    assert.match(sidebarSource, /max-w-\[min\(17rem,calc\(100%-1\.5rem\)\)\]/);
    assert.match(cssSource, /\.demo-workspace \.zebu-panel/);
    assert.match(cssSource, /width: calc\(100% - 1rem\)/);
  });

  test("landing focuses on import, review, and export", () => {
    assert.match(heroSource, /Improve your resume for a specific job/);
    assert.match(heroSource, /open-auth/);
    assert.match(heroSource, /href="#demo"/);
    assert.match(heroSource, /href="\/dashboard\/resumes"/);
    assert.match(homeSource, /<Benefits \/>/);
    assert.doesNotMatch(homeSource, /ATS Editor/);
    assert.doesNotMatch(manifestSource, /beat the ATS|get shortlisted|ultimate/i);
  });

  test("product demo plays the sample workspace and respects reduced motion", () => {
    assert.match(demoSource, /useReducedMotion/);
    assert.match(demoSource, /FeatureDemoScene/);
    assert.match(demoSource, /DEMO_DISCLOSURE/);
    assert.match(demoSource, /Pause/);
    assert.match(demoSource, /Play/);
    assert.match(demoSource, /interactive=\{interactive\}/);
    assert.doesNotMatch(demoSource, /Download video|walkthrough\.mp4/);
    assert.doesNotMatch(demoSource, /ATS Editor|scrape|auto-post/i);
    assert.match(benefitsSource, /Keep the original resume/);
    assert.match(benefitsSource, /See how experience fits a role/);
    assert.match(benefitsSource, /Approve edits before you export/);
    assert.match(faqSource, /not a subscription/);
    assert.match(faqSource, /DOCX export is not available/);
  });

  test("application preview uses the product workspace instead of a fabricated approval card", () => {
    const scene = readFileSync("src/components/demo/FeatureDemoScene.tsx", "utf8");
    const pages = readFileSync("src/components/demo/SamplePages.tsx", "utf8");
    assert.match(scene, /<Sidebar/);
    assert.match(scene, /<Header/);
    assert.match(scene, /inert=\{interactive \? undefined : true\}/);
    assert.match(pages, /<ApplicationWorkspace/);
    assert.match(pages, /initialApplication=\{APPLICATION_WORKSPACE_FIXTURE\.application\}/);
    assert.doesNotMatch(pages, /Suggested wording|>Approve<|>Reject</);
    assert.doesNotMatch(scene, /DemoCursor|cursorPose/);
  });
});
