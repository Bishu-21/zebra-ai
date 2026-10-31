"use client";

import { useEffect } from "react";
import { isTransientNavigationError } from "@/lib/error-classification";

export default function GlobalError(props: { error: Error & { digest?: string }; retry: () => void }) {
    const { error, retry } = props;
    const isTransient = isTransientNavigationError(error);

    useEffect(() => {
        if (!isTransient) {
            console.error("Global Workspace Error:", error);
            return;
        }

        const retryKey = `zebra-transient-retry:${window.location.pathname}:${error.digest || error.message}`;
        try {
            if (sessionStorage.getItem(retryKey)) return;
            sessionStorage.setItem(retryKey, "1");
        } catch {
            // Storage can be unavailable in hardened/private browser contexts.
        }

        const retryTimer = window.setTimeout(() => retry(), 300);
        return () => window.clearTimeout(retryTimer);
    }, [error, isTransient, retry]);

    return (
        <html lang="en">
            <body className="min-h-screen bg-[#FAFAFA] p-6 font-sans antialiased flex items-center justify-center">
                <div className="w-full max-w-md space-y-6 rounded-2xl border border-neutral-200 bg-white p-8 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 15c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-xl font-semibold tracking-tight text-[#171717]">
                            {isTransient ? "Reconnecting" : "Zebra could not load"}
                        </h1>
                        <p className="text-sm leading-6 text-[#737373]">
                            {isTransient
                                ? "The page was interrupted, often when the development server restarts. Retrying now."
                                : "An unexpected error stopped this page. Saved account data is still in your workspace. You can retry or reload."}
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => retry()}
                            className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-black text-sm font-semibold text-white hover:bg-zinc-900"
                        >
                            Try again
                        </button>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-neutral-200 text-sm font-semibold text-[#737373] hover:border-neutral-300"
                        >
                            Reload page
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
