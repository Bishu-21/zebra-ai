"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type CreditsSnapshot = { credits: number; plan: string };

type CreditsContextValue = CreditsSnapshot & {
    setCredits: (credits: number) => void;
    refreshCredits: () => Promise<void>;
};

const CreditsContext = createContext<CreditsContextValue | null>(null);

export function announceCreditsChanged(remaining?: number) {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("credits-changed", { detail: { remaining } }));
}

export function CreditsProvider({
    credits,
    plan,
    children,
}: {
    credits: number;
    plan: string;
    children: ReactNode;
}) {
    const [snapshot, setSnapshot] = useState<CreditsSnapshot>({ credits, plan });
    const [serverSnapshot, setServerSnapshot] = useState<CreditsSnapshot>({ credits, plan });
    if (serverSnapshot.credits !== credits || serverSnapshot.plan !== plan) {
        setServerSnapshot({ credits, plan });
        setSnapshot({ credits, plan });
    }

    const refreshCredits = useCallback(async () => {
        try {
            const response = await fetch("/api/credits", { cache: "no-store" });
            if (!response.ok) return;
            const body = await response.json() as { credits?: number; plan?: string };
            const nextCredits = body.credits;
            const nextPlan = body.plan;
            if (typeof nextCredits === "number") {
                setSnapshot((current) => ({
                    credits: nextCredits,
                    plan: typeof nextPlan === "string" && nextPlan ? nextPlan : current.plan,
                }));
            }
        } catch {
            // Keep the last known balance if the refresh fails.
        }
    }, []);

    useEffect(() => {
        const onChanged = (event: Event) => {
            const remaining = (event as CustomEvent<{ remaining?: number }>).detail?.remaining;
            if (typeof remaining === "number") {
                setSnapshot((current) => ({ ...current, credits: remaining }));
                return;
            }
            void refreshCredits();
        };
        const onVisible = () => {
            if (document.visibilityState === "visible") void refreshCredits();
        };
        window.addEventListener("credits-changed", onChanged);
        document.addEventListener("visibilitychange", onVisible);
        return () => {
            window.removeEventListener("credits-changed", onChanged);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [refreshCredits]);

    const value = useMemo<CreditsContextValue>(() => ({
        ...snapshot,
        setCredits: (next) => setSnapshot((current) => ({ ...current, credits: next })),
        refreshCredits,
    }), [snapshot, refreshCredits]);

    return <CreditsContext.Provider value={value}>{children}</CreditsContext.Provider>;
}

export function useCredits(fallbackCredits?: number, fallbackPlan?: string): CreditsSnapshot {
    const context = useContext(CreditsContext);
    if (context) return { credits: context.credits, plan: context.plan };
    return {
        credits: fallbackCredits ?? 0,
        plan: fallbackPlan ?? "Free",
    };
}

export function useCreditsActions() {
    return useContext(CreditsContext);
}
