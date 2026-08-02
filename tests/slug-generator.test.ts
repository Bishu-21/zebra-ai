import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { slugifyName } from "../src/lib/slug-generator";

describe("Slug Generator Unit Tests", () => {
    test("1. Converts names to clean URL-safe slugs", () => {
        assert.equal(slugifyName("Bishal Sarkar"), "bishal-sarkar");
        assert.equal(slugifyName("   John   Doe   "), "john-doe");
        assert.equal(slugifyName("Jane's Portfolio! #1"), "janes-portfolio-1");
        assert.equal(slugifyName("---special---chars---"), "special-chars");
    });

    test("2. Handles fallback for empty or symbol-only names", () => {
        assert.equal(slugifyName(""), "portfolio");
        assert.equal(slugifyName("!@#$%^&*()"), "portfolio");
    });
});
