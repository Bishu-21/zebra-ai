"use client";

import React from "react";
import { ToastProvider } from "@/components/ui/Toast";
import { LazyMotion } from "framer-motion";

const loadFeatures = () =>
    import("@/lib/motion-features").then((res) => res.default);

const isIgnorableRejection = (reason: unknown) => {
    if (reason == null || reason === "" || reason === undefined) return true;

    if (typeof reason === "string") {
        return /(?:abort|cancel)(?:ed|led)?/i.test(reason);
    }

    if (reason instanceof DOMException) {
        return reason.name === "AbortError";
    }

    return reason instanceof Error && /(?:abort|cancel)(?:ed|led)?/i.test(reason.message);
};

const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    // Some browser/framework cancellation paths and background auth checks reject without a reason.
    // Prevent dev server / browser noise for benign aborted rejections.
    if (isIgnorableRejection(event.reason)) {
        event.preventDefault();
        if (typeof event.stopImmediatePropagation === "function") {
            event.stopImmediatePropagation();
        }
    }
};

// Register before React mounts with capture phase (true) to prevent unhandled rejection overlays.
if (typeof window !== "undefined") {
    const rejectionKey = "__zebraUnhandledRejectionListenerInstalled";
    const runtime = window as Window & { [rejectionKey]?: boolean };

    if (!runtime[rejectionKey]) {
        window.addEventListener("unhandledrejection", handleUnhandledRejection, true);
        runtime[rejectionKey] = true;
    }
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <LazyMotion features={loadFeatures} strict>
            <ToastProvider>
                {children}
            </ToastProvider>
        </LazyMotion>
    );
}
