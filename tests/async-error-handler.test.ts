import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { getErrorMessage, isRetryableError } from "../src/lib/async-error-handler";

describe("Async Error Handler Unit Tests", () => {
    test("1. Formats standard Error instances and fallback messages cleanly", () => {
        assert.equal(getErrorMessage(new Error("Database timeout")), "Database timeout");
        assert.equal(getErrorMessage("Direct error string"), "Direct error string");
        assert.equal(getErrorMessage(null, "Fallback error"), "Fallback error");
        assert.equal(getErrorMessage(undefined, "Default message"), "Default message");
    });

    test("2. Formats network and fetch errors cleanly", () => {
        const netErr = new TypeError("Failed to fetch");
        assert.equal(getErrorMessage(netErr), "Network connection error. Please check your connection and retry.");

        const customNetErr = new Error("NetworkError when attempting to fetch resource.");
        assert.equal(getErrorMessage(customNetErr), "Network connection error. Please check your connection and retry.");
    });

    test("3. Accurately determines retryable error types", () => {
        assert.equal(isRetryableError(new TypeError("Failed to fetch")), true);
        assert.equal(isRetryableError("High traffic detected, please try again"), true);
        assert.equal(isRetryableError("Connection reset by peer"), true);
        assert.equal(isRetryableError("Invalid credit card number"), false);
    });
});
