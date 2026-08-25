import assert from "node:assert/strict";
import test from "node:test";
import { withZebuTimeout, ZebuLiveTimeoutError } from "../src/lib/zebu-live-timeout";

test("Zebu live timeout returns successful operations", async () => {
  assert.equal(await withZebuTimeout(Promise.resolve("ready"), 50, "too slow"), "ready");
});

test("Zebu live timeout rejects a stalled operation and runs timeout cleanup", async () => {
  let cleanedUp = false;
  await assert.rejects(
    withZebuTimeout(new Promise<never>(() => undefined), 5, "too slow", { onTimeout: () => { cleanedUp = true; } }),
    (error: unknown) => error instanceof ZebuLiveTimeoutError && error.message === "too slow",
  );
  assert.equal(cleanedUp, true);
});

test("Zebu live timeout cleans up an operation that resolves after its deadline", async () => {
  let resolveLate: (value: string) => void = () => undefined;
  let lateValue = "";
  const operation = new Promise<string>((resolve) => { resolveLate = resolve; });
  const result = withZebuTimeout(operation, 5, "too slow", { onLateResolve: (value) => { lateValue = value; } });
  await assert.rejects(result, ZebuLiveTimeoutError);
  resolveLate("late");
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(lateValue, "late");
});
