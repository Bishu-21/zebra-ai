"use client";

import { Suspense, useState } from "react";
import { SettingsProvider } from "@/context/SettingsContext";
import { SettingsModal } from "@/components/dashboard/SettingsModal";
import { SettingsView } from "@/components/dashboard/SettingsView";
import { ToastProvider } from "@/components/ui/Toast";
import { featureChrome } from "@/components/dashboard/feature-chrome";

export function SettingsCheckClient() {
    const [open, setOpen] = useState(false);

    return (
        <SettingsProvider>
            <ToastProvider>
                <div className="min-h-screen bg-[#FAF9F6] p-4 font-sans">
                    <p data-testid="preferences-state">{open ? "open" : "closed"}</p>
                    <button
                        type="button"
                        data-testid="open-preferences"
                        className={featureChrome.primaryButton}
                        onClick={() => setOpen(true)}
                    >
                        Open preferences
                    </button>
                    <SettingsModal isOpen={open} onCloseAction={() => setOpen(false)} />
                    <Suspense fallback={<p>Loading settings</p>}>
                        <SettingsView
                            connectionProviders={{ linkedin: false, github: false }}
                            githubAppConfigured={false}
                        />
                    </Suspense>
                </div>
            </ToastProvider>
        </SettingsProvider>
    );
}
