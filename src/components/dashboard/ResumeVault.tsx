"use client";

import React, { useState } from "react";
import { 
    RiFileTextLine, 
    RiSearchLine, 
    RiArrowRightSLine, 
    RiMore2Fill,
    RiTimeLine,
    RiCheckboxCircleLine,
    RiMagicLine,
    RiBuildingLine,
    RiBriefcaseLine
} from "react-icons/ri";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";

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
    versions?: ResumeVersion[];
}

interface ResumeVaultProps {
    items: Resume[];
}

export function ResumeVault({ items }: ResumeVaultProps) {
    const [search, setSearch] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);

    const filteredItems = items.filter(item => 
        item.title.toLowerCase().includes(search.toLowerCase())
    );

    const displayedItems = isExpanded ? filteredItems : filteredItems.slice(0, 4);

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-black/[0.04]">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-primary rounded-full" />
                    <h3 className="text-xl font-bold text-[#0A0A0A] tracking-tight">Resume Vault</h3>
                    <span className="px-2 py-0.5 bg-black/[0.03] text-[#737373] text-[0.6rem] font-bold rounded-md uppercase tracking-widest border border-black/[0.02]">
                        {items.length} Units
                    </span>
                </div>

                <div className="relative group">
                    <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-primary transition-colors" size={16} />
                    <input 
                        type="text"
                        placeholder="Search your vault..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-black/[0.02] border border-black/[0.03] rounded-2xl pl-11 pr-6 py-3 text-sm font-medium outline-none focus:bg-white focus:border-primary/30 focus:shadow-xl focus:shadow-blue-500/5 transition-all w-full md:w-72"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
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
                                className="group relative block bg-white border border-black/[0.04] p-8 rounded-[2.5rem] hover:shadow-2xl hover:shadow-black/[0.02] transition-all cursor-pointer overflow-hidden"
                            >
                                {/* Zebra Essence Decorative Pattern */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/[0.01] rounded-full blur-3xl group-hover:bg-primary/5 transition-colors duration-700" />
                                
                                <div className="absolute top-0 right-0 w-24 h-24 bg-black/[0.01] rounded-bl-[3rem] transition-transform group-hover:scale-110" />
                                
                                <div className="flex items-start justify-between mb-8">
                                    <div className="w-14 h-14 bg-black/[0.03] rounded-2xl flex items-center justify-center text-[#737373]/30 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm">
                                        <RiFileTextLine size={24} />
                                    </div>
                                    <button className="w-8 h-8 flex items-center justify-center text-black/10 hover:text-black hover:bg-black/[0.03] rounded-lg transition-all">
                                        <RiMore2Fill size={18} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-bold text-[#0A0A0A] tracking-tight group-hover:text-primary transition-colors text-base line-clamp-1 mb-1">{item.title}</h4>
                                        <div className="flex items-center gap-2 text-[0.55rem] font-bold text-[#737373]/40 uppercase tracking-widest">
                                            <RiTimeLine size={12} />
                                            {formatTimeAgo(item.date)}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-black/[0.02]">
                                        <div className="flex items-center gap-2">
                                            {item.hasAnalysis ? (
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/5 rounded-md border border-emerald-500/10">
                                                    <RiCheckboxCircleLine className="text-emerald-500" size={10} />
                                                    <span className="text-[0.5rem] font-black text-emerald-600 uppercase tracking-widest">Analyzed</span>
                                                </div>
                                            ) : (
                                                <span className="text-[0.5rem] font-black text-black/20 uppercase tracking-widest">Draft</span>
                                            )}

                                            {item.versions && item.versions.length > 0 && (
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/5 rounded-md border border-primary/10">
                                                    <RiMagicLine className="text-primary" size={10} />
                                                    <span className="text-[0.5rem] font-black text-primary uppercase tracking-widest">
                                                        {item.versions.length} Versions
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <RiArrowRightSLine className="text-black/10 group-hover:text-primary group-hover:translate-x-1 transition-all" size={16} />
                                    </div>
                                </div>
                            </Link>
                            
                            {/* Saved Versions (Compact) */}
                            {item.versions && item.versions.length > 0 && (
                                <div className="mt-3 px-2 space-y-2">
                                    {item.versions.map(v => (
                                        <div key={v.id} className="bg-white border border-black/[0.04] rounded-2xl p-3.5 flex flex-col gap-2 hover:border-primary/20 hover:shadow-md transition-all">
                                            <div className="flex justify-between items-start gap-2">
                                                <span className="text-[0.75rem] font-bold text-[#0A0A0A] line-clamp-1">{v.title}</span>
                                                {v.matchScore !== null && (
                                                    <span className="text-[0.65rem] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                                                        {v.matchScore}%
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.65rem] font-medium text-[#737373]">
                                                {v.company && (
                                                    <span className="flex items-center gap-1">
                                                        <RiBuildingLine size={12} /> {v.company}
                                                    </span>
                                                )}
                                                {v.targetRole && (
                                                    <span className="flex items-center gap-1">
                                                        <RiBriefcaseLine size={12} /> {v.targetRole}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-end mt-1">
                                                <div className="text-[0.55rem] font-bold text-[#737373]/50 uppercase tracking-widest">
                                                    {formatTimeAgo(v.createdAt)}
                                                </div>
                                                <Link 
                                                    href={`/dashboard/resumes/${item.id}?version=${v.id}`}
                                                    className="text-[0.6rem] font-bold text-primary hover:underline flex items-center gap-0.5"
                                                >
                                                    Open <RiArrowRightSLine size={10} />
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </m.div>
                    ))}
                </AnimatePresence>
            </div>

            {filteredItems.length > 4 && (
                <div className="flex justify-center pt-8">
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="px-10 py-4 bg-white border border-black/[0.06] rounded-2xl text-[0.7rem] font-black uppercase tracking-[0.2em] text-[#0A0A0A] hover:bg-black hover:text-white transition-all shadow-sm flex items-center gap-3 active:scale-95"
                    >
                        {isExpanded ? "Collapse Vault" : `View All ${items.length} Resumes`}
                        <m.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ type: "spring", stiffness: 300 }}>
                            <RiArrowRightSLine size={16} className={isExpanded ? "" : "rotate-90"} />
                        </m.div>
                    </button>
                </div>
            )}

            {/* Stripe Versions Section */}
            {items.some(i => i.versions && i.versions.length > 0) && (
                <div className="mt-16 pt-10 border-t border-black/[0.04]">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-1.5 h-5 bg-black/20 rounded-full" />
                        <h4 className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-black/40">Recent Tailored Versions</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {items
                            .flatMap(item => (item.versions || []).map(v => ({ ...v, resumeId: item.id })))
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .slice(0, 6)
                            .map(version => (
                                <div 
                                    key={version.id}
                                    className="group relative bg-black/[0.01] border border-black/[0.03] p-6 rounded-3xl hover:bg-white hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all flex flex-col"
                                >
                                    <div className="flex-grow">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-black/5 rounded-lg flex items-center justify-center text-black/20 group-hover:bg-primary group-hover:text-white transition-all">
                                                    <RiMagicLine size={14} />
                                                </div>
                                                <span className="text-[0.55rem] font-black uppercase tracking-widest text-black/30 group-hover:text-primary transition-colors">Tailored Version</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {version.matchScore !== null && (
                                                    <div className="px-2 py-0.5 bg-primary/10 rounded-full">
                                                        <span className="text-[0.6rem] font-black text-primary">{version.matchScore}%</span>
                                                    </div>
                                                )}
                                                <span className="text-[0.55rem] font-bold text-black/20 uppercase tracking-widest">
                                                    {formatTimeAgo(version.createdAt)}
                                                </span>
                                            </div>
                                        </div>

                                        <h5 className="font-bold text-sm text-black mb-3 line-clamp-1 group-hover:text-primary transition-colors">{version.title}</h5>
                                        
                                        <div className="flex flex-wrap gap-3 mb-2">
                                            {version.company && (
                                                <div className="flex items-center gap-1.5 text-[0.6rem] font-bold text-black/40">
                                                    <RiBuildingLine size={12} />
                                                    {version.company}
                                                </div>
                                            )}
                                            {version.targetRole && (
                                                <div className="flex items-center gap-1.5 text-[0.6rem] font-bold text-black/40">
                                                    <RiBriefcaseLine size={12} />
                                                    {version.targetRole}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-black/[0.03] flex justify-end">
                                        <Link 
                                            href={`/dashboard/resumes/${version.resumeId}?version=${version.id}`}
                                            className="text-[0.65rem] font-bold text-primary hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            Open <RiArrowRightSLine size={12} />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}
