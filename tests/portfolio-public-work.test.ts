import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import { nextPortfolioWorkIds, selectPublicPortfolioWork } from "../src/lib/portfolio-public";

const publicPage = readFileSync("src/app/p/[slug]/page.tsx", "utf8");
const workRoute = readFileSync("src/app/api/work/route.ts", "utf8");
const workPage = readFileSync("src/app/dashboard/work/page.tsx", "utf8");

describe("Public portfolio work visibility", () => {
    const items = [
        { id: "public-a", isPublic: true, title: "A" },
        { id: "private-b", isPublic: false, title: "B" },
        { id: "public-c", isPublic: true, title: "C" },
    ];

    test("empty featured list shows every public work item", () => {
        assert.deepEqual(
            selectPublicPortfolioWork(items, []).map((item) => item.id),
            ["public-a", "public-c"],
        );
        assert.deepEqual(
            selectPublicPortfolioWork(items, null).map((item) => item.id),
            ["public-a", "public-c"],
        );
    });

    test("a featured list only includes public items that were selected", () => {
        assert.deepEqual(
            selectPublicPortfolioWork(items, ["public-a", "private-b", "missing"]).map((item) => item.id),
            ["public-a"],
        );
    });

    test("toggling public updates an existing featured snapshot and leaves an empty list open", () => {
        assert.equal(nextPortfolioWorkIds([], "public-c", true), null);
        assert.deepEqual(nextPortfolioWorkIds(["public-a"], "public-c", true), ["public-a", "public-c"]);
        assert.deepEqual(nextPortfolioWorkIds(["public-a", "public-c"], "public-c", false), ["public-a"]);
    });

    test("the public page loads owned public work and the work API can toggle visibility", () => {
        assert.match(publicPage, /selectPublicPortfolioWork/);
        assert.match(publicPage, /eq\(workItemsTable\.isPublic, true\)/);
        assert.match(workRoute, /export async function PATCH/);
        assert.match(workRoute, /syncPortfolioWorkVisibility/);
        assert.match(workPage, /handleTogglePublic/);
        assert.match(workPage, /Visible on your public portfolio/);
    });
});
