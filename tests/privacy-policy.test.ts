import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const privacy = readFileSync("src/app/privacy/page.tsx", "utf8");
const terms = readFileSync("src/app/terms/page.tsx", "utf8");

test("privacy policy describes implemented data flows without invented certifications", () => {
    assert.match(privacy, /Zebu/);
    assert.match(privacy, /Zebu typed replies prefer Google Gemini/);
    assert.match(privacy, /Gemini Live/);
    assert.match(privacy, /Razorpay/);
    assert.match(privacy, /Self-service account deletion is not implemented/);
    assert.match(privacy, /owner configuration fact/);
    assert.doesNotMatch(privacy, /SOC 2|ISO 27001|GDPR certified|we never train/);
    assert.doesNotMatch(privacy, /industry-standard security measures/);
});

test("terms describe applications, Zebu, and LinkedIn limits", () => {
    assert.match(terms, /Original resumes stay intact/);
    assert.match(terms, /Zebu typed replies prefer Gemini/);
    assert.match(terms, /Zebu/);
    assert.match(terms, /does not post to LinkedIn/);
    assert.match(terms, /DOCX export is not available/);
});
