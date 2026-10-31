import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("LinkedIn audit migration enforces owner-scoped row security", () => {
  const sql = readFileSync(new URL("../drizzle/0013_linkedin_workflow_rls.sql", import.meta.url), "utf8");
  assert.match(sql, /ENABLE ROW LEVEL SECURITY/);
  assert.match(sql, /FORCE ROW LEVEL SECURITY/);
  assert.match(sql, /current_setting\('app\.user_id', true\)/);
  assert.match(sql, /WITH CHECK/);
});
