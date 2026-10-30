import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { test } from "node:test";
import { COMPLETE_FEATURE_DEMO_IDS } from "../src/lib/demo-catalog";

test("every playable demo has a real MP4, poster and caption file", () => {
    for (const id of ["overview", ...COMPLETE_FEATURE_DEMO_IDS]) {
        const mp4 = readFileSync(`public/demo/${id}.mp4`);
        assert.equal(mp4.subarray(4, 8).toString(), "ftyp", `${id} must be an MP4, not an error page`);
        assert.ok(mp4.length > 10_000, `${id} has a nonempty video payload`);
        assert.ok(statSync(`public/demo/${id}-poster.jpg`).size > 1_000);
        const vtt = readFileSync(`public/demo/${id}.vtt`, "utf8");
        assert.match(vtt, /^WEBVTT/);
        assert.equal((vtt.match(/ --> /g) || []).length, id === "overview" ? 27 : 3);
    }
    assert.deepEqual(readFileSync("public/demo/walkthrough.mp4"), readFileSync("public/demo/overview.mp4"));
});
