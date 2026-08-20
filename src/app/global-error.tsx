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
            <body className="bg-[#FAFAFA] font-sans antialiased min-h-screen flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white border border-black/10 rounded-2xl shadow-2xl p-8 text-center space-y-6">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 15c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-xl font-black text-[#171717] tracking-tight">
                            {isTransient ? "Reconnecting" : "Something went wrong"}
                        </h2>
                        <p className="text-sm text-[#737373] leading-relaxed">
                            {isTransient
                                ? "The development server restarted or the navigation stream was interrupted. Retrying this page now."
                                : "The Zebra AI workspace encountered an unexpected error. You can retry the request without losing your saved data."}
                        </p>
                        {error?.message && (
                            <div className="mt-4 p-3 bg-black/5 rounded-lg text-left">
                                <p className="text-[10px] font-mono text-black/40 uppercase tracking-widest mb-1">Stack Trace Fragment</p>
                                <p className="text-[11px] font-mono text-red-500/80 break-all">
                                    {process.env.NODE_ENV === "production"
                                        ? "System execution halted. Details logged internally."
                                        : error.message}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 flex flex-col gap-3">
                        <button
                            onClick={() => retry()}
                            className="w-full h-12 bg-black hover:bg-zinc-900 text-white rounded-xl font-bold transition-all active:scale-[0.98] shadow-lg shadow-black/10"
                        >
                            Retry Now
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full h-12 border border-black/10 hover:border-black/20 text-[#737373] rounded-xl font-bold transition-all"
                        >
                            Hard Reload
                        </button>
                    </div>

                    <p className="text-[10px] font-bold text-black/20 uppercase tracking-[0.2em]">Zebra AI · System Stability Unit</p>
                </div>
            </body>
        </html>
    );
}
