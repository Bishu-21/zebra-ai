import assert from "node:assert/strict";
import test from "node:test";
import { LIVE_HANDSHAKE_TIMEOUT_MS, TOKEN_REQUEST_TIMEOUT_MS } from "../src/lib/zebu-live-startup";

test("Gemini Live startup permits a slow token request and handshake", () => {
  assert.ok(TOKEN_REQUEST_TIMEOUT_MS >= 30_000);
  assert.ok(LIVE_HANDSHAKE_TIMEOUT_MS >= 25_000);
});
