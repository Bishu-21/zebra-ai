import assert from "node:assert/strict";
import { test } from "node:test";
import { COMPLETE_FEATURE_DEMO_IDS, DEMO_FEATURES, getDemoMoment, isDemoId, isPlayableDemoId } from "../src/lib/demo-catalog";

test("each current feature has its own three-part demo", () => {
    assert.equal(DEMO_FEATURES.length, 9);
    assert.equal(new Set(DEMO_FEATURES.map(item => item.id)).size, 9);
    for (const feature of DEMO_FEATURES) {
        assert.equal(getDemoMoment(feature.id, 0).phase, 0);
        assert.equal(getDemoMoment(feature.id, 4).phase, 1);
        assert.equal(getDemoMoment(feature.id, 8).phase, 2);
        assert.equal(getDemoMoment(feature.id, 12).phase, 2);
    }
});

test("overview visits all features without invalid timing or arbitrary routes", () => {
    assert.deepEqual(DEMO_FEATURES.map((_, index) => getDemoMoment("overview", index * 3).feature.id), DEMO_FEATURES.map(item => item.id));
    assert.equal(getDemoMoment("resumes", -5).time, 0);
    assert.equal(getDemoMoment("overview", Infinity).feature.id, "resumes");
    assert.equal(getDemoMoment("overview", 999).feature.id, "zebu");
    assert.equal(isDemoId("../../api"), false);
    assert.equal(isDemoId("overview"), true);
    assert.equal(isPlayableDemoId("overview"), true);
    assert.equal(isPlayableDemoId("resumes"), true);
    assert.equal(isPlayableDemoId("applications"), false);
    assert.deepEqual([...COMPLETE_FEATURE_DEMO_IDS], ["resumes"]);
});
