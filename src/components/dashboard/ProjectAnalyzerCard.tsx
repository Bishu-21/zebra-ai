"use client";

import React, { useCallback, useState } from "react";
import { RiCloseLine, RiShieldCheckLine } from "react-icons/ri";
import { m, AnimatePresence } from "framer-motion";
import { DashboardToolCard } from "./DashboardToolCard";
import { ProjectProofAnalyzer } from "./ProjectProofAnalyzer";
import { FeatureIcon } from "./FeatureIcon";
import { featureChrome } from "./feature-chrome";
import { AppIcon } from "@/components/ui/AppIcon";
import { useDialogFocus } from "@/hooks/useDialogFocus";

export function ProjectAnalyzerCard() {
    const [isOpen, setIsOpen] = useState(false);
    const close = useCallback(() => setIsOpen(false), []);
    const dialogRef = useDialogFocus<HTMLDivElement>(isOpen, close);

    return (
        <>
            <DashboardToolCard
                icon={RiShieldCheckLine}
                title="Check my project"
                description="Fetch a public project URL and review proof points. Private repos need GitHub App access in Settings."
                onClick={() => setIsOpen(true)}
            />

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={featureChrome.backdrop}
                            onClick={close}
                        />
                        <m.div
                            ref={dialogRef}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="project-proof-title"
                            initial={{ scale: 0.98, opacity: 0, y: 8 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.98, opacity: 0, y: 8 }}
                            transition={{ duration: 0.16, ease: "easeOut" }}
                            className={`${featureChrome.dialog} max-w-2xl`}
                        >
                            <div className={featureChrome.dialogHeader}>
                                <div className="flex min-w-0 flex-1 items-start gap-2.5 sm:items-center">
                                    <FeatureIcon feature="Work" size={18} className="text-muted-foreground" />
                                    <div className="min-w-0">
                                        <h2 id="project-proof-title" className="text-base font-semibold tracking-tight text-foreground">
                                            Check my project
                                        </h2>
                                        <p className={featureChrome.helper}>
                                            Add a GitHub repository or live demo URL. Private repos need GitHub App access in Settings.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={close}
                                    aria-label="Close project check"
                                    className={featureChrome.iconButton}
                                >
                                    <AppIcon icon={RiCloseLine} size={18} />
                                </button>
                            </div>
                            <div className={`${featureChrome.dialogBody} space-y-5`}>
                                <ProjectProofAnalyzer />
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
