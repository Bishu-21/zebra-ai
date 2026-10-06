import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateServerEnvironment } from "../src/lib/env";

describe("Server environment validation", () => {
    it("rejects incomplete production authentication configuration", () => {
        assert.throws(() => validateServerEnvironment({ NODE_ENV: "production" }), /DATABASE_URL.*BETTER_AUTH_SECRET.*trusted production origin/);
    });

    it("rejects partial provider and payment configurations", () => {
        assert.throws(() => validateServerEnvironment({ NODE_ENV: "test", AZURE_FOUNDRY_OPENAI_BASE_URL: "https://example.test/openai/v1/" }), /configured together/);
        assert.throws(() => validateServerEnvironment({ NODE_ENV: "test", NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_test" }), /configured together/);
    });

    it("requires the GitHub App values together and keeps the private key a PEM", () => {
        assert.throws(() => validateServerEnvironment({ NODE_ENV: "test", GITHUB_APP_ID: "123" }), /configured together/);
        assert.throws(() => validateServerEnvironment({
            NODE_ENV: "test",
            GITHUB_APP_ID: "123",
            GITHUB_APP_PRIVATE_KEY: "not-a-key",
            GITHUB_APP_SLUG: "zebra",
            GITHUB_WEBHOOK_SECRET: "secret",
        }), /PEM private key/);
        assert.doesNotThrow(() => validateServerEnvironment({
            NODE_ENV: "test",
            GITHUB_APP_ID: "123",
            GITHUB_APP_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\nABC\n-----END PRIVATE KEY-----",
            GITHUB_APP_SLUG: "zebra",
            GITHUB_WEBHOOK_SECRET: "secret",
        }));
    });

    it("accepts a complete production configuration", () => {
        assert.doesNotThrow(() => validateServerEnvironment({
            NODE_ENV: "production",
            DATABASE_URL: "postgres://example.invalid/db",
            BETTER_AUTH_SECRET: "x".repeat(32),
            BETTER_AUTH_URL: "https://zebra.example",
            GEMINI_API_KEY: "placeholder",
        }));
    });
});
