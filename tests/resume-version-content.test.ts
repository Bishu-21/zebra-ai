import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { saveVersionSchema } from "../src/lib/validation";
import { resolveResumeVersionContent } from "../src/lib/resume-version-content";

const versionMetadata = {
    resumeId: "resume-1",
    title: "Tailored for Microsoft",
    matchScore: 82,
};

describe("Resume version snapshot content", () => {
    test("allows the authenticated server to supply omitted base-resume content", () => {
        const parsed = saveVersionSchema.safeParse(versionMetadata);
        assert.equal(parsed.success, true);
        assert.equal(resolveResumeVersionContent(undefined, "stored resume content"), "stored resume content");
    });

    test("rejects a snapshot when neither submitted nor stored content is usable", () => {
        assert.equal(resolveResumeVersionContent(undefined, ""), null);
        assert.equal(resolveResumeVersionContent("   ", null), null);
    });
});
