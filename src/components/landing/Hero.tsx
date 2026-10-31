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
        <section className="relative mx-auto flex max-w-7xl flex-col justify-center px-4 py-10 font-sans sm:px-5 sm:py-16 md:px-8 md:py-24">
            <m.div
                className="max-w-3xl"
                {...enter}
                transition={{ duration: prefersReducedMotion ? 0 : 0.4, delay: 0, ease: [0.22, 1, 0.36, 1] }}
            >
                <h1 className="mb-5 text-[2rem] font-bold leading-[1.05] tracking-[-0.06em] text-foreground sm:mb-6 sm:text-5xl lg:text-7xl lg:leading-[0.95]">
                    Improve your resume for a specific job.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-accent-dark md:text-lg">
                    Import the resume you already have, review suggested changes, and export a PDF when you are ready.
                </p>
                <div className="mt-6 flex w-full flex-col gap-3 sm:mt-8 sm:w-auto sm:flex-row sm:flex-wrap">
                    {session ? (
                        <Link
                            href="/dashboard/resumes"
                            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground sm:w-auto"
                        >
                            Open your resumes
                        </Link>
                    ) : (
                        <button
                            type="button"
                            onClick={() => window.dispatchEvent(new Event("open-auth"))}
                            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground sm:w-auto"
                        >
                            Get started
                        </button>
                    )}
                    <Link
                        href="#demo"
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-neutral-200 bg-white px-6 py-3 text-sm font-bold text-foreground transition-colors hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground sm:w-auto"
                    >
                        See how it works
                    </Link>
                </div>
            </m.div>

            <m.div
                className="mt-8 min-w-0 sm:mt-12 md:mt-16"
                {...enter}
                transition={{ duration: prefersReducedMotion ? 0 : 0.4, delay: 0, ease: [0.22, 1, 0.36, 1] }}
            >
                <ProductDemo />
            </m.div>
        </section>
    );
}
