import assert from "node:assert/strict";
import test from "node:test";
import { validateJobDocument, validateJobText } from "../src/lib/job-document";

test("job document intake accepts a bounded PDF or text file", () => {
  assert.equal(validateJobDocument(new File(["x"], "role.pdf", { type: "application/pdf" })), null);
  assert.equal(validateJobDocument(new File(["x"], "role.txt", { type: "text/plain" })), null);
});

test("job document intake rejects unsupported, empty, and oversized files", () => {
  assert.match(validateJobDocument(new File(["x"], "role.html")) || "", /PDF or TXT/);
  assert.match(validateJobDocument(new File([], "role.pdf")) || "", /empty/);
  assert.match(validateJobDocument(new File([new Uint8Array(5 * 1024 * 1024 + 1)], "role.pdf")) || "", /5 MB/);
});

test("job text must be useful and bounded before analysis", () => {
  assert.match(validateJobText("Short") || "", /too little/);
  assert.equal(validateJobText("A job requirement. ".repeat(15)), null);
  assert.match(validateJobText("x".repeat(30_001)) || "", /30,000/);
});
