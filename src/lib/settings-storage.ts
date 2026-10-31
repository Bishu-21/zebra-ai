export const SETTINGS_STORAGE_KEY = "zebra_settings";

type SettingsStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function resolveStore(storage?: SettingsStore | null): SettingsStore | null {
    if (storage) return storage;
    try {
        if (typeof localStorage === "undefined") return null;
        return localStorage;
    } catch {
        return null;
    }
}

export function readSettingsRecord(storage?: SettingsStore | null): string | null {
    const store = resolveStore(storage);
    if (!store) return null;
    try {
        return store.getItem(SETTINGS_STORAGE_KEY);
    } catch {
        return null;
    }
}

export function writeSettingsRecord(record: unknown, storage?: SettingsStore | null): boolean {
    const store = resolveStore(storage);
    if (!store) return false;
    try {
        store.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(record));
        return true;
    } catch {
        return false;
    }
}

export function clearSettingsRecord(storage?: SettingsStore | null): boolean {
    const store = resolveStore(storage);
    if (!store) return false;
    try {
        store.removeItem(SETTINGS_STORAGE_KEY);
        return true;
    } catch {
        return false;
    }
}
