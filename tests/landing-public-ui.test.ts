import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

const mobileNavSource = readFileSync("src/components/landing/PublicMobileNav.tsx", "utf8");
const comparisonSource = readFileSync("src/components/landing/AeoComparison.tsx", "utf8");
const homeSource = readFileSync("src/app/page.tsx", "utf8");

describe("Public landing page regressions", () => {
  test("mobile navigation has an accessible, stateful menu", () => {
    assert.match(mobileNavSource, /aria-expanded=\{isOpen\}/);
    assert.match(mobileNavSource, /aria-controls="mobile-navigation-menu"/);
    assert.match(mobileNavSource, /event\.key === "Escape"/);
    assert.match(mobileNavSource, /document\.body\.style\.overflow = "hidden"/);
    assert.match(mobileNavSource, /onClick=\{closeMenu\}/);
    assert.match(mobileNavSource, /<NavAuth \/>/);
  });

  test("mobile menu is mounted in the fixed header and desktop auth stays separate", () => {
    const desktopAuthPosition = homeSource.indexOf('<div className="hidden md:block">');
    const mobileNavPosition = homeSource.indexOf("<PublicMobileNav />");
    const headerEndPosition = homeSource.indexOf("</nav>");

    assert.ok(desktopAuthPosition > -1);
    assert.ok(mobileNavPosition > desktopAuthPosition);
    assert.ok(mobileNavPosition < headerEndPosition);
  });

  test("comparison content is visible without viewport animation hydration", () => {
    assert.doesNotMatch(comparisonSource, /initial=\{\{\s*opacity:\s*0/);
    assert.doesNotMatch(comparisonSource, /whileInView/);
    assert.match(comparisonSource, /Zebra AI/);
    assert.match(comparisonSource, /Typical AI rewriter/);
    assert.match(comparisonSource, /COMPARISON_FEATURES\.map/);
  });
});
