"use client";

import React from "react";
import { m, AnimatePresence } from "framer-motion";
import {
    RiShieldCheckLine,
    RiCloseLine,
    RiArrowRightLine
} from "react-icons/ri";
import { ProjectAnalysisResults, ProjectAnalysisData } from "./ProjectAnalysisResults";
import { useRouter } from "next/navigation";

interface ProjectResultsModalProps {
    isOpen: boolean;
    onCloseAction: () => void;
    data: ProjectAnalysisData;
}

export function ProjectResultsModal({ isOpen, onCloseAction, data }: ProjectResultsModalProps) {
    const router = useRouter();

    if (!isOpen || !data) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onCloseAction}
                    className="absolute inset-0 bg-background/60 backdrop-blur-md"
                />

                <m.div
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: 10 }}
                    className="relative bg-background w-full max-w-5xl max-h-[92vh] rounded-[var(--radius-3xl)] shadow-[var(--shadow-2xl)] border border-border-subtle flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="px-10 py-6 border-b border-border-subtle flex items-center justify-between bg-background/40 backdrop-blur-3xl sticky top-0 z-20">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-2.5 py-1 bg-success/10 text-success rounded-full">
                                    <RiShieldCheckLine size={14} />
                                    <span className="text-[0.55rem] font-bold uppercase tracking-widest">Project Verification Report</span>
                                </div>
                            </div>
                            <h2 className="text-xl font-bold text-foreground tracking-tight">Proof Analysis</h2>
                        </div>
                        <button onClick={onCloseAction} className="w-10 h-10 hover:bg-muted rounded-[var(--radius-xl)] flex items-center justify-center text-muted-foreground transition-colors">
                            <RiCloseLine size={20} />
                        </button>
                    </div>

                    <div className="flex-grow overflow-y-auto no-scrollbar p-10 pt-8 bg-muted/30">
                        <ProjectAnalysisResults result={data} />
                    </div>

                    <div className="p-6 border-t border-neutral-200/60 flex items-center justify-end bg-white sticky bottom-0 z-20 gap-3">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    router.push(`/dashboard/resumes/new`);
                                    onCloseAction();
                                }}
                                className="px-10 py-4 bg-primary hover:bg-primary-dark text-primary-foreground rounded-[var(--radius-2xl)] shadow-xl shadow-primary/10 font-bold text-[0.65rem] uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                            >
                                Use in Resume <RiArrowRightLine />
                            </button>
                            <button
                                onClick={onCloseAction}
                                className="px-8 py-4 bg-foreground text-background text-[0.65rem] font-bold uppercase tracking-widest rounded-[var(--radius-2xl)] hover:opacity-90 transition-all active:scale-[0.98]"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </m.div>
            </div>
        </AnimatePresence>
    );
}
