import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PRODUCT_CAPABILITIES, isCapabilityExposed } from "../src/lib/capabilities";

describe("Product capability registry", () => {
    it("does not expose unimplemented DOCX export", () => {
        assert.equal(PRODUCT_CAPABILITIES.docxExport.status, "hidden");
        assert.equal(PRODUCT_CAPABILITIES.docxExport.route, null);
        assert.equal(isCapabilityExposed(PRODUCT_CAPABILITIES.docxExport), false);
    });

    it("uses factual language and records ownership and verification evidence", () => {
        for (const capability of Object.values(PRODUCT_CAPABILITIES)) {
            assert.ok(capability.owner);
            assert.ok(capability.evidence);
            assert.doesNotMatch(capability.userLanguage, /guaranteed|verified|100%|docx/i);
        }
    });
});
