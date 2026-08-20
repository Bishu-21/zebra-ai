import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
    isExpectedRequestAbort,
    isTransientNavigationError,
} from "../src/lib/error-classification";

describe("Error classification", () => {
    test("classifies closed response streams as expected request aborts", () => {
        assert.equal(isExpectedRequestAbort(new Error("The destination stream closed early.")), true);
        assert.equal(isExpectedRequestAbort(new DOMException("This operation was aborted", "AbortError")), true);
    });

    test("classifies browser network and chunk failures as transient", () => {
        assert.equal(isTransientNavigationError(new Error("network error")), true);
        assert.equal(isTransientNavigationError(new Error("Loading chunk 123 failed")), true);
    });

    test("does not hide application exceptions", () => {
        assert.equal(isExpectedRequestAbort(new Error("Database constraint violated")), false);
        assert.equal(isTransientNavigationError(new Error("Database constraint violated")), false);
    });
});
