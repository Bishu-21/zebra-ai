import assert from "node:assert/strict";
import { test } from "node:test";
import { loadResumeReviewOptions } from "../src/lib/resume-review-options";

test("saved resume review includes older pages and exposes only selection metadata", async () => {
    const requests: string[] = [];
    const fetcher = async (input: string) => {
        requests.push(input);
        const secondPage = input.includes("cursor=");
        return Response.json({
            resumes: Array.from({ length: secondPage ? 40 : 50 }, (_, index) => ({
                id: String(index + (secondPage ? 50 : 0)), title: `Resume ${index}`, content: "private content",
            })),
            page: { hasMore: !secondPage, nextCursor: secondPage ? null : "older+page" },
        });
    };
    const options = await loadResumeReviewOptions(fetcher);
    assert.equal(options.length, 90);
    assert.equal(options.at(-1)?.id, "89");
    assert.deepEqual(Object.keys(options[0]), ["id", "title"]);
    assert.deepEqual(requests, ["/api/resumes?limit=50", "/api/resumes?limit=50&cursor=older%2Bpage"]);
});

test("saved resume list does not silently present incomplete results after a failed page", async () => {
    let calls = 0;
    await assert.rejects(loadResumeReviewOptions(async () => ++calls === 1
        ? Response.json({ resumes: [{ id: "one", title: "One" }], page: { hasMore: true, nextCursor: "next" } })
        : Response.json({ error: "Please sign in again" }, { status: 401 })), /Please sign in again/);
});

test("saved resume loading stops if the API repeats a pagination cursor", async () => {
    await assert.rejects(loadResumeReviewOptions(async () => Response.json({
        resumes: [], page: { hasMore: true, nextCursor: "same" },
    })), /pagination/);
});
