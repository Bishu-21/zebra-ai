"use client";

import React, { useState } from "react";
import { 
    RiBarChartGroupedLine, 
    RiFlashlightLine, 
    RiTimer2Line, 
    RiArrowRightSLine,
    RiUploadCloud2Line
} from "react-icons/ri";
import { ResumeResultsModal } from "./ResumeResultsModal";
import { m } from "framer-motion";
import { useRouter } from "next/navigation";

interface InsightItem {
    id: string;
    type: "analysis" | "tailoring" | "import";
    title: string;
    subtext: string;
    date: Date;
    score: number;
    fullData: any; // Raw feedback from DB
}

interface InsightsFeedProps {
    data: InsightItem[];
}

export function InsightsFeed({ data }: InsightsFeedProps) {
    const router = useRouter();
    const [selectedInsight, setSelectedInsight] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpenModal = (insight: InsightItem) => {
        if (insight.type === "import") {
            router.push(`/dashboard/resumes/${insight.id}`);
            return;
        }
        const feedback = insight.fullData || {};
        
        const normalizedData = {
            score: insight.score,
            summary: feedback.summary || feedback.recommendations || "Analysis complete.",
            metrics: feedback.metrics || {
                impact: feedback.impact || 0,
                formatting: feedback.formatting || 0,
                ats: feedback.ats || 0,
                branding: feedback.branding || 0
            },
            strengths: feedback.strengths || [],
            weaknesses: feedback.weaknesses || [],
            actionItems: feedback.actionItems || [],
            suggestedBulletPoints: feedback.suggestedBulletPoints || feedback.intelligenceRewrites || []
        };

        setSelectedInsight(normalizedData);
        setIsModalOpen(true);
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
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {data.map((item) => (
                    <m.div 
                        key={item.id} 
                        whileHover={{ y: -3, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleOpenModal(item)}
                        className="flex flex-col p-8 bg-white border border-black/[0.04] rounded-[2.2rem] transition-all cursor-pointer group shadow-sm relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-black/[0.01] rounded-bl-[4rem] -mr-8 -mt-8 transition-transform group-hover:scale-110 group-hover:bg-[#3B82F6]/[0.02]" />
                        
                        <div className="flex items-start justify-between mb-8">
                            <div className="flex items-center gap-5">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm ${
                                    item.type === "import" 
                                        ? "bg-[#3B82F6] text-white shadow-blue-500/20" 
                                        : "bg-black/[0.03] text-[#737373]/40 group-hover:bg-[#3B82F6] group-hover:text-white group-hover:shadow-blue-500/20"
                                }`}>
                                    {item.type === "analysis" ? <RiBarChartGroupedLine size={24} /> : item.type === "tailoring" ? <RiFlashlightLine size={24} /> : <RiUploadCloud2Line size={24} />}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className={`text-[0.6rem] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest w-fit shadow-sm border border-black/[0.02] ${
                                        item.type === "import" ? "bg-[#3B82F6]/10 text-[#3B82F6]" : "bg-black/[0.04] text-[#737373]/60"
                                    }`}>
                                        {item.type === "analysis" ? "Analysis Report" : item.type === "tailoring" ? "Tailoring Analysis" : "New Import"}
                                    </span>
                                    <p className="text-[0.55rem] font-bold text-[#737373]/40 flex items-center gap-1.5 uppercase tracking-widest">
                                        <RiTimer2Line size={12} className="text-[#3B82F6]/40" />
                                        {formatTimeAgo(item.date)}
                                    </p>
                                </div>
                            </div>

                            {item.type !== "import" && (
                                <div className="flex flex-col items-end gap-2">
                                    <div className="flex items-baseline gap-1">
                                        <m.span 
                                            initial={{ scale: 0.9 }}
                                            animate={{ scale: 1 }}
                                            className="text-4xl font-black text-[#0A0A0A] tracking-tighter group-hover:text-[#3B82F6] transition-colors leading-none"
                                        >
                                            {item.score}
                                        </m.span>
                                        <span className="text-[0.7rem] font-bold text-black/10 tracking-tighter uppercase">Pts</span>
                                    </div>
                                    <div className={`px-2 py-0.5 rounded-md text-[0.5rem] font-black uppercase tracking-widest border ${
                                        item.score > 80 
                                            ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/10" 
                                            : "bg-amber-500/5 text-amber-600 border-amber-500/10"
                                    }`}>
                                        {item.score > 80 ? "Optimized" : "Needs Review"}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex-grow mb-6">
                            <h4 className="font-bold text-[#0A0A0A] group-hover:text-[#3B82F6] transition-colors tracking-tight text-lg leading-tight line-clamp-1 mb-3">
                                {item.title}
                            </h4>
                            
                            {item.fullData?.actionItems && item.fullData.actionItems.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-4 bg-[#3B82F6] rounded-full" />
                                        <span className="text-[0.6rem] font-bold text-[#737373] uppercase tracking-widest">Priority Improvement:</span>
                                    </div>
                                    <p className="text-[0.7rem] font-medium text-black/60 line-clamp-1 italic">
                                        "{item.fullData.actionItems[0].checkpoint || item.fullData.actionItems[0]}"
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center justify-between pt-6 border-t border-black/[0.03]">
                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-1">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-5 h-5 rounded-full bg-black/[0.04] border-2 border-white flex items-center justify-center">
                                            <div className={`w-1 h-1 rounded-full ${i === 1 ? 'bg-[#3B82F6]' : 'bg-black/20'}`} />
                                        </div>
                                    ))}
                                </div>
                                <span className="text-[0.55rem] font-bold text-[#737373]/40 uppercase tracking-widest">Analysis Insight Available</span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-black/[0.03] flex items-center justify-center text-[#737373]/40 group-hover:bg-[#3B82F6] group-hover:text-white transition-all flex-shrink-0 shadow-sm">
                                <RiArrowRightSLine size={18} />
                            </div>
                        </div>
                    </m.div>
                ))}
            </div>

            {isModalOpen && selectedInsight && (
                <ResumeResultsModal 
                    isOpen={isModalOpen}
                    onCloseAction={() => setIsModalOpen(false)}
                    data={selectedInsight}
                />
            )}
        </>
    );
}
