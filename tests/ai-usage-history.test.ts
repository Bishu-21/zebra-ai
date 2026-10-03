import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { presentAiUsageEntry } from "../src/lib/ai-usage-history";

describe("AI usage history presentation", () => {
    test("returns only the fields the settings UI needs", () => {
        const entry = presentAiUsageEntry({
            id: "usage-1",
            operationName: "resume_audit",
            provider: "azure-foundry",
            creditsCost: 2,
            status: "success",
            createdAt: new Date("2026-09-20T10:30:00.000Z"),
        });

        assert.deepEqual(entry, {
            id: "usage-1",
            operation: "Resume audit",
            provider: "Azure Foundry",
            credits: 2,
            status: "success",
            createdAt: "2026-09-20T10:30:00.000Z",
        });
    });

    test("uses honest fallbacks for missing provider and unfamiliar operation names", () => {
        const entry = presentAiUsageEntry({
            id: "usage-2",
            operationName: "custom_task_v2",
            provider: null,
            creditsCost: 1,
            status: "failed",
            createdAt: new Date("2026-09-19T08:00:00.000Z"),
        });

        assert.equal(entry.operation, "Custom task v2");
        assert.equal(entry.provider, "Not recorded");
        assert.equal(entry.status, "failed");
    });
});
