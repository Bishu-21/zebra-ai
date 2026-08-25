"use client";

import { useState } from "react";
import { CareerProfileForm } from "./CareerProfileForm";

export function CareerProfilePrompt({ shouldPrompt }: { shouldPrompt: boolean }) {
    const [open, setOpen] = useState(shouldPrompt);
    if (!open) return null;

    async function dismiss() {
        setOpen(false);
        await fetch("/api/profile/career", { method: "DELETE" }).catch(() => undefined);
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="career-profile-title">
            <div className="w-full max-w-xl rounded-3xl border border-neutral-200 bg-white p-6 shadow-2xl sm:p-8">
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
