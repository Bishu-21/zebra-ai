import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
    SETTINGS_STORAGE_KEY,
    clearSettingsRecord,
    readSettingsRecord,
    writeSettingsRecord,
} from "../src/lib/settings-storage";

function memoryStore(initial: Record<string, string> = {}) {
    const data = { ...initial };
    return {
        getItem(key: string) {
            return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
        },
        setItem(key: string, value: string) {
            data[key] = value;
        },
        removeItem(key: string) {
            delete data[key];
        },
        snapshot() {
            return { ...data };
        },
    };
}

describe("settings storage", () => {
    test("writes and reads a JSON record", () => {
        const store = memoryStore();
        assert.equal(writeSettingsRecord({ fontSize: "16px" }, store), true);
        assert.equal(readSettingsRecord(store), JSON.stringify({ fontSize: "16px" }));
        assert.equal(clearSettingsRecord(store), true);
        assert.equal(readSettingsRecord(store), null);
        assert.equal(store.snapshot()[SETTINGS_STORAGE_KEY], undefined);
    });

    test("returns false when the store rejects the write", () => {
        const store = {
            getItem() {
                return null;
            },
            setItem() {
                throw new Error("quota");
            },
            removeItem() {
                throw new Error("quota");
            },
        };
        assert.equal(writeSettingsRecord({ fontSize: "16px" }, store), false);
        assert.equal(clearSettingsRecord(store), false);
    });
});
