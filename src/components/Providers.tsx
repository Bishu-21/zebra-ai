"use client";

import React from "react";
import { ToastProvider } from "@/components/ui/Toast";
import { LazyMotion } from "framer-motion";

const loadFeatures = () =>
    import("@/lib/motion-features").then((res) => res.default);

const isIgnorableRejection = (reason: unknown) => {
    if (reason == null || reason === "") return true;

    if (typeof reason === "string") {
        return /(?:abort|cancel)(?:ed|led)?/i.test(reason);
    }

    if (reason instanceof DOMException) {
        return reason.name === "AbortError";
    }

    return reason instanceof Error && /(?:abort|cancel)(?:ed|led)?/i.test(reason.message);
};

const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    // Some browser/framework cancellation paths reject without a reason. They
    // are expected during navigation and should not trigger the dev overlay.
    if (isIgnorableRejection(event.reason)) {
        event.preventDefault();
    }
};

// Register before React mounts. A useEffect-only listener can miss rejections
// raised during hydration or while client modules are being loaded.
if (typeof window !== "undefined") {
    const rejectionKey = "__zebraUnhandledRejectionListenerInstalled";
    const runtime = window as Window & { [rejectionKey]?: boolean };

    if (!runtime[rejectionKey]) {
        window.addEventListener("unhandledrejection", handleUnhandledRejection);
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
