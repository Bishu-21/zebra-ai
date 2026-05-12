"use client";

import React from "react";
import { m, AnimatePresence } from "framer-motion";
import { 
    RiCloseLine, 
    RiHistoryLine, 
    RiTimeLine, 
    RiBriefcaseLine, 
    RiBuilding4Line,
    RiArrowRightSLine,
    RiFileTextLine
} from "react-icons/ri";
import Link from "next/link";

interface Version {
    id: string;
    title: string;
    date: Date;
    targetRole?: string | null;
    targetCompany?: string | null;
}

interface ResumeVersionsModalProps {
    isOpen: boolean;
    onCloseAction: () => void;
    parentTitle: string;
    versions: Version[];
}

export function ResumeVersionsModal({ isOpen, onCloseAction, parentTitle, versions }: ResumeVersionsModalProps) {
    function formatTimeAgo(date: Date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
        
        if (diffInSeconds < 60) return "Just now";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <m.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCloseAction}
                        className="absolute inset-0 bg-black/40 backdrop-blur-md"
                    />
                    
                    <m.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-[var(--background)] w-full max-w-2xl max-h-[80vh] rounded-[var(--radius-xl)] shadow-2xl border border-[var(--border-subtle)] flex flex-col overflow-hidden"
                    >
                        <div className="p-8 border-b border-[var(--border-subtle)]/50 flex items-center justify-between sticky top-0 bg-[var(--background)]/80 backdrop-blur-xl z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-[var(--primary)]/10 text-[var(--primary)] rounded-[var(--radius-lg)] flex items-center justify-center">
                                    <RiHistoryLine size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-foreground tracking-tight">{parentTitle}</h3>
                                    <p className="text-[0.6rem] font-bold text-muted-foreground/60 uppercase tracking-widest">Version History • {versions.length} Variants</p>
                                </div>
                            </div>
                            <button 
                                onClick={onCloseAction}
                                className="w-10 h-10 flex items-center justify-center text-[var(--muted-foreground)]/40 hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-[var(--radius-md)] transition-all"
                            >
                                <RiCloseLine size={24} />
                            </button>
                        </div>

                        <div className="flex-grow overflow-y-auto p-8 no-scrollbar space-y-4">
                            {versions.length === 0 ? (
                                <div className="py-12 text-center">
                                    <p className="text-sm text-[var(--muted-foreground)] font-medium">No versions found for this resume.</p>
                                </div>
                            ) : (
                                versions.map((version) => (
                                    <Link
                                        key={version.id}
                                        href={`/dashboard/resumes/${version.id}`}
                                        className="group flex items-center gap-6 p-6 bg-[var(--background)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] hover:border-[var(--primary)]/30 hover:shadow-xl hover:shadow-[var(--primary)]/5 transition-all"
                                    >
                                        <div className="w-12 h-12 bg-[var(--muted)] text-[var(--muted-foreground)]/30 rounded-[var(--radius-md)] flex items-center justify-center group-hover:bg-[var(--primary)] group-hover:text-white transition-all shadow-sm">
                                            <RiFileTextLine size={20} />
                                        </div>
                                        
                                        <div className="flex-grow min-w-0">
                                            <h4 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors truncate mb-1">
                                                {version.title}
                                            </h4>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5 text-[0.6rem] font-bold text-[var(--muted-foreground)]/40 uppercase tracking-widest">
                                                    <RiTimeLine size={12} />
                                                    {formatTimeAgo(version.date)}
                                                </div>
                                                {(version.targetRole || version.targetCompany) && (
                                                    <div className="flex items-center gap-3">
                                                        {version.targetRole && (
                                                            <div className="flex items-center gap-1 text-[0.6rem] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-[var(--radius-sm)] border border-primary/10 truncate max-w-[120px]">
                                                                <RiBriefcaseLine size={10} />
                                                                {version.targetRole}
                                                            </div>
                                                        )}
                                                        {version.targetCompany && (
                                                            <div className="flex items-center gap-1 text-[0.6rem] font-bold text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-0.5 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] truncate max-w-[120px]">
                                                                <RiBuilding4Line size={10} />
                                                                {version.targetCompany}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <RiArrowRightSLine className="text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all" size={20} />
                                    </Link>
                                ))
                            )}
                        </div>

                        <div className="p-8 border-t border-[var(--border-subtle)] bg-[var(--muted)]/30">
                            <button 
                                onClick={onCloseAction}
                                className="w-full py-4 bg-[var(--foreground)] text-[var(--background)] rounded-[var(--radius-md)] text-[0.7rem] font-black uppercase tracking-[0.2em] hover:opacity-90 transition-all active:scale-[0.98]"
                            >
                                Close History
                            </button>
                        </div>
                    </m.div>
                </div>
            )}
        </AnimatePresence>
    );
}
