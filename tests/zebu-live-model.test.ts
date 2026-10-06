import assert from "node:assert/strict";
import test from "node:test";
import { ZEBU_LIVE_MODEL } from "../src/lib/zebu-live-prompt";

test("Zebu's default Live model uses the account-verified 3.8 voice deployment", () => {
  if (process.env.GEMINI_LIVE_MODEL) return;
  assert.equal(ZEBU_LIVE_MODEL, "gemini-3.8-live");
});
