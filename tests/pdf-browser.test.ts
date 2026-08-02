import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { getLocalBrowserCandidates, findLocalBrowserExecutable, getPdfBrowserConfig } from "../src/lib/pdf-browser";

describe("PDF Browser Resolution Unit Tests", () => {
    test("1. getLocalBrowserCandidates returns environment override when set", () => {
        const originalEnv = process.env.CHROME_EXECUTABLE_PATH;
        try {
            process.env.CHROME_EXECUTABLE_PATH = "C:\\Custom\\Chrome\\chrome.exe";
            const candidates = getLocalBrowserCandidates();
            assert.deepEqual(candidates, ["C:\\Custom\\Chrome\\chrome.exe"]);
        } finally {
            if (originalEnv !== undefined) {
                process.env.CHROME_EXECUTABLE_PATH = originalEnv;
            } else {
                delete process.env.CHROME_EXECUTABLE_PATH;
            }
        }
    });

    test("2. getLocalBrowserCandidates returns platform-specific candidates when override is not set", () => {
        const originalEnv = process.env.CHROME_EXECUTABLE_PATH;
        delete process.env.CHROME_EXECUTABLE_PATH;
        try {
            const candidates = getLocalBrowserCandidates();
            assert.ok(Array.isArray(candidates));
            assert.ok(candidates.length > 0, "Should provide candidate paths for current OS");
        } finally {
            if (originalEnv !== undefined) {
                process.env.CHROME_EXECUTABLE_PATH = originalEnv;
            }
        }
    });

    test("3. findLocalBrowserExecutable executes safely without throwing exceptions", () => {
        const result = findLocalBrowserExecutable();
        assert.ok(result === null || typeof result === "string", "Result must be a string path or null");
    });

    test("4. getPdfBrowserConfig resolves valid launch options or clear error", async () => {
        try {
            const config = await getPdfBrowserConfig();
            assert.ok(config.executablePath, "Executable path should be defined");
            assert.ok(Array.isArray(config.args), "Args should be an array");
            assert.ok(config.defaultViewport, "Default viewport should be defined");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            assert.match(msg, /No valid Chromium browser executable found/i, "Actionable error message must be thrown if no executable is found");
        }
    });
});
