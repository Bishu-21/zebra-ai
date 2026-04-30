"use client";

import React, { useState } from "react";
import { 
    RiFileTextLine, 
    RiSearchLine, 
    RiArrowRightSLine, 
    RiMore2Fill,
    RiTimeLine,
    RiCheckboxCircleLine,
    RiFileCopyLine,
    RiHistoryLine,
    RiBuilding4Line,
    RiBriefcaseLine
} from "react-icons/ri";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { ResumeVersionsModal } from "./ResumeVersionsModal";

interface Resume {
    id: string;
    title: string;
    date: Date;
    hasAnalysis: boolean;
    parentResumeId?: string | null;
    targetRole?: string | null;
    targetCompany?: string | null;
}

interface ResumeVaultProps {
    items: Resume[];
}

export function ResumeVault({ items }: ResumeVaultProps) {
    const [search, setSearch] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);
    const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
    const [versionModal, setVersionModal] = useState<{ isOpen: boolean; parentTitle: string; versions: Resume[] }>({
        isOpen: false,
        parentTitle: "",
        versions: []
    });
    const router = useRouter();
    const { showToast } = useToast();

    // Versioning Logic: Group versions under their root parents
    // Roots are resumes with no parentResumeId OR those whose parent is not in the list
    const rootResumes = items.filter(r => !r.parentResumeId);
    const versions = items.filter(r => !!r.parentResumeId);

    // If a resume has a parent that isn't in the rootResumes, it's a "ghost root" or we just treat it as a root
    const rootIds = new Set(rootResumes.map(r => r.id));
    const ghostRoots = versions.filter(v => v.parentResumeId && !rootIds.has(v.parentResumeId));
    
    const finalRoots = [...rootResumes, ...ghostRoots].filter(item => 
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.targetRole?.toLowerCase().includes(search.toLowerCase()) ||
        item.targetCompany?.toLowerCase().includes(search.toLowerCase())
    );

    const displayedItems = isExpanded ? finalRoots : finalRoots.slice(0, 4);

    const getVersionsForRoot = (rootId: string) => {
        // Simple one-level or recursive check? Let's do a simple filter for now.
        // If we want recursive, we'd need more logic. 
        // Most users will duplicate from the main one.
        return items.filter(r => r.parentResumeId === rootId);
    };

    async function handleDuplicate(e: React.MouseEvent, id: string) {
        e.preventDefault();
        e.stopPropagation();
        
        if (duplicatingId) return;

        setDuplicatingId(id);
        try {
            const res = await fetch(`/api/resumes/${id}/duplicate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}), 
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to duplicate");
            }

            const data = await res.json();
            showToast("Resume duplicated successfully", "success");
            router.refresh(); 
            router.push(`/dashboard/resumes/${data.id}`);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "An unexpected error occurred";
            showToast(message, "error");
        } finally {
            setDuplicatingId(null);
        }
    }

    const openVersions = (e: React.MouseEvent, root: Resume) => {
        e.preventDefault();
        e.stopPropagation();
        const rootVersions = getVersionsForRoot(root.id);
        setVersionModal({
            isOpen: true,
            parentTitle: root.title,
            versions: rootVersions
        });
    };

    function formatTimeAgo(date: Date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
        
        if (diffInSeconds < 60) return "Just now";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-border-subtle">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-primary rounded-full" />
                    <h3 className="text-lg font-bold text-foreground tracking-tight">Resume Vault</h3>
                    <span className="px-2 py-0.5 bg-[var(--muted)] text-[var(--muted-foreground)] text-[0.65rem] font-bold rounded-[var(--radius-sm)] uppercase tracking-wider border border-[var(--border-subtle)]">
                        {items.length} Units
                    </span>
                </div>

                <div className="relative group">
                    <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors" size={14} />
                    <input 
                        type="text"
                        placeholder="Search your vault..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-[var(--muted)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] pl-10 pr-6 py-2.5 text-sm font-medium outline-none focus:bg-[var(--background)] focus:border-[var(--primary)]/40 focus:ring-4 focus:ring-[var(--primary)]/5 transition-all w-full md:w-64"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                    {displayedItems.map((item) => (
                        <m.div
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            key={item.id}
                        >
                            <Link 
                                href={`/dashboard/resumes/${item.id}`}
                                className="group relative block bg-[var(--background)] border border-[var(--border-subtle)] p-5 rounded-[var(--radius-lg)] hover:shadow-[var(--shadow-xl)] hover:shadow-primary/5 transition-all cursor-pointer overflow-hidden h-full flex flex-col"
                            >
                                {/* Zebra Essence Decorative Pattern */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--primary)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/[0.01] rounded-full blur-3xl group-hover:bg-[var(--primary)]/5 transition-colors duration-700" />
                                
                                <div className="absolute top-0 right-0 w-24 h-24 bg-black/[0.01] rounded-bl-[2rem] transition-transform group-hover:scale-110" />
                                
                                <div className="flex items-start justify-between mb-5">
                                    <div className="w-12 h-12 bg-[var(--muted)] rounded-[var(--radius-md)] flex items-center justify-center text-[var(--muted-foreground)]/30 group-hover:bg-[var(--primary)] group-hover:text-white transition-all duration-500 shadow-[var(--shadow-sm)] relative overflow-hidden">
                                        <RiFileTextLine size={20} className="relative z-10" />
                                        {item.parentResumeId && (
                                            <div className="absolute top-0 left-0 w-full h-full bg-[var(--primary)]/10 group-hover:bg-white/10" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {getVersionsForRoot(item.id).length > 0 && (
                                            <button 
                                                onClick={(e) => openVersions(e, item)}
                                                className="px-1.5 py-1 bg-[var(--primary)]/5 text-[var(--primary)] rounded-[var(--radius-sm)] flex items-center gap-1 hover:bg-[var(--primary)]/10 transition-all border border-[var(--primary)]/10 group/version"
                                            >
                                                <RiHistoryLine size={12} />
                                                <span className="text-[0.6rem] font-bold uppercase tracking-wider">{getVersionsForRoot(item.id).length}</span>
                                            </button>
                                        )}
                                        {duplicatingId === item.id ? (
                                            <div className="w-8 h-8 flex items-center justify-center">
                                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={(e) => handleDuplicate(e, item.id)}
                                                title="Duplicate Resume"
                                                className="w-8 h-8 flex items-center justify-center text-[var(--muted-foreground)]/20 hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 rounded-[var(--radius-sm)] transition-all"
                                            >
                                                <RiFileCopyLine size={16} />
                                            </button>
                                        )}
                                        <button className="w-8 h-8 flex items-center justify-center text-muted-foreground/20 hover:text-foreground hover:bg-muted rounded-[var(--radius-sm)] transition-all">
                                            <RiMore2Fill size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3.5 flex-grow">
                                    <div>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h4 className="font-bold text-[var(--foreground)] tracking-tight group-hover:text-[var(--primary)] transition-colors text-sm line-clamp-1">{item.title}</h4>
                                            {item.parentResumeId && (
                                                <RiHistoryLine className="text-[var(--primary)]/40" size={10} title="Versioned Resume" />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[0.65rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
                                            <RiTimeLine size={10} />
                                            {formatTimeAgo(item.date)}
                                        </div>
                                    </div>

                                    {(item.targetRole || item.targetCompany) && (
                                        <div className="flex flex-col gap-1 pt-1">
                                            {item.targetRole && (
                                                <div className="flex items-center gap-2 px-2 py-1 bg-[var(--muted)] rounded-[var(--radius-sm)] border border-[var(--border-subtle)]">
                                                    <RiBriefcaseLine size={10} className="text-[var(--muted-foreground)]" />
                                                    <span className="text-[0.65rem] font-bold text-[var(--muted-foreground)] truncate">{item.targetRole}</span>
                                                </div>
                                            )}
                                            {item.targetCompany && (
                                                <div className="flex items-center gap-2 px-2 py-1 bg-[var(--muted)] rounded-[var(--radius-sm)] border border-[var(--border-subtle)]">
                                                    <RiBuilding4Line size={10} className="text-[var(--muted-foreground)]" />
                                                    <span className="text-[0.65rem] font-bold text-[var(--muted-foreground)] truncate">{item.targetCompany}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between pt-3 border-t border-border-subtle mt-auto">
                                        <div className="flex items-center gap-1.5">
                                            {item.hasAnalysis ? (
                                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-[var(--success)]/5 rounded-[var(--radius-sm)] border border-[var(--success)]/10">
                                                    <RiCheckboxCircleLine className="text-[var(--success)]" size={10} />
                                                    <span className="text-[0.6rem] font-bold text-[var(--success)] uppercase tracking-widest">Analyzed</span>
                                                </div>
                                            ) : (
                                                <span className="text-[0.6rem] font-bold text-[var(--muted-foreground)]/60 uppercase tracking-widest">Draft</span>
                                            )}
                                        </div>
                                        <RiArrowRightSLine className="text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all" size={14} />
                                    </div>
                                </div>
                            </Link>
                        </m.div>
                    ))}
                </AnimatePresence>
            </div>

            <ResumeVersionsModal 
                isOpen={versionModal.isOpen}
                onCloseAction={() => setVersionModal({ ...versionModal, isOpen: false })}
                parentTitle={versionModal.parentTitle}
                versions={versionModal.versions}
            />

            {finalRoots.length > 4 && (
                <div className="flex justify-center pt-6">
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="px-8 py-3 bg-[var(--background)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] text-[0.7rem] font-bold uppercase tracking-wider text-[var(--foreground)] hover:bg-[var(--secondary)] hover:text-white transition-all shadow-sm flex items-center gap-2.5 active:scale-95"
                    >
                        {isExpanded ? "Collapse Vault" : `View All ${finalRoots.length} Resumes`}
                        <m.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ type: "spring", stiffness: 300 }}>
                            <RiArrowRightSLine size={14} className={isExpanded ? "" : "rotate-90"} />
                        </m.div>
                    </button>
                </div>
            )}
        </div>
    );
}
