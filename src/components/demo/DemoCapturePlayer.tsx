"use client";

import { useEffect, useRef, useState } from "react";
import { FeatureDemoScene } from "./FeatureDemoScene";
import { FEATURE_DEMO_SECONDS, OVERVIEW_DEMO_SECONDS, type DemoId } from "@/lib/demo-catalog";
import { SettingsProvider } from "@/context/SettingsContext";
import { ToastProvider } from "@/components/ui/Toast";

/** Recording-only playback. No account writes, provider calls or microphone use. */
export function DemoCapturePlayer({ id }: { id: DemoId }) {
    const [seconds, setSeconds] = useState(0);
    const [status, setStatus] = useState("ready");
    const timer = useRef<ReturnType<typeof setInterval> | null>(null);
    useEffect(() => {
        const play = () => {
            if (timer.current) clearInterval(timer.current);
            const started = performance.now();
            setSeconds(0);
            setStatus("playing");
            const duration = id === "overview" ? OVERVIEW_DEMO_SECONDS : FEATURE_DEMO_SECONDS;
            timer.current = setInterval(() => {
                const elapsed = (performance.now() - started) / 1000;
                setSeconds(Math.min(duration, elapsed));
                if (elapsed >= duration) {
                    if (timer.current) clearInterval(timer.current);
                    setStatus("done");
                }
            }, 40);
        };
        window.addEventListener("zebra-demo-play", play);
        return () => { window.removeEventListener("zebra-demo-play", play); if (timer.current) clearInterval(timer.current); };
    }, [id]);
    return <SettingsProvider><ToastProvider><div data-demo-status={status} data-demo-seconds={seconds.toFixed(2)}><FeatureDemoScene id={id} seconds={seconds} /></div></ToastProvider></SettingsProvider>;
}
