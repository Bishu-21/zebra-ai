"use client";

import React, { useState } from "react";
import { 
    RiFileTextLine, 
    RiSearchLine, 
    RiArrowRightSLine, 
    RiMore2Fill,
    RiTimeLine,
    RiCheckboxCircleLine
} from "react-icons/ri";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";

interface Resume {
    id: string;
    title: string;
    date: Date;
    hasAnalysis: boolean;
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
                    <div className="w-2 h-8 bg-[#3B82F6] rounded-full" />
                    <h3 className="text-xl font-bold text-[#0A0A0A] tracking-tight">Resume Vault</h3>
                    <span className="px-2 py-0.5 bg-black/[0.03] text-[#737373] text-[0.6rem] font-bold rounded-md uppercase tracking-widest border border-black/[0.02]">
                        {items.length} Units
                    </span>
                </div>

                <div className="relative group">
                    <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-[#3B82F6] transition-colors" size={16} />
                    <input 
                        type="text"
                        placeholder="Search your vault..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-black/[0.02] border border-black/[0.03] rounded-2xl pl-11 pr-6 py-3 text-sm font-medium outline-none focus:bg-white focus:border-[#3B82F6]/30 focus:shadow-xl focus:shadow-blue-500/5 transition-all w-full md:w-72"
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
                                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/[0.01] rounded-full blur-3xl group-hover:bg-[#3B82F6]/5 transition-colors duration-700" />
                                
                                <div className="absolute top-0 right-0 w-24 h-24 bg-black/[0.01] rounded-bl-[3rem] transition-transform group-hover:scale-110" />
                                
                                <div className="flex items-start justify-between mb-8">
                                    <div className="w-14 h-14 bg-black/[0.03] rounded-2xl flex items-center justify-center text-[#737373]/30 group-hover:bg-[#3B82F6] group-hover:text-white transition-all duration-500 shadow-sm">
                                        <RiFileTextLine size={24} />
                                    </div>
                                    <button className="w-8 h-8 flex items-center justify-center text-black/10 hover:text-black hover:bg-black/[0.03] rounded-lg transition-all">
                                        <RiMore2Fill size={18} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-bold text-[#0A0A0A] tracking-tight group-hover:text-[#3B82F6] transition-colors text-base line-clamp-1 mb-1">{item.title}</h4>
                                        <div className="flex items-center gap-2 text-[0.55rem] font-bold text-[#737373]/40 uppercase tracking-widest">
                                            <RiTimeLine size={12} />
                                            {formatTimeAgo(item.date)}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-black/[0.02]">
                                        <div className="flex items-center gap-1.5">
                                            {item.hasAnalysis ? (
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/5 rounded-md border border-emerald-500/10">
                                                    <RiCheckboxCircleLine className="text-emerald-500" size={10} />
                                                    <span className="text-[0.5rem] font-black text-emerald-600 uppercase tracking-widest">Analyzed</span>
                                                </div>
                                            ) : (
                                                <span className="text-[0.5rem] font-black text-black/20 uppercase tracking-widest">Draft</span>
                                            )}
                                        </div>
                                        <RiArrowRightSLine className="text-black/10 group-hover:text-[#3B82F6] group-hover:translate-x-1 transition-all" size={16} />
                                    </div>
                                </div>
                            </Link>
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
        </div>
    );
}
