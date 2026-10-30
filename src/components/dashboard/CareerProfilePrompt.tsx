"use client";

import { useCallback, useState } from "react";
import { CareerProfileForm } from "./CareerProfileForm";
import { featureChrome } from "@/components/dashboard/feature-chrome";
import { useDialogFocus } from "@/hooks/useDialogFocus";

export function CareerProfilePrompt({ shouldPrompt }: { shouldPrompt: boolean }) {
    const [open, setOpen] = useState(shouldPrompt);
    const dismiss = useCallback(() => {
        setOpen(false);
        void fetch("/api/profile/career", { method: "DELETE" }).catch(() => undefined);
    }, []);
    const dialogRef = useDialogFocus<HTMLDivElement>(open, dismiss);
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className={featureChrome.backdrop} onClick={dismiss} />
            <div
                ref={dialogRef}
                className={`${featureChrome.dialog} z-10 max-w-xl p-6 sm:p-8`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="career-profile-title"
            >
                <h2 id="career-profile-title" className="text-2xl font-bold tracking-tight text-black">Personalize Zebra once</h2>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                    Tell us where you are in your career so resume scores compare you with the right expectations. You can change this later in Settings.
                </p>
                <div className="mt-6">
                    <CareerProfileForm onSaved={() => setOpen(false)} compact />
                </div>
                <button type="button" onClick={dismiss} className="mt-5 text-xs font-semibold text-neutral-500 hover:text-black">
                    Not now - do not remind me again
                </button>
            </div>
        </div>
    );
}
