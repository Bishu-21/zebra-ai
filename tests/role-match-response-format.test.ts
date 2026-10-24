import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { ROLE_MATCH_RESPONSE_FORMAT } from "../src/lib/role-match-response-format";

describe("Role match provider response format", () => {
    test("requires one strict JSON object matching the role-match contract", () => {
        assert.equal(ROLE_MATCH_RESPONSE_FORMAT.type, "json_schema");
        assert.equal(ROLE_MATCH_RESPONSE_FORMAT.strict, true);
        assert.equal(ROLE_MATCH_RESPONSE_FORMAT.schema.type, "object");
        assert.equal(ROLE_MATCH_RESPONSE_FORMAT.schema.additionalProperties, false);
        assert.deepEqual(ROLE_MATCH_RESPONSE_FORMAT.schema.required, [
            "matchScore",
            "keywordsFound",
            "keywordsMissing",
            "roleFit",
            "criticalGaps",
            "tailoringSuggestions",
            "executiveSummary",
            "sectionChanges",
        ]);

        const sectionChanges = ROLE_MATCH_RESPONSE_FORMAT.schema.properties.sectionChanges;
        assert.equal(sectionChanges.type, "array");
        assert.equal(sectionChanges.maxItems, 12);
        assert.deepEqual(sectionChanges.items.required, [
            "section",
            "changeType",
            "originalText",
            "suggestedText",
            "reason",
        ]);
    });
});
