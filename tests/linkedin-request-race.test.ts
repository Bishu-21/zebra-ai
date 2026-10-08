import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { LinkedInOptimizer } from "../src/components/dashboard/LinkedInOptimizer";
import type { LinkedInAuditResult } from "../src/components/dashboard/LinkedInAuditResults";

const require = createRequire(import.meta.url);
const { JSDOM } = require("jsdom") as { JSDOM: new (html: string) => { window: Window & typeof globalThis } };
const result: LinkedInAuditResult = {
  rubricVersion: "test", persona: "professional", summary: "Synthetic audit", items: [],
  scores: { overall: null, categories: {} as LinkedInAuditResult["scores"]["categories"], assessed: 0, total: 45 },
};

test("a pending draft prevents another audit request, including form submission", async () => {
  const dom = new JSDOM("<div id='root'></div>");
  const previous = { window: globalThis.window, document: globalThis.document, fetch: globalThis.fetch };
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  let requests = 0;
  let resolve!: (response: Response) => void;
  globalThis.fetch = async () => { requests++; return new Promise<Response>(done => { resolve = done; }); };
  const root = createRoot(document.getElementById("root")!);
  try {
    await act(async () => root.render(createElement(LinkedInOptimizer, { initialResult: result, initialAuditId: "audit-a" })));
    const button = [...document.querySelectorAll("button")].find(item => item.textContent?.includes("Create reviewable drafts"))!;
    await act(async () => { button.click(); button.click(); });
    await act(async () => document.querySelector("form")!.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true })));
    assert.equal(requests, 1, "the audit must not start while drafts belong to the current audit");
    await act(async () => resolve(Response.json({ drafts: [] })));
    await act(async () => document.querySelector("form")!.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true })));
    assert.equal(requests, 2, "a completed draft request must release the audit action");
    await act(async () => resolve(Response.json({ error: "Synthetic failure" }, { status: 500 })));
  } finally {
    await act(async () => root.unmount());
    Object.assign(globalThis, previous);
  }
});

