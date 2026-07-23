"use client";

import React, { useEffect } from "react";
import { ToastProvider } from "@/components/ui/Toast";
import { LazyMotion } from "framer-motion";

const loadFeatures = () => import("@/lib/motion-features").then((res) => res.default);

export function Providers({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            // Prevent unhandled promise rejection errors with undefined/null reasons from crashing or logging in browser/Next.js overlay
            if (event.reason === undefined || event.reason === null || event.reason === "") {
                event.preventDefault();
            } else if (typeof event.reason === 'string' && (event.reason.includes('aborted') || event.reason.includes('Canceled'))) {
                event.preventDefault();
            }
        };

        window.addEventListener("unhandledrejection", handleUnhandledRejection);
        return () => window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    }, []);

    return (
        <LazyMotion features={loadFeatures} strict>
            <ToastProvider>
                {children}
            </ToastProvider>
        </LazyMotion>
    );
}
