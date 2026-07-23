"use client";

import React, { useState } from "react";
import { 
    RiFileTextLine, 
    RiSearchLine, 
    RiArrowRightSLine, 
    RiTimeLine,
    RiCheckboxCircleLine,
    RiMagicLine,
    RiBuildingLine,
    RiBriefcaseLine
} from "react-icons/ri";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { ResumeResultsModal } from "./ResumeResultsModal";
import type { ResumeAnalysisData } from "@/components/compiler/types";

interface ResumeVersion {
    id: string;
    title: string;
    company: string | null;
    targetRole: string | null;
    matchScore: number | null;
    createdAt: Date;
}

interface Resume {
    id: string;
    title: string;
    date: Date;
    hasAnalysis: boolean;
    parentResumeId?: string | null;
    targetRole?: string | null;
    targetCompany?: string | null;
    versions?: ResumeVersion[];
    latestAnalysis?: {
        score: number;
        feedback: ResumeAnalysisData;
    };
}

interface ResumeVaultProps {
    items: Resume[];
}

export function ResumeVault({ items }: ResumeVaultProps) {
    const [search, setSearch] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
    const [selectedAnalysisData, setSelectedAnalysisData] = useState<ResumeAnalysisData | null>(null);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    const rootResumes = items.filter(r => !r.parentResumeId);
    const versions = items.filter(r => !!r.parentResumeId);

    const rootIds = new Set(rootResumes.map(r => r.id));
    const ghostRoots = versions.filter(v => v.parentResumeId && !rootIds.has(v.parentResumeId));
    
    const finalRoots = [...rootResumes, ...ghostRoots].filter(item => 
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.targetRole?.toLowerCase().includes(search.toLowerCase()) ||
        item.targetCompany?.toLowerCase().includes(search.toLowerCase())
    );

    const displayedItems = isExpanded ? finalRoots : finalRoots.slice(0, 4);

    function formatTimeAgo(date: Date) {
        if (!isMounted) return "---";
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
        
        if (diffInSeconds < 60) return "Just now";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }

    return (
        <div className="space-y-6">
            {/* Clean Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200/70">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl md:text-2xl font-bold text-[#0A0A0A] tracking-tight">Resume Vault</h2>
                    <span className="text-xs font-medium text-neutral-400">({items.length} resumes)</span>
                </div>

                <div className="relative group">
                    <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-[#0A0A0A] transition-colors" size={16} />
                    <input 
                        type="text"
                        placeholder="Search your vault..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-neutral-100/70 border border-neutral-200/80 rounded-xl pl-10 pr-4 py-2 text-xs font-medium outline-none focus:bg-white focus:border-[#0A0A0A] focus:ring-2 focus:ring-black/5 transition-all w-full sm:w-64"
                    />
                </div>
            </div>

            {/* Resume Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <AnimatePresence mode="popLayout">
                    {displayedItems.map((item) => (
                        <m.div
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            key={item.id}
                            className="h-full"
                        >
                            <Link 
                                href={`/dashboard/resumes/${item.id}`}
                                className="group relative bg-white border border-neutral-200/80 p-6 rounded-3xl hover:border-neutral-300 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden h-full min-h-[170px] flex flex-col justify-between shadow-xs"
                            >
                                {/* Card Header */}
                                <div>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-600 group-hover:bg-[#0A0A0A] group-hover:text-white transition-colors duration-300 shadow-2xs">
                                            <RiFileTextLine size={20} />
                                        </div>
                                        <RiArrowRightSLine className="text-neutral-400 group-hover:text-[#0A0A0A] group-hover:translate-x-1 transition-all" size={18} />
                                    </div>

                                    <h4 className="font-bold text-[#0A0A0A] tracking-tight text-base line-clamp-1 mb-1">{item.title}</h4>
                                    <div className="flex items-center gap-1.5 text-xs font-normal text-neutral-400">
                                        <RiTimeLine size={13} />
                                        <span>{formatTimeAgo(item.date)}</span>
                                    </div>
                                </div>

                                {/* Card Footer Badges */}
                                <div className="flex items-center justify-between pt-4 mt-4 border-t border-neutral-200/60">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {item.hasAnalysis && (
                                            <button
                                                onClick={(e) => {
                                                    if (item.latestAnalysis) {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setSelectedResumeId(item.id);
                                                        setSelectedAnalysisData(item.latestAnalysis.feedback);
                                                    }
                                                }}
                                                className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 text-[#0A0A0A] rounded-lg border border-neutral-200/80 transition-colors hover:bg-neutral-200/60"
                                            >
                                                <RiCheckboxCircleLine className="text-[#0A0A0A]" size={12} />
                                                <span className="text-[11px] font-semibold">
                                                    {item.latestAnalysis ? `${item.latestAnalysis.score} pts` : "Reviewed"}
                                                </span>
                                            </button>
                                        )}

                                        {item.versions && item.versions.length > 0 && (
                                            <div className="flex items-center gap-1 px-2.5 py-1 bg-neutral-100 rounded-lg border border-neutral-200/80 text-[#0A0A0A]">
                                                <RiMagicLine size={12} />
                                                <span className="text-[11px] font-semibold">
                                                    {item.versions.length} {item.versions.length === 1 ? "Version" : "Versions"}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        </m.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* View All Resumes Action Button */}
            {finalRoots.length > 4 && (
                <div className="flex justify-center pt-6">
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="px-6 py-2.5 bg-white border border-neutral-200/80 rounded-xl text-xs font-semibold text-[#0A0A0A] hover:bg-neutral-50 hover:border-neutral-300 transition-all shadow-xs flex items-center gap-2 active:scale-95"
                    >
                        {isExpanded ? "Collapse Vault" : `View All ${finalRoots.length} Resumes`}
                        <m.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ type: "spring", stiffness: 300 }}>
                            <RiArrowRightSLine size={14} className={isExpanded ? "" : "rotate-90"} />
                        </m.div>
                    </button>
                </div>
            )}

            {/* Saved Tailored Versions Grid Section */}
            {items.some(i => i.versions && i.versions.length > 0) && (
                <div className="mt-12 pt-8 border-t border-neutral-200/60">
                    <div className="flex items-center gap-2 mb-6">
                        <h3 className="text-lg font-bold text-[#0A0A0A]">Recent Tailored Versions</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {items
                            .flatMap(item => (item.versions || []).map(v => ({ ...v, resumeId: item.id })))
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .slice(0, 6)
                            .map(version => (
                                <div 
                                    key={version.id}
                                    className="group relative bg-white border border-neutral-200/80 p-5 rounded-2xl hover:border-neutral-300 hover:shadow-md transition-all flex flex-col shadow-xs"
                                >
                                    <div className="flex-grow">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 bg-neutral-100 rounded-lg flex items-center justify-center text-[#0A0A0A] group-hover:bg-[#0A0A0A] group-hover:text-white transition-colors">
                                                    <RiMagicLine size={14} />
                                                </div>
                                                <span className="text-xs font-semibold text-neutral-500">Tailored Version</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {version.matchScore !== null && (
                                                    <span className="text-xs font-bold text-[#0A0A0A] bg-neutral-100 px-2 py-0.5 rounded-full border border-neutral-200/70">
                                                        {version.matchScore}%
                                                    </span>
                                                )}
                                                <span className="text-[11px] font-medium text-neutral-400">
                                                    {formatTimeAgo(version.createdAt)}
                                                </span>
                                            </div>
                                        </div>

                                        <h5 className="font-bold text-sm text-[#0A0A0A] mb-2 line-clamp-1">{version.title}</h5>
                                        
                                        <div className="flex flex-wrap gap-2 mb-2 text-xs text-neutral-500 font-normal">
                                            {version.company && (
                                                <div className="flex items-center gap-1">
                                                    <RiBuildingLine size={12} />
                                                    <span>{version.company}</span>
                                                </div>
                                            )}
                                            {version.targetRole && (
                                                <div className="flex items-center gap-1">
                                                    <RiBriefcaseLine size={12} />
                                                    <span>{version.targetRole}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-neutral-200/60 flex justify-end">
                                        <Link 
                                            href={`/dashboard/resumes/${version.resumeId}?version=${version.id}`}
                                            className="text-xs font-semibold text-[#0A0A0A] hover:underline flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity"
                                        >
                                            Open <RiArrowRightSLine size={12} />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}
            {selectedAnalysisData && (
                <ResumeResultsModal
                    isOpen={!!selectedAnalysisData}
                    onCloseAction={() => {
                        setSelectedAnalysisData(null);
                        setSelectedResumeId(null);
                    }}
                    resumeId={selectedResumeId || undefined}
                    data={selectedAnalysisData}
                />
            )}
        </div>
    );
}
