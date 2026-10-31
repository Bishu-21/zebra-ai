"use client";

import { FeatureIcon } from "@/components/dashboard/FeatureIcon";
import { m, useReducedMotion } from "framer-motion";

const BENEFITS = [
    {
        icon: "Resumes" as const,
        title: "Keep the original resume",
        body: "Job-specific suggestions are stored as pending changes. The resume you imported stays as it is until you accept an edit.",
    },
    {
        icon: "Applications" as const,
        title: "See how experience fits a role",
        body: "Compare your skills and work history with a job description to see what already matches and what is missing.",
    },
    {
        icon: "Work" as const,
        title: "Approve edits before you export",
        body: "When you tailor an application, you can accept, edit, or reject each suggestion. The PDF you export includes only the changes you approved.",
    },
];

export function Benefits() {
    const reduceMotion = useReducedMotion();

    return (
        <section id="how-it-works" className="relative scroll-mt-20 border-y border-border-subtle bg-white px-5 py-20 md:px-8 md:py-28">
            <div className="mx-auto max-w-7xl">
                <m.div
                    className="mb-12 max-w-2xl md:mb-16"
                    initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                    whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                    <p className="mb-5 text-xs font-medium uppercase tracking-wide text-muted-foreground">How it works</p>
                    <h2 className="text-4xl font-bold leading-[1.1] tracking-[-0.04em] text-foreground md:text-6xl">
                        Import, review suggestions, export a PDF.
                    </h2>
                    <p className="mt-5 max-w-xl text-base leading-7 text-accent-dark md:text-lg">
                        You import a resume, compare it with a job, and approve each change. The original file stays. You apply on the employer site.
                    </p>
                </m.div>

                <div className="grid gap-6 md:grid-cols-3 md:gap-8">
                    {BENEFITS.map((benefit, index) => (
                        <m.article
                            key={benefit.title}
                            className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8"
                            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: reduceMotion ? 0 : index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <div className="mb-5 grid size-11 place-items-center rounded-xl bg-muted text-muted-foreground">
                                <FeatureIcon feature={benefit.icon} size={20} />
                            </div>
                            <h3 className="text-xl font-bold tracking-tight text-foreground">{benefit.title}</h3>
                            <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base md:leading-7">{benefit.body}</p>
                        </m.article>
                    ))}
                </div>
            </div>
        </section>
    );
}
