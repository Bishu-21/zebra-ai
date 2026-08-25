"use client";

import React from "react";
import { ToastProvider } from "@/components/ui/Toast";
import { domAnimation, LazyMotion } from "framer-motion";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <LazyMotion features={domAnimation} strict>
            <ToastProvider>
                {children}
            </ToastProvider>
        </LazyMotion>
    );
}
