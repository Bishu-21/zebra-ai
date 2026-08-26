"use client";

import React, { useState } from "react";
import { ResumeAnalysisData } from "@/components/compiler/types";
import { 
    RiBarChartGroupedLine, 
    RiFlashlightLine, 
    RiTimer2Line, 
    RiArrowRightSLine,
    RiUploadCloud2Line,
    RiShieldCheckLine
} from "react-icons/ri";
import { ResumeResultsModal } from "./ResumeResultsModal";
import { ProjectResultsModal } from "./ProjectResultsModal";
import { ProjectAnalysisData } from "./ProjectAnalysisResults";
import { m } from "framer-motion";
import { useRouter } from "next/navigation";
import { useHydrated } from "@/hooks/useHydrated";

export interface TailoringData {
    matchScore: number;
    keywordsFound: string[];
    keywordsMissing: string[];
    roleFit: string;
    criticalGaps: string[];
    tailoringSuggestions: string[];
    executiveSummary: string;
}

interface InsightItem {
    id: string;
    type: "analysis" | "tailoring" | "import" | "project";
    title: string;
    subtext: string;
    date: Date;
    score: number;
    fullData: ResumeAnalysisData | ProjectAnalysisData | TailoringData;
}

interface InsightsFeedProps {
    data: InsightItem[];
}

export function InsightsFeed({ data }: InsightsFeedProps) {
    const router = useRouter();
    const [selectedResume, setSelectedResume] = useState<ResumeAnalysisData | null>(null);
    const [selectedProject, setSelectedProject] = useState<ProjectAnalysisData | null>(null);
    const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const isMounted = useHydrated();

    const openResume = (resumeId: string) => {
        try {
            router.push(`/dashboard/resumes/${resumeId}`);
        } catch (err) {
            console.error("Failed to open resume from insights feed:", err);
        }
    };
    
    const handleOpenModal = (insight: InsightItem) => {
        if (insight.type === "import") {
            openResume(insight.id);
            return;
        }

        if (insight.type === "project") {
            setSelectedProject(insight.fullData as ProjectAnalysisData);
            setIsProjectModalOpen(true);
            return;
        }
        
        if (insight.type === "tailoring") {
            const feedback = insight.fullData as TailoringData;
            const normalizedData: ResumeAnalysisData = {
                score: insight.score,
                summary: (feedback.executiveSummary || "ATS Tailoring complete.") as string,
                metrics: {
                    impact: feedback.matchScore ?? insight.score,
                    formatting: 85, 
                    ats: insight.score,
                    branding: 75
                },
                strengths: feedback.keywordsFound || [],
                weaknesses: feedback.keywordsMissing || [],
                actionItems: feedback.criticalGaps || [],
                suggestedBulletPoints: (feedback.tailoringSuggestions || []).map((s: string) => ({
                    after: s,
                    rationale: "Suggested for better job description alignment."
                }))
            };
            setSelectedResume(normalizedData);
            setIsResumeModalOpen(true);
            return;
        }

        const feedback = insight.fullData as ResumeAnalysisData;
        const normalizedData: ResumeAnalysisData = {
            score: insight.score,
            summary: (feedback.summary || feedback.recommendations?.[0] || "Analysis complete.") as string,
            metrics: feedback.metrics || {
                impact: 0,
                formatting: 0,
                ats: 0,
                branding: 0
            },
            strengths: feedback.strengths || [],
            weaknesses: feedback.weaknesses || [],
            actionItems: feedback.actionItems || [],
            suggestedBulletPoints: feedback.suggestedBulletPoints || []
        };

        setSelectedResume(normalizedData);
        setIsResumeModalOpen(true);
    };

    function formatTimeAgo(date: Date) {
        if (!isMounted) return "---";
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
        
        if (diffInSeconds < 60) return "Just now";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }

    const getTypeIcon = (type: InsightItem["type"]) => {
        switch (type) {
            case "analysis": return <RiBarChartGroupedLine size={18} />;
            case "tailoring": return <RiFlashlightLine size={18} />;
            case "project": return <RiShieldCheckLine size={18} />;
            default: return <RiUploadCloud2Line size={18} />;
        }
    };

    const getTypeLabel = (type: InsightItem["type"]) => {
        switch (type) {
            case "analysis": return "Analysis Report";
            case "tailoring": return "Tailoring Analysis";
            case "project": return "Project Check";
            default: return "New Import";
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {data.map((item) => {
                    const suggestion = ('actionItems' in item.fullData ? item.fullData.actionItems?.[0] : undefined) || 
                                       ('criticalGaps' in item.fullData ? item.fullData.criticalGaps?.[0] : undefined);

                    return (
                        <m.div 
                            key={item.id} 
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => handleOpenModal(item)}
                            className="flex flex-col justify-between p-6 bg-white border border-neutral-200/80 rounded-3xl hover:border-neutral-300 hover:shadow-xl transition-all duration-300 cursor-pointer group shadow-xs relative overflow-hidden min-h-[200px]"
                        >
                            {/* Card Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-[#0A0A0A] group-hover:bg-[#0A0A0A] group-hover:text-white transition-colors shadow-2xs shrink-0">
                                        {getTypeIcon(item.type)}
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-xs font-semibold text-[#0A0A0A]">
                                            {getTypeLabel(item.type)}
                                        </span>
                                        <div className="flex items-center gap-1 text-xs font-normal text-neutral-400">
                                            <RiTimer2Line size={13} />
                                            <span>{formatTimeAgo(item.date)}</span>
                                        </div>
                                    </div>
                                </div>

                                {item.type !== "import" && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-bold text-[#0A0A0A] tracking-tight">
                                            {item.score}
                                        </span>
                                        <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full border border-neutral-200/80">
                                            {item.score > 80 ? "High Match" : "Review"}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Card Body */}
                            <div className="flex-grow my-2">
                                <h4 className="font-bold text-[#0A0A0A] tracking-tight text-base line-clamp-1 mb-2">
                                    {item.title}
                                </h4>
                                
                                {suggestion && (
                                    <div className="bg-neutral-50/80 border border-neutral-200/60 p-3 rounded-2xl space-y-1">
                                        <span className="text-xs font-semibold text-neutral-500">Key Suggestion</span>
                                        <p className="text-xs font-normal text-neutral-600 leading-relaxed line-clamp-2">
                                            &quot;{suggestion}&quot;
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Card Footer */}
                            <div className="flex items-center justify-between pt-4 mt-2 border-t border-neutral-200/60">
                                <span className="text-xs font-medium text-neutral-400 group-hover:text-[#0A0A0A] transition-colors">
                                    View Full Report
                                </span>
                                <RiArrowRightSLine size={18} className="text-neutral-400 group-hover:text-[#0A0A0A] group-hover:translate-x-1 transition-all" />
                            </div>
                        </m.div>
                    );
                })}
            </div>

            {isResumeModalOpen && selectedResume && (
                <ResumeResultsModal 
                    isOpen={isResumeModalOpen}
                    onCloseAction={() => setIsResumeModalOpen(false)}
                    data={selectedResume}
                />
            )}

            {isProjectModalOpen && selectedProject && (
                <ProjectResultsModal
                    isOpen={isProjectModalOpen}
                    onCloseAction={() => setIsProjectModalOpen(false)}
                    data={selectedProject}
                />
            )}
        </>
    );
}
