import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

const upload = readFileSync("src/app/api/resumes/upload/route.ts", "utf8");
const importRaw = readFileSync("src/app/api/resumes/import-raw/route.ts", "utf8");
const analyse = readFileSync("src/app/api/ai/analyse/route.ts", "utf8");
const faq = readFileSync("src/data/faq.ts", "utf8");
const plans = readFileSync("src/lib/constants/plans.ts", "utf8");

describe("resume save and pack honesty", () => {
    test("saving a resume does not reserve credits", () => {
        assert.doesNotMatch(upload, /reserveUserCredits/);
        assert.doesNotMatch(importRaw, /reserveUserCredits/);
        assert.match(upload, /No credit was used/);
        assert.match(importRaw, /No credit was used/);
        assert.match(analyse, /reserveUserCredits/);
    });

    test("paid packs are 10/99, 50/400, and 100/800 without animal names", () => {
        assert.match(plans, /credits: 10/);
        assert.match(plans, /priceInINR: 99/);
        assert.match(plans, /credits: 50/);
        assert.match(plans, /priceInINR: 400/);
        assert.match(plans, /credits: 100/);
        assert.match(plans, /priceInINR: 800/);
        assert.doesNotMatch(plans, /Plains|Mountain|Grevy/);
        assert.match(faq, /10 for ₹99, 50 for ₹400, 100 for ₹800/);
    });
});
