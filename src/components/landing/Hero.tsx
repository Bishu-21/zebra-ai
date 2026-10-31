"use client";

import { ProductDemo } from "@/components/landing/ProductDemo";
import { useSession } from "@/lib/auth-client";
import { m, useReducedMotion } from "framer-motion";
import Link from "next/link";

export function Hero() {
    const { data: session } = useSession();
    const prefersReducedMotion = useReducedMotion();

    const enter = prefersReducedMotion
        ? {}
        : {
              initial: false,
              animate: { opacity: 1, y: 0 },
          };

    return (
        <section className="relative mx-auto flex max-w-7xl flex-col justify-center px-5 py-16 font-sans md:px-8 md:py-24">
            <m.div
                className="max-w-3xl"
                {...enter}
                transition={{ duration: 0.6, delay: prefersReducedMotion ? 0 : 1.15, ease: [0.22, 1, 0.36, 1] }}
            >
                <p className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-primary">Resume review for a specific job</p>
                <h1 className="mb-6 text-4xl font-bold leading-[0.95] tracking-[-0.06em] text-foreground sm:text-5xl md:text-7xl">
                    Improve your resume for a specific job.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-accent-dark md:text-lg">
                    Import the resume you already have, review suggested changes, and export a PDF when you are ready.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                    {session ? (
                        <Link
                            href="/dashboard/resumes"
                            className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                        >
                            Open your resumes
                        </Link>
                    ) : (
                        <button
                            type="button"
                            onClick={() => window.dispatchEvent(new Event("open-auth"))}
                            className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                        >
                            Get started
                        </button>
                    )}
                    <Link
                        href="#demo"
                        className="rounded-xl border border-neutral-200 bg-white px-6 py-3 text-sm font-bold text-foreground transition-colors hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                    >
                        See how it works
                    </Link>
                </div>
            </m.div>

            <m.div
                className="mt-12 md:mt-16"
                {...enter}
                transition={{ duration: 0.6, delay: prefersReducedMotion ? 0 : 1.28, ease: [0.22, 1, 0.36, 1] }}
            >
                <ProductDemo />
            </m.div>
        </section>
    );
}
