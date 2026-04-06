"use client";

import React from "react";
import { ToastProvider } from "@/components/ui/Toast";
import { LazyMotion } from "framer-motion";

const loadFeatures = () => import("@/lib/motion-features").then((res) => res.default);

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <LazyMotion features={loadFeatures} strict>
            <ToastProvider>
                {children}
            </ToastProvider>
        </LazyMotion>
    );
}
