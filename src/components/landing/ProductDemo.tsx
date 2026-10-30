"use client";

import { PRODUCT_DEMO_STEPS } from "@/lib/product-demo-fixture";
import { m, useReducedMotion } from "framer-motion";
import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { RiPauseFill, RiPlayFill } from "react-icons/ri";

const STEP_MS = 3200;
const VIDEO_SRC = "/demo/walkthrough.mp4";
const POSTER_SRC = PRODUCT_DEMO_STEPS[3].src;
const CAPTIONS_SRC = "/demo/walkthrough.vtt";
const subscribeToHydration = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function ProductDemo() {
    const prefersReducedMotion = useReducedMotion();
    const captionId = useId();
    const mounted = useSyncExternalStore(subscribeToHydration, clientSnapshot, serverSnapshot);
    const [hasVideo, setHasVideo] = useState(false);
    const [index, setIndex] = useState(3);
    const [playing, setPlaying] = useState(false);
    const step = PRODUCT_DEMO_STEPS[index];
    const reduceMotion = !mounted || Boolean(prefersReducedMotion);

    useEffect(() => {
        let cancelled = false;
        fetch(VIDEO_SRC, { method: "HEAD" })
            .then((response) => {
                if (!cancelled) setHasVideo(response.ok);
            })
            .catch(() => {
                if (!cancelled) setHasVideo(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (reduceMotion || hasVideo || !playing) return undefined;
        const timer = window.setInterval(() => {
            setIndex((current) => (current + 1) % PRODUCT_DEMO_STEPS.length);
        }, STEP_MS);
        return () => window.clearInterval(timer);
    }, [hasVideo, playing, reduceMotion]);

    const useNativeVideo = hasVideo && !reduceMotion;

    return (
        <figure id="demo" className="w-full scroll-mt-28">
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-950 shadow-sm md:rounded-3xl">
                {useNativeVideo ? (
                    <video
                        className="aspect-video h-auto w-full bg-neutral-950"
                        controls
                        playsInline
                        preload="none"
                        poster={POSTER_SRC}
                        width={1280}
                        height={720}
                    >
                        <source src={VIDEO_SRC} type="video/mp4" />
                        <track kind="captions" srcLang="en" label="English" src={CAPTIONS_SRC} default />
                        A short walkthrough of importing a resume, reviewing it, editing with a live preview, and exporting a PDF.
                    </video>
                ) : (
                    <div className="relative aspect-[16/10] bg-neutral-100 md:aspect-video">
                        <m.img
                            key={reduceMotion ? POSTER_SRC : step.src}
                            src={reduceMotion ? POSTER_SRC : step.src}
                            alt={reduceMotion ? PRODUCT_DEMO_STEPS[3].caption : step.caption}
                            className="h-full w-full object-cover object-top"
                            initial={reduceMotion ? false : { opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        />
                        {!reduceMotion && (
                            <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/70 to-transparent px-3 py-3 md:px-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!playing) setIndex(0);
                                        setPlaying(!playing);
                                    }}
                                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                                    aria-pressed={playing}
                                    aria-controls={captionId}
                                    aria-label={playing ? "Pause walkthrough" : "Play walkthrough"}
                                >
                                    {playing ? <RiPauseFill size={20} /> : <RiPlayFill size={20} />}
                                </button>
                                <ol className="flex flex-1 gap-1" aria-label="Walkthrough steps">
                                    {PRODUCT_DEMO_STEPS.map((item, stepIndex) => (
                                        <li key={item.id} className="flex-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPlaying(false);
                                                    setIndex(stepIndex);
                                                }}
                                                className={`h-1.5 w-full rounded-full ${stepIndex === index ? "bg-white" : "bg-white/35"}`}
                                                aria-current={stepIndex === index ? "step" : undefined}
                                                aria-label={`${item.label}: ${item.caption}`}
                                            />
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <figcaption id={captionId} className="mt-3 text-sm leading-6 text-muted-foreground md:mt-4 md:text-base">
                <span className="font-semibold text-foreground">{reduceMotion || useNativeVideo ? "Walkthrough" : step.label}. </span>
                {reduceMotion ? "Import a resume, review the mapped sections, edit with a live preview, and export a PDF when you are ready. The frames use synthetic sample data." : useNativeVideo ? "Import, review, edit, preview, and export. Captions are available in the player." : step.caption}
            </figcaption>
            <ol className="mt-4 grid gap-2 text-sm leading-6 text-muted-foreground md:hidden">
                {PRODUCT_DEMO_STEPS.map((item) => (
                    <li key={item.id}>
                        <span className="font-semibold text-foreground">{item.label}. </span>
                        {item.caption}
                    </li>
                ))}
            </ol>
        </figure>
    );
}
