import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { getAuthBaseURL, getTrustedOrigins, auth, ACCOUNT_LINKING, buildSocialProviders } from "../src/lib/auth";
import { SIGN_IN_SOCIAL_PROVIDERS } from "../src/lib/auth-providers";

describe("Better Auth Environment & Origin Configuration [Unit Test]", () => {
    let origEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
        origEnv = { ...process.env };
    });

    afterEach(() => {
        process.env = origEnv;
    });

    describe("1. Base URL Resolution (getAuthBaseURL)", () => {
        test("1.1 Prioritizes BETTER_AUTH_URL when explicitly set", () => {
            delete process.env.NEXT_PUBLIC_APP_URL;
            delete process.env.VERCEL_URL;
            process.env.BETTER_AUTH_URL = "https://zebra-ai.example.com/";

            const url = getAuthBaseURL();
            assert.strictEqual(url, "https://zebra-ai.example.com");
        });

        test("1.2 Uses NEXT_PUBLIC_APP_URL when BETTER_AUTH_URL is missing", () => {
            delete process.env.BETTER_AUTH_URL;
            delete process.env.VERCEL_URL;
            process.env.NEXT_PUBLIC_APP_URL = "https://app.zebra.ai";

            const url = getAuthBaseURL();
            assert.strictEqual(url, "https://app.zebra.ai");
        });

        test("1.3 Formats VERCEL_URL as https:// when BETTER_AUTH_URL is missing", () => {
            delete process.env.BETTER_AUTH_URL;
            delete process.env.NEXT_PUBLIC_APP_URL;
            process.env.VERCEL_URL = "zebra-ai-git-feature-branch.vercel.app";

            const url = getAuthBaseURL();
            assert.strictEqual(url, "https://zebra-ai-git-feature-branch.vercel.app");
        });

        test("1.4 Falls back to http://localhost:3000 for local development", () => {
            delete process.env.BETTER_AUTH_URL;
            delete process.env.NEXT_PUBLIC_APP_URL;
            delete process.env.VERCEL_URL;

            const url = getAuthBaseURL();
            assert.strictEqual(url, "http://localhost:3000");
        });

        test("1.5 refuses a localhost fallback in production", () => {
            delete process.env.BETTER_AUTH_URL;
            delete process.env.NEXT_PUBLIC_APP_URL;
            delete process.env.VERCEL_URL;
            (process.env as Record<string, string | undefined>).NODE_ENV = "production";

            assert.throws(() => getAuthBaseURL(), /must be configured in production/);
        });
    });

    describe("2. Trusted Origins Resolution (getTrustedOrigins)", () => {
        test("2.1 Includes base URL and parses comma-separated BETTER_AUTH_TRUSTED_ORIGINS", () => {
            process.env.BETTER_AUTH_URL = "https://zebra.ai";
            process.env.BETTER_AUTH_TRUSTED_ORIGINS = "https://admin.zebra.ai, https://staging.zebra.ai/";

            const origins = getTrustedOrigins();
            assert.ok(origins.includes("https://zebra.ai"));
            assert.ok(origins.includes("https://admin.zebra.ai"));
            assert.ok(origins.includes("https://staging.zebra.ai"));
        });

        test("2.2 Includes Vercel preview & production URLs when present", () => {
            process.env.BETTER_AUTH_URL = "https://zebra.ai";
            process.env.VERCEL_URL = "zebra-ai-preview.vercel.app";
            process.env.VERCEL_PROJECT_PRODUCTION_URL = "zebra-ai.vercel.app";

            const origins = getTrustedOrigins();
            assert.ok(origins.includes("https://zebra-ai-preview.vercel.app"));
            assert.ok(origins.includes("https://zebra-ai.vercel.app"));
        });
    });

    describe("3. Better Auth Options Verification", () => {
        test("3.1 Auth instance options contain explicit string baseURL", () => {
            assert.ok(auth.options.baseURL);
            assert.strictEqual(typeof auth.options.baseURL, "string");
            assert.match(auth.options.baseURL, /^https?:\/\//);
        });

        test("3.2 Session expiry and update age configuration", () => {
            assert.strictEqual(auth.options.session?.expiresIn, 60 * 60 * 24 * 7);
            assert.strictEqual(auth.options.session?.updateAge, 60 * 60 * 24);
        });

        test("3.3 OAuth state does not require a database write before redirect", () => {
            assert.strictEqual(auth.options.account?.storeStateStrategy, "cookie");
        });

        test("3.4 sign-in stays Google-only and linking trusts exactly LinkedIn and GitHub", () => {
            assert.deepEqual([...SIGN_IN_SOCIAL_PROVIDERS], ["google"]);
            const form = readFileSync(new URL("../src/components/auth/AuthForm.tsx", import.meta.url), "utf8");
            assert.match(form, /SignInSocialProvider/);
            assert.match(form, /handleSocialSignIn\("google"\)/);
            assert.doesNotMatch(form, /handleSocialSignIn\("(linkedin|github)"\)/);
            const providers = buildSocialProviders({
                GOOGLE_CLIENT_ID: "g",
                GOOGLE_CLIENT_SECRET: "gs",
                LINKEDIN_CLIENT_ID: "l",
                LINKEDIN_CLIENT_SECRET: "ls",
                GITHUB_CLIENT_ID: "gh",
                GITHUB_CLIENT_SECRET: "ghs",
            });
            assert.deepEqual(Object.keys(providers).sort(), ["github", "google", "linkedin"]);
            assert.equal(providers.linkedin?.disableSignUp, true);
            assert.equal(providers.github?.disableSignUp, true);
            assert.equal("disableSignUp" in (providers.google ?? {}), false);
            assert.deepEqual(providers.github?.scope, ["read:user", "user:email"]);
            assert.equal(providers.github?.disableDefaultScope, true);
            assert.equal(auth.options.account?.accountLinking?.enabled, true);
            assert.equal(auth.options.account?.accountLinking?.disableImplicitLinking, true);
            assert.equal(auth.options.account?.accountLinking?.updateUserInfoOnLink, false);
            assert.deepEqual(auth.options.account?.accountLinking?.trustedProviders, ["linkedin", "github"]);
            assert.deepEqual([...ACCOUNT_LINKING.trustedProviders], ["linkedin", "github"]);
        });
    });

});
