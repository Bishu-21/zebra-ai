import assert from "node:assert/strict";
import test from "node:test";
import { selectJobDescription, fallbackJobFields } from "../src/lib/job-description-source";

test("job import preserves long source descriptions rather than model summaries", () => {
  const source = `Responsibilities\n${"Build accessible software. ".repeat(260)}\nRequirements\nTypeScript and testing.`;
  const selected = selectJobDescription(source);
  assert.equal(selected, source.trim());
  assert.match(selected, /Requirements\nTypeScript and testing/);
});

test("job import rejects empty and oversized source text instead of silently clipping", () => {
  assert.throws(() => selectJobDescription("Apply now"), /too little/);
  assert.throws(() => selectJobDescription("x".repeat(100_001)), /too long/);
});

test("job import can use page metadata when AI field extraction fails", () => {
  assert.deepEqual(fallbackJobFields({ h1: "Senior Engineer", title: "Senior Engineer | Example", ogSiteName: "Example" }), {
    company: "Example", position: "Senior Engineer", salary: "", location: "", jobType: "",
  });
  assert.equal(fallbackJobFields({ h1: null, title: null, ogSiteName: null }).position, "");
});
