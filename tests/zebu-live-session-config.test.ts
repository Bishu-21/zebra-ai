import assert from "node:assert/strict";
import test from "node:test";
import { buildZebuSessionContinuity } from "../src/lib/zebu-live-session-config";

test("new Live sessions use compression and request resumable state", () => {
  assert.deepEqual(buildZebuSessionContinuity(), {
    contextWindowCompression: { slidingWindow: {} },
    sessionResumption: {},
  });
});

test("a saved handle resumes only when it is bounded and nonempty", () => {
  assert.deepEqual(buildZebuSessionContinuity("handle-1").sessionResumption, { handle: "handle-1" });
  assert.deepEqual(buildZebuSessionContinuity(" ").sessionResumption, {});
  assert.throws(() => buildZebuSessionContinuity("x".repeat(8_193)));
});
