"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useToast } from "@/components/ui/Toast";
import { APPLICATION_WORKSPACE_FIXTURE } from "@/lib/application-workspace-fixture";
import { DEMO_SAMPLE_MESSAGE } from "@/lib/demo-catalog";
import { PRODUCT_DEMO_RESUME } from "@/lib/product-demo-fixture";

export type DemoWorkspaceValue = {
    isDemo: true;
    interactive: boolean;
    pathname: string;
    navigate: (href: string) => void;
    notifySample: () => void;
    userName: string;
    credits: number;
    plan: string;
};

const DemoWorkspaceContext = createContext<DemoWorkspaceValue | null>(null);

export function useDemoWorkspace() {
    return useContext(DemoWorkspaceContext);
}

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

function requestPath(input: RequestInfo | URL): string {
    const raw = input instanceof Request ? input.url : String(input);
    try {
        return new URL(raw, "http://local.invalid").pathname;
    } catch {
        return raw;
    }
}

export function DemoWorkspaceProvider({
    pathname,
    onNavigate,
    interactive,
    children,
}: {
    pathname: string;
    onNavigate: (href: string) => void;
    interactive: boolean;
    children: ReactNode;
}) {
    const { showToast } = useToast();
    const lastNotice = useRef(0);

    const notifySample = useCallback(() => {
        const now = Date.now();
        if (now - lastNotice.current < 1600) return;
        lastNotice.current = now;
        showToast(DEMO_SAMPLE_MESSAGE, "info");
    }, [showToast]);

    const navigate = useCallback((href: string) => {
        onNavigate(href);
    }, [onNavigate]);

    useEffect(() => {
        const original = window.fetch.bind(window);
        window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
            const request = input instanceof Request ? input : null;
            const path = requestPath(input);
            const method = (init?.method || request?.method || "GET").toUpperCase();
            if (!path.startsWith("/api/") || path.startsWith("/api/auth")) {
                return original(input, init);
            }
            if (method === "GET") {
                if (path.startsWith("/api/resumes")) {
                    return jsonResponse({
                        resumes: [{ id: PRODUCT_DEMO_RESUME.id, title: PRODUCT_DEMO_RESUME.title }],
                        page: { hasMore: false, nextCursor: null },
                    });
                }
                if (path.startsWith("/api/certifications")) {
                    return jsonResponse({ certifications: [], page: { nextCursor: null } });
                }
                if (path.startsWith("/api/applications")) {
                    return jsonResponse({ application: APPLICATION_WORKSPACE_FIXTURE.application });
                }
                if (path.startsWith("/api/work")) {
                    return jsonResponse({ items: [], page: { nextCursor: null } });
                }
                return jsonResponse({});
            }
            notifySample();
            return jsonResponse({ error: DEMO_SAMPLE_MESSAGE }, 401);
        };
        return () => {
            window.fetch = original;
        };
    }, [notifySample]);

    const value = useMemo<DemoWorkspaceValue>(() => ({
        isDemo: true,
        interactive,
        pathname,
        navigate,
        notifySample,
        userName: "Jordan Hale",
        credits: 3,
        plan: "Free",
    }), [interactive, navigate, notifySample, pathname]);

    return <DemoWorkspaceContext.Provider value={value}>{children}</DemoWorkspaceContext.Provider>;
}
