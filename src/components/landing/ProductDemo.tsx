"use client";

import { m, useReducedMotion } from "framer-motion";
import { useId, useRef, useState } from "react";
import { RiPlayCircleLine, RiArrowRightLine, RiDownloadLine } from "react-icons/ri";
import { AppIcon } from "@/components/ui/AppIcon";
import { DEMO_FEATURES, DEMO_DISCLOSURE, isPlayableDemoId, type DemoId } from "@/lib/demo-catalog";

export function ProductDemo() {
    const prefersReducedMotion = useReducedMotion();
    const captionId = useId();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [selectedId, setSelectedId] = useState<DemoId>("overview");
    const [failedId, setFailedId] = useState<DemoId | null>(null);
    const [playbackHint, setPlaybackHint] = useState("");
    const selected = DEMO_FEATURES.find(item => item.id === selectedId);
    const title = selected?.title || "Product overview";
    const VIDEO_SRC = selectedId === "overview" ? "/demo/walkthrough.mp4" : `/demo/${selectedId}.mp4`;
    const POSTER_SRC = `/demo/${selectedId}-poster.jpg`;
    const CAPTIONS_SRC = selectedId === "overview" ? "/demo/walkthrough.vtt" : `/demo/${selectedId}.vtt`;
    const items = [{ id: "overview" as const, title: "Overview" }, ...DEMO_FEATURES.filter((item) => isPlayableDemoId(item.id))];
    const seekOverview = (seconds: number) => {
        const video = videoRef.current;
        if (!video) return;
        if (video.readyState >= 1) video.currentTime = seconds;
        else {
            video.addEventListener("loadedmetadata", () => { video.currentTime = seconds; }, { once: true });
            video.load();
        }
        void video.play().catch(() => setPlaybackHint("Press play in the video to start this chapter."));
    };

    return <figure id="demo" className="w-full scroll-mt-28" aria-label="Zebra AI feature videos">
        <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
                <p className="text-xs font-semibold tracking-wide text-muted-foreground">Explore the workspace</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">See Zebra in motion</h2>
            </div>
            <p className="text-sm text-muted-foreground">A short overview, plus the feature videos that are ready.</p>
        </div>
        <nav aria-label="Choose a feature video" className="mb-4 flex flex-wrap gap-2">
            {items.map(item => <button key={item.id} type="button" onClick={() => { setSelectedId(item.id); setPlaybackHint(""); }} aria-pressed={selectedId === item.id}
                className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl border px-3.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 ${selectedId === item.id ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:text-neutral-950"}`}>
                {selectedId === item.id && <AppIcon icon={RiPlayCircleLine} size={16} />}{item.title}
            </button>)}
        </nav>
        <m.div initial={false} animate={{ opacity: 1 }} transition={{ duration: prefersReducedMotion ? 0 : 0.2 }} className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-950 shadow-sm md:rounded-3xl">
            <video ref={videoRef} key={selectedId} className="aspect-video h-auto w-full bg-neutral-950" controls playsInline preload="none" poster={POSTER_SRC} width={1280} height={720} aria-label={`${title} video`} aria-describedby={captionId} onError={() => setFailedId(selectedId)} onPlaying={() => setPlaybackHint("")}>
                <source src={VIDEO_SRC} type="video/mp4" />
                <track kind="captions" srcLang="en" label="English" src={CAPTIONS_SRC} default />
                Your browser cannot play this video. Read the walkthrough below or download the MP4.
            </video>
        </m.div>
        <figcaption id={captionId} className="mt-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div className="max-w-3xl">
                    <p className="text-sm leading-6 text-muted-foreground"><strong className="font-semibold text-foreground">{title}. </strong>{selected?.description || "Explore resumes, applications, supporting work, cover letters, portfolios, LinkedIn, analytics, settings, and Zebu."}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{DEMO_DISCLOSURE} Videos are silent and start only when you press play.</p>
                </div>
                <a href={VIDEO_SRC} download className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-2 text-xs font-medium text-foreground underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"><AppIcon icon={RiDownloadLine} size={16} />Download video</a>
            </div>
            {failedId === selectedId && <p role="status" className="mt-3 rounded-xl bg-neutral-100 p-3 text-sm text-neutral-700">This video could not load. You can download it or read the walkthrough below.</p>}
            {playbackHint && <p role="status" className="mt-2 text-sm text-muted-foreground">{playbackHint}</p>}
            {selectedId === "overview" && <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1" aria-label="Overview chapters">{DEMO_FEATURES.map((item, index) => <button key={item.id} type="button" onClick={() => seekOverview(index * 3)} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1 text-xs text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"><span className="font-mono text-neutral-400">0:{String(index * 3).padStart(2, "0")}</span>{item.title}<AppIcon icon={RiArrowRightLine} size={12} /></button>)}</div>}
            <details className="mt-3 rounded-xl border border-neutral-200 bg-white px-4 py-3">
                <summary className="min-h-6 cursor-pointer text-sm font-medium text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">Read the walkthrough</summary>
                <div className="mt-4 grid gap-5 text-sm leading-6 text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
                    {(selected ? [selected] : DEMO_FEATURES).map(item => <section key={item.id}><h3 className="font-semibold text-foreground">{item.title}</h3><ol className="mt-2 list-decimal space-y-1 pl-4">{item.steps.map(step => <li key={step}>{step}</li>)}</ol></section>)}
                </div>
            </details>
        </figcaption>
    </figure>;
}
