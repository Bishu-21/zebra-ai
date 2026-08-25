import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

const cardSource = readFileSync("src/components/dashboard/PortfolioStatusCard.tsx", "utf8");
const slugSource = readFileSync("src/lib/slug-generator.ts", "utf8");

describe("Portfolio publishing UX", () => {
    test("new portfolios remain drafts and empty portfolios advance the user", () => {
        assert.match(slugSource, /isPublished: false/);
        assert.match(cardSource, /Add your first work item/);
        assert.match(cardSource, /link stays hidden/);
    });

    test("publish changes have completion feedback and an undo", () => {
        assert.match(cardSource, /Portfolio published\./);
        assert.match(cardSource, /Portfolio unpublished\./);
        assert.match(cardSource, /> Undo</);
    });
});
