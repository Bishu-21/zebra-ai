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
    const desktopAuthPosition = homeSource.indexOf('<div className="hidden md:block">');
    const mobileNavPosition = homeSource.indexOf("<PublicMobileNav />");
    const headerEndPosition = homeSource.indexOf("</nav>");

    assert.ok(desktopAuthPosition > -1);
    assert.ok(mobileNavPosition > desktopAuthPosition);
    assert.ok(mobileNavPosition < headerEndPosition);
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

  test("product demo exposes poster, captions, controls, and reduced-motion copy", () => {
    assert.match(demoSource, /useReducedMotion/);
    assert.match(demoSource, /controls/);
    assert.match(demoSource, /poster=\{POSTER_SRC\}/);
    assert.match(demoSource, /kind="captions"/);
    assert.match(demoSource, /walkthrough\.vtt/);
    assert.match(demoSource, /preload="none"/);
    assert.match(benefitsSource, /Keep the original resume/);
    assert.match(benefitsSource, /See how experience fits a role/);
    assert.match(benefitsSource, /Approve edits before you export/);
    assert.match(faqSource, /not a subscription/);
    assert.match(faqSource, /DOCX export is not available/);
  });
});
