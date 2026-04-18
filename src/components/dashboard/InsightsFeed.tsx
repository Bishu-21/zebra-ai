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
                impact: insight.score,
                formatting: insight.score,
                ats: insight.score,
                branding: insight.score
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {data.map((item) => (
                    <m.div 
                        key={item.id} 
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleOpenModal(item)}
                        className="flex items-center justify-between p-8 bg-white/40 backdrop-blur-md rounded-2xl border border-black/5 hover:bg-white/60 hover:shadow-xl transition-all cursor-pointer group shadow-sm"
                    >
                        <div className="flex items-center gap-6">
                            <div className={`w-14 h-14 rounded-xl border border-black/5 flex items-center justify-center transition-all ${
                                item.type === "import" 
                                    ? "bg-[#3B82F6]/5 text-[#3B82F6] border-[#3B82F6]/10" 
                                    : "bg-black/[0.03] text-[#737373]/60 group-hover:bg-[#3B82F6] group-hover:text-white group-hover:border-[#3B82F6]"
                            } shadow-sm`}>
                                {item.type === "analysis" ? <RiBarChartGroupedLine size={22} /> : item.type === "tailoring" ? <RiFlashlightLine size={22} /> : <RiUploadCloud2Line size={22} />}
                            </div>
                            <div>
                                <h4 className="font-bold text-[#0A0A0A] group-hover:translate-x-1 transition-transform tracking-tight text-lg">{item.title}</h4>
                                <div className="flex items-center gap-4 mt-2">
                                    <span className={`text-[0.75rem] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                                        item.type === "import" ? "bg-[#3B82F6]/10 text-[#3B82F6]" : "bg-black/[0.03] text-[#737373]"
                                    }`}>
                                        {item.type === "analysis" ? "Diagnostic Report" : item.type === "tailoring" ? "Targeted Alignment" : "New Import"}
                                    </span>
                                    <p className="text-[0.7rem] font-bold text-[#737373]/50 items-center gap-1.5 flex uppercase tracking-widest">
                                        <RiTimer2Line size={14} />
                                        {formatTimeAgo(item.date)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                            {item.type !== "import" ? (
                                <div className="flex flex-col items-end">
                                    <span className="text-2xl font-bold text-[#0A0A0A] tracking-tighter group-hover:text-[#3B82F6] transition-colors">{item.score}%</span>
                                    <span className="text-[0.7rem] font-bold text-[#737373]/50 uppercase tracking-widest leading-none">Match Score</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-end">
                                    <span className="text-[0.65rem] font-bold text-[#3B82F6] uppercase tracking-[0.2em] mb-1">View Content</span>
                                    <div className="h-1 w-12 bg-[#3B82F6]/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#3B82F6] w-full" />
                                    </div>
                                </div>
                            )}
                            <div className="w-10 h-10 rounded-2xl bg-black/[0.03] flex items-center justify-center text-[#737373]/60 group-hover:bg-[#3B82F6] group-hover:text-white transition-all shadow-sm">
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
