import { test, describe, before, after } from "node:test";
import assert from "node:assert";
import { validateUrlForSsrf } from "../src/lib/ssrf";
import { checkRateLimit, clearRateLimits } from "../src/lib/rate-limit";
import { reserveUserCredits, refundUserCredits } from "../src/lib/credit-policy";
import { validateUploadedFile, MAX_RESUME_FILE_SIZE_BYTES } from "../src/lib/upload-safety";
import { testStore } from "../src/lib/test-store";

describe("Production Safety & Reliability Test Suite [Unit Test]", () => {

    before(() => {
        clearRateLimits();
    });

    after(() => {
        clearRateLimits();
        testStore.clear();
        delete process.env.TEST_AUTH_USER_ID;
    });

    describe("1. SSRF Protection Security Controls", () => {
        test("1.1 Rejects loopback address (127.0.0.1)", () => {
            const res = validateUrlForSsrf("http://127.0.0.1/internal/admin");
            assert.strictEqual(res.valid, false);
            assert.match(String(res.error), /internal, private, or metadata/i);
        });

        test("1.2 Rejects cloud metadata service IP (169.254.169.254)", () => {
            const res = validateUrlForSsrf("http://169.254.169.254/latest/meta-data/");
            assert.strictEqual(res.valid, false);
            assert.match(String(res.error), /internal, private, or metadata/i);
        });

        test("1.3 Rejects localhost domain", () => {
            const res = validateUrlForSsrf("http://localhost:3000/api/secret");
            assert.strictEqual(res.valid, false);
        });

        test("1.4 Rejects non-HTTP protocols (file://, ftp://)", () => {
            const resFile = validateUrlForSsrf("file:///etc/passwd");
            assert.strictEqual(resFile.valid, false);

            const resFtp = validateUrlForSsrf("ftp://files.example.com/dump");
            assert.strictEqual(resFtp.valid, false);
        });

        test("1.5 Accepts valid public HTTPS job listing URLs", () => {
            const res = validateUrlForSsrf("https://stripe.com/jobs/careers");
            assert.strictEqual(res.valid, true);
            assert.ok(res.url);
            assert.strictEqual(res.url.hostname, "stripe.com");
        });
    });

    describe("2. Rate Limiting Boundary Controls", () => {
        test("2.1 Enforces sliding-window request limit", () => {
            const key = "test-rate-user-1";
            clearRateLimits();

            // First 3 requests allowed (limit 3)
            assert.strictEqual(checkRateLimit(key, 3, 60000).success, true);
            assert.strictEqual(checkRateLimit(key, 3, 60000).success, true);
            assert.strictEqual(checkRateLimit(key, 3, 60000).success, true);

            // 4th request MUST be rejected
            const rejected = checkRateLimit(key, 3, 60000);
            assert.strictEqual(rejected.success, false);
            assert.strictEqual(rejected.remaining, 0);
        });
    });

    describe("3. Credit Reservation & Automatic Refund Controls", () => {
        test("3.1 Reserves credits and handles refund on failure", async () => {
            const userId = "usr_safety_test";
            process.env.TEST_AUTH_USER_ID = userId;

            // Reserve credits
            const reserved = await reserveUserCredits(userId, 1);
            assert.strictEqual(reserved.success, true);

            // Refund credits on failure
            const refunded = await refundUserCredits(userId, 1);
            assert.strictEqual(refunded, true);
        });
    });

    describe("4. Upload File Safety & MIME Controls", () => {
        test("4.1 Accepts valid PDF file under size limit", () => {
            const res = validateUploadedFile(1024 * 1024, "application/pdf", "resume.pdf");
            assert.strictEqual(res.valid, true);
        });

        test("4.2 Rejects disallowed executable MIME types (.exe)", () => {
            const res = validateUploadedFile(1024, "application/x-executable", "malware.exe");
            assert.strictEqual(res.valid, false);
            assert.match(String(res.error), /Unsupported file type/i);
        });

        test("4.3 Rejects oversized payloads (> 10MB)", () => {
            const res = validateUploadedFile(MAX_RESUME_FILE_SIZE_BYTES + 1, "application/pdf", "large.pdf");
            assert.strictEqual(res.valid, false);
            assert.match(String(res.error), /exceeds the maximum permitted limit/i);
        });
    });

});
