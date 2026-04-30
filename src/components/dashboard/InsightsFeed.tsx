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

    const openResume = (resumeId: string) => {
        try {
            router.push(`/dashboard/resumes/${resumeId}`);
        } catch (err) {
            console.error("Failed to open resume from insights feed:", err);
        }
    };
    
    const handleOpenModal = (insight: InsightItem) => {
        // Handle Import redirects
        if (insight.type === "import") {
            openResume(insight.id);
            return;
        }

        // Handle Projects
        if (insight.type === "project") {
            setSelectedProject(insight.fullData as ProjectAnalysisData);
            setIsProjectModalOpen(true);
            return;
        }
        
        // Handle Tailoring (ATS Optimization) specific normalization
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

        // Handle Standard Analysis
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
                        whileHover={{ y: -3, boxShadow: "var(--shadow-lg)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleOpenModal(item)}
                        className="flex flex-col p-6 bg-background border border-border-subtle rounded-[var(--radius-xl)] transition-all cursor-pointer group shadow-sm relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--foreground)]/[0.01] rounded-bl-[4rem] -mr-8 -mt-8 transition-transform group-hover:scale-110 group-hover:bg-[var(--primary)]/[0.02]" />
                        
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-5">
                                <div className={`w-14 h-14 rounded-[var(--radius-lg)] flex items-center justify-center transition-all duration-500 shadow-[var(--shadow-sm)] ${
                                    item.type === "import" 
                                         ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[var(--shadow-xl)] shadow-primary/20" 
                                         : "bg-[var(--muted)] text-[var(--muted-foreground)]/40 group-hover:bg-[var(--primary)] group-hover:text-[var(--primary-foreground)] group-hover:shadow-[var(--shadow-xl)] group-hover:shadow-primary/20"
                                 }`}>
                                    {item.type === "analysis" ? <RiBarChartGroupedLine size={24} /> : item.type === "tailoring" ? <RiFlashlightLine size={24} /> : item.type === "project" ? <RiShieldCheckLine size={24} /> : <RiUploadCloud2Line size={24} />}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className={`text-[0.6rem] font-black px-2.5 py-1 rounded-[var(--radius-md)] uppercase tracking-widest w-fit shadow-sm border border-border-subtle ${
                                        item.type === "import" 
                                            ? "bg-primary/10 text-primary" 
                                            : item.type === "project" 
                                                ? "bg-success/10 text-success" 
                                                : item.type === "tailoring"
                                                    ? "bg-warning/10 text-warning"
                                                    : "bg-muted text-muted-foreground/60"
                                    }`}>
                                        {item.type === "analysis" ? "Analysis Report" : item.type === "tailoring" ? "Tailoring Analysis" : item.type === "project" ? "Project Verification" : "New Import"}
                                    </span>
                                    <p className="text-[0.55rem] font-bold text-[var(--muted-foreground)]/40 flex items-center gap-1.5 uppercase tracking-widest">
                                        <RiTimer2Line size={12} className="text-[var(--primary)]/40" />
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
                                            className="text-4xl font-black text-[var(--foreground)] tracking-tighter group-hover:text-[var(--primary)] transition-colors leading-none"
                                        >
                                            {item.score}
                                        </m.span>
                                        <span className="text-[0.7rem] font-bold text-[var(--foreground)]/10 tracking-tighter uppercase">Pts</span>
                                    </div>
                                    <div className={`px-2 py-0.5 rounded-[var(--radius-md)] text-[0.5rem] font-black uppercase tracking-widest border ${
                                        item.score > 80 
                                            ? "bg-success/5 text-success border-success/10" 
                                            : "bg-warning/5 text-warning border-warning/10"
                                    }`}>
                                        {item.score > 80 ? "Optimized" : "Needs Review"}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex-grow mb-6">
                            <h4 className="font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors tracking-tight text-lg leading-tight break-all line-clamp-1 mb-3">
                                {item.title}
                            </h4>
                            
                            {('actionItems' in item.fullData || 'criticalGaps' in item.fullData) && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-4 bg-primary rounded-full" />
                                        <span className="text-[0.6rem] font-bold text-muted-foreground uppercase tracking-widest">
                                            {item.type === "tailoring" ? "Critical Match Gap:" : "Priority Improvement:"}
                                        </span>
                                    </div>
                                    <p className="text-[0.7rem] font-medium text-[var(--foreground)]/60 line-clamp-1 italic">
                                        &quot;{
                                            ('actionItems' in item.fullData ? item.fullData.actionItems?.[0] : undefined) || 
                                            ('criticalGaps' in item.fullData ? item.fullData.criticalGaps?.[0] : undefined) || 
                                            'View details in full report'
                                        }&quot;
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center justify-between pt-6 border-t border-border-subtle">
                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-1">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-5 h-5 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                                            <div className={`w-1 h-1 rounded-full ${i === 1 ? 'bg-primary' : 'bg-foreground/20'}`} />
                                        </div>
                                    ))}
                                </div>
                                <span className="text-[0.55rem] font-bold text-muted-foreground/40 uppercase tracking-widest">Analysis Insight Available</span>
                            </div>
                             <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-[var(--muted)] flex items-center justify-center text-[var(--muted-foreground)]/40 group-hover:bg-[var(--primary)] group-hover:text-[var(--primary-foreground)] transition-all flex-shrink-0 shadow-[var(--shadow-sm)]">
                                <RiArrowRightSLine size={18} />
                            </div>
                        </div>
                    </m.div>
                ))}
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
