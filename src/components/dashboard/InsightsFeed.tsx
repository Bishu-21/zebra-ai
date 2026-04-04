"use client";

import React, { useState } from "react";
import { 
    RiBarChartGroupedLine, 
    RiFlashlightLine, 
    RiTimer2Line, 
    RiArrowRightSLine 
} from "react-icons/ri";
import { ResumeResultsModal } from "./ResumeResultsModal";
import { motion } from "framer-motion";

interface InsightItem {
    id: string;
    type: "analysis" | "tailoring";
    title: string;
    subtext: string;
    date: Date;
    score: number;
    fullData: any; // The raw feedback from DB
}

interface InsightsFeedProps {
    data: InsightItem[];
}

export function InsightsFeed({ data }: InsightsFeedProps) {
    const [selectedInsight, setSelectedInsight] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpenModal = (insight: InsightItem) => {
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
                    <motion.div 
                        key={item.id} 
                        whileHover={{ scale: 1.01, backgroundColor: "rgba(255, 255, 255, 0.5)" }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleOpenModal(item)}
                        className="flex items-center justify-between p-8 bg-white/40 backdrop-blur-md rounded-2xl border border-black/5 hover:shadow-xl transition-all cursor-pointer group shadow-sm"
                    >
                        <div className="flex items-center gap-6">
                            <div className={`w-14 h-14 rounded-xl border border-black/5 flex items-center justify-center transition-all bg-black/[0.03] text-black/70 group-hover:bg-black group-hover:text-white`}>
                                {item.type === "analysis" ? <RiBarChartGroupedLine size={22} /> : <RiFlashlightLine size={22} />}
                            </div>
                            <div>
                                <h4 className="font-bold text-black group-hover:translate-x-1 transition-transform tracking-tight text-lg">{item.title}</h4>
                                <div className="flex items-center gap-4 mt-2">
                                    <span className={`text-[0.75rem] font-bold px-3 py-1 rounded-full uppercase tracking-wider bg-black/5 text-black/70`}>
                                        {item.type === "analysis" ? "Direct Analysis" : "Role Matching"}
                                    </span>
                                    <p className="text-[0.7rem] font-bold text-black/50 items-center gap-1.5 flex uppercase tracking-widest">
                                        <RiTimer2Line size={14} />
                                        {formatTimeAgo(item.date)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col items-end">
                                <span className="text-2xl font-black text-black tracking-tighter">{item.score}%</span>
                                <span className="text-[0.7rem] font-bold text-black/40 uppercase tracking-widest leading-none">Match Score</span>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-black/5 flex items-center justify-center text-black/70 group-hover:bg-black group-hover:text-white transition-all shadow-sm">
                                <RiArrowRightSLine size={18} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <ResumeResultsModal 
                isOpen={isModalOpen}
                onCloseAction={() => setIsModalOpen(false)}
                data={selectedInsight}
            />
        </>
    );
}
