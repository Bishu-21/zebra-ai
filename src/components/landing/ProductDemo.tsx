"use client";

import { m, useReducedMotion } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";
import { RiPauseCircleLine, RiPlayCircleLine } from "react-icons/ri";
import { FeatureDemoScene } from "@/components/demo/FeatureDemoScene";
import { SettingsProvider } from "@/context/SettingsContext";
import { ToastProvider } from "@/components/ui/Toast";
import { AppIcon } from "@/components/ui/AppIcon";
import {
    DEMO_DISCLOSURE,
    DEMO_FEATURES,
    FEATURE_DEMO_SECONDS,
    FEATURE_PHASE_SECONDS,
    OVERVIEW_DEMO_SECONDS,
    OVERVIEW_FEATURE_SECONDS,
    demoIdFromHref,
    getDemoMoment,
    hrefForDemoId,
    type DemoId,
} from "@/lib/demo-catalog";

const ITEMS: { id: DemoId; title: string }[] = [
    { id: "overview", title: "Overview" },
    ...DEMO_FEATURES.map((item) => ({ id: item.id, title: item.title })),
];

function durationFor(id: DemoId) {
    return id === "overview" ? OVERVIEW_DEMO_SECONDS : FEATURE_DEMO_SECONDS;
}

export function ProductDemo() {
    const prefersReducedMotion = useReducedMotion();
    const captionId = useId();
    const stageRef = useRef<HTMLElement>(null);
    const secondsRef = useRef(0);
    const [selectedId, setSelectedId] = useState<DemoId>("overview");
    const [pathname, setPathname] = useState("/dashboard");
    const [seconds, setSeconds] = useState(0);
    const [userPlaying, setUserPlaying] = useState<boolean | null>(null);
    const [inView, setInView] = useState(true);
    const [ready, setReady] = useState(false);
    const playing = Boolean(ready && inView && (userPlaying ?? prefersReducedMotion !== true));
    const interactive = !playing;
    const moment = getDemoMoment(selectedId, seconds);
    const displayPath = playing
        ? hrefForDemoId(selectedId === "overview" ? moment.feature.id : selectedId)
        : pathname;
    const pageId = demoIdFromHref(displayPath);
    const selected = DEMO_FEATURES.find((item) => item.id === (pageId === "overview" ? moment.feature.id : pageId));
    const title = selectedId === "overview" && playing
        ? moment.feature.title
        : selected?.title || "Home";

    useEffect(() => {
        const node = stageRef.current;
        if (!node) return;
        const observer = new IntersectionObserver(([entry]) => {
            setReady(true);
            setInView(entry.isIntersecting);
        }, { threshold: 0.25 });
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!playing || !inView || prefersReducedMotion) return;
        let last = performance.now();
        let frame = 0;
        const tick = (now: number) => {
            const duration = durationFor(selectedId);
            secondsRef.current = (secondsRef.current + (now - last) / 1000) % duration;
            setSeconds(secondsRef.current);
            last = now;
            frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [playing, inView, prefersReducedMotion, selectedId]);

    const seek = (next: number) => {
        const value = Math.max(0, Math.min(durationFor(selectedId) - 0.001, next));
        secondsRef.current = value;
        setSeconds(value);
    };

    const openFeature = (id: DemoId, play = false) => {
        setSelectedId(id);
        setPathname(hrefForDemoId(id));
        secondsRef.current = 0;
        setSeconds(0);
        setUserPlaying(play && prefersReducedMotion !== true);
    };

    return (
        <figure ref={stageRef} id="demo" className="w-full min-w-0 max-w-full scroll-mt-24 font-sans sm:scroll-mt-28" aria-label="Zebra AI feature walkthrough" aria-describedby={captionId}>
            <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                <div>
                    <p className="text-xs font-medium text-muted-foreground">Product walkthrough</p>
                    <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Inside the workspace</h2>
                </div>
                <p className="max-w-md text-sm leading-6 text-muted-foreground">Play the sample, or click inside it. Same screens as the signed-in dashboard.</p>
            </div>
            <nav aria-label="Choose a feature" className="-mx-4 mb-4 flex gap-1 overflow-x-auto overscroll-x-contain border-b border-neutral-200 px-4 pb-2 sm:mx-0 sm:px-0">
                {ITEMS.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => openFeature(item.id, false)}
                        aria-pressed={selectedId === item.id}
                        className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-3.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 ${selectedId === item.id ? "bg-neutral-950 text-white" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"}`}
                    >
                        {item.title}
                    </button>
                ))}
            </nav>
            <m.div
                initial={false}
                animate={{ opacity: 1 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                className="isolate overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
            >
                <div className="relative h-[min(62dvh,28rem)] min-h-[20rem] w-full sm:h-[min(70dvh,42rem)] sm:min-h-[28rem] lg:h-[min(78dvh,54rem)]">
                    <SettingsProvider persist={false}>
                        <ToastProvider>
                            <FeatureDemoScene
                                id={selectedId}
                                seconds={seconds}
                                pathname={displayPath}
                                interactive={interactive}
                                onNavigate={(href) => {
                                    setPathname(href);
                                    setSelectedId(demoIdFromHref(href));
                                    setUserPlaying(false);
                                }}
                            />
                        </ToastProvider>
                    </SettingsProvider>
                </div>
            </m.div>
            <figcaption id={captionId} className="mt-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="max-w-3xl">
                        <p className="text-sm leading-6 text-muted-foreground">
                            <strong className="font-semibold text-foreground">{title}. </strong>
                            {selected?.description}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{DEMO_DISCLOSURE} Play walks through the pages. Pause to click the sidebar, dialogs, and Zebu.</p>
                    </div>
                    <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto">
                        <button
                            type="button"
                            onClick={() => {
                                if (playing) setPathname(displayPath);
                                setUserPlaying(!playing);
                            }}
                            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-medium text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:w-auto"
                        >
                            <AppIcon icon={playing ? RiPauseCircleLine : RiPlayCircleLine} size={16} />
                            {playing ? "Pause" : "Play"}
                        </button>
                    </div>
                </div>
                {selectedId === "overview" && (
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1" aria-label="Overview chapters">
                        {DEMO_FEATURES.map((item, index) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                    seek(index * OVERVIEW_FEATURE_SECONDS);
                                    setPathname(hrefForDemoId(item.id));
                                }}
                                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1 text-xs text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                            >
                                <span className="font-mono text-neutral-400">{Math.floor(index * OVERVIEW_FEATURE_SECONDS / 60)}:{String(index * OVERVIEW_FEATURE_SECONDS % 60).padStart(2, "0")}</span>
                                {item.title}
                            </button>
                        ))}
                    </div>
                )}
                {selectedId !== "overview" && selected && (
                    <ol className="mt-3 grid gap-2 text-sm leading-6 text-muted-foreground sm:grid-cols-3">
                        {selected.steps.map((step, index) => (
                            <li key={step}>
                                <button
                                    type="button"
                                    onClick={() => seek(index * FEATURE_PHASE_SECONDS)}
                                    className={`w-full rounded-xl border px-3 py-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${index === moment.phase ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-white"}`}
                                >
                                    <span className="block text-[10px] font-semibold uppercase tracking-wide opacity-70">Step {index + 1}</span>
                                    {step}
                                </button>
                            </li>
                        ))}
                    </ol>
                )}
                <details className="mt-3 rounded-xl border border-neutral-200 bg-white px-4 py-3">
                    <summary className="min-h-6 cursor-pointer text-sm font-medium text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">Read the walkthrough</summary>
                    <div className="mt-4 grid gap-5 text-sm leading-6 text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
                        {DEMO_FEATURES.map((item) => (
                            <section key={item.id}>
                                <h3 className="font-semibold text-foreground">{item.title}</h3>
                                <ol className="mt-2 list-decimal space-y-1 pl-4">
                                    {item.steps.map((step) => (
                                        <li key={step}>{step}</li>
                                    ))}
                                </ol>
                            </section>
                        ))}
                    </div>
                </details>
            </figcaption>
        </figure>
    );
}
