"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => undefined;

/** Returns false during SSR and true once React is running in the browser. */
export function useHydrated() {
    return useSyncExternalStore(subscribe, () => true, () => false);
}
