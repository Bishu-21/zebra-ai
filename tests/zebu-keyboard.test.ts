import assert from "node:assert/strict";
import { test } from "node:test";
import { createZebuKeyboardHandlers } from "../src/lib/zebu-keyboard";

function fixture() {
  const calls: string[] = [];
  const handlers = createZebuKeyboardHandlers({
    isOpen: true,
    toggle: () => calls.push("toggle"),
    close: () => calls.push("close"),
    primeAudio: () => calls.push("prime"),
    startListening: () => { calls.push("start"); },
    stopListening: () => calls.push("stop"),
  });
  return { calls, handlers };
}

function key(overrides: Partial<KeyboardEvent> = {}): KeyboardEvent {
  return { code: "Space", repeat: false, defaultPrevented: false, preventDefault() {}, ...overrides } as KeyboardEvent;
}

test("typing Space and releasing it never stops an unrelated voice session", () => {
  const { calls, handlers } = fixture();
  const target = { closest: () => ({ tagName: "INPUT" }) } as unknown as EventTarget;
  handlers.down(key({ target }));
  handlers.up(key({ target }));
  assert.deepEqual(calls, []);
});

test("Space on an interactive control retains the control's native behavior", () => {
  const { calls, handlers } = fixture();
  const target = { closest: () => ({ tagName: "BUTTON" }) } as unknown as EventTarget;
  handlers.down(key({ target }));
  handlers.up(key({ target }));
  assert.deepEqual(calls, []);
});

test("held Space starts once and releasing it stops once", () => {
  const { calls, handlers } = fixture();
  handlers.down(key());
  handlers.down(key({ repeat: true }));
  handlers.up(key());
  handlers.up(key());
  assert.deepEqual(calls, ["prime", "start", "stop"]);
});

test("leaving the window releases a held microphone shortcut", () => {
  const { calls, handlers } = fixture();
  handlers.down(key());
  handlers.release();
  handlers.up(key());
  assert.deepEqual(calls, ["prime", "start", "stop"]);
});

test("modifier and already-handled Space shortcuts do not capture audio", () => {
  const { calls, handlers } = fixture();
  for (const modifier of [{ ctrlKey: true }, { altKey: true }, { metaKey: true }, { defaultPrevented: true }, { isComposing: true }]) {
    handlers.down(key(modifier));
  }
  handlers.up(key());
  assert.deepEqual(calls, []);
});

test("Escape releases a held shortcut and closes Zebu", () => {
  const { calls, handlers } = fixture();
  handlers.down(key());
  handlers.down(key({ code: "Escape" }));
  assert.deepEqual(calls, ["prime", "start", "stop", "close"]);
});
