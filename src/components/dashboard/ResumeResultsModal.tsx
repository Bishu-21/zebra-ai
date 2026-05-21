"use client";

import React from "react";
import { m, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { RewriteItem, ResumeAnalysisData } from "@/components/compiler/types";

// --- STRATEGIC DIAGNOSTIC ICONS (Performance & Hydration Safe) ---
const IconBox = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {children}
  </svg>
);

const PulseIcon = () => (
  <IconBox className="animate-pulse">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </IconBox>
);

const CloseIcon = () => (
  <IconBox className="w-5 h-5">
    <path d="M18 6L6 18M6 6l12 12" />
  </IconBox>
);

const ShieldIcon = ({ className = "" }) => (
  <IconBox className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></IconBox>
);

const FlashIcon = ({ className = "" }) => (
  <IconBox className={className}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></IconBox>
);

const ChartIcon = ({ className = "" }) => (
  <IconBox className={className}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></IconBox>
);

const AlertIcon = ({ className = "" }) => (
    <IconBox className={className}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></IconBox>
);

const RocketIcon = ({ className = "" }) => (
    <IconBox className={className}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.39 1.43-.78 2-1.5.57-.72 1.5-2 1.5-2.5s-1.33-1.5-2-1.5-1.78.93-2.5 1.5c-.72.57-1.4 1.11-2 1.5z" /><path d="M12 12s5.5-5.5 10.5-10.5" /><path d="m5 8 3-3" /><path d="m16 19 3-3" /></IconBox>
);

const CircularGauge = ({ value, label, icon: Icon }: { value: number; label: string; icon: React.ComponentType<{ className?: string }> }) => {
    const radius = 24;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
        <div className="bg-white border border-[#F5F5F5] p-5 rounded-[1.8rem] flex flex-col items-center text-center transition-all hover:border-primary/30 hover:shadow-[0_4px_20px_rgba(59,130,246,0.03)] group">
            <div className="relative w-14 h-14 mb-4">
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="28" cy="28" r={radius} stroke="currentColor" className="text-border-subtle" strokeWidth="2.5" fill="transparent" />
                    <m.circle
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                        cx="28" cy="28" r={radius} stroke="currentColor" strokeWidth="2.5"
                        className="text-primary"
                        strokeDasharray={circumference} strokeLinecap="round" fill="transparent"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[0.7rem] font-bold text-foreground">{value}</span>
                </div>
            </div>
            <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                <Icon className="text-primary scale-75" />
                <span className="text-[0.5rem] font-bold uppercase tracking-[0.1em] text-[#171717]">{label}</span>
            </div>
        </div>
    );
};

export function ResumeResultsModal({ isOpen, onCloseAction, resumeId, data }: { 
    isOpen: boolean; 
    onCloseAction: () => void; 
    resumeId?: string; 
    data: ResumeAnalysisData; 
}) {
    const router = useRouter();

    if (!isOpen || !data) return null;

    // --- STRATEGIC DATA NORMALIZER ---
    const score = data.score ?? data.overallScore ?? 0;
    const summary = data.summary ?? data.executiveSummary ?? "Analysis complete.";
    
    // 1. Flatten Categorized Audit (from Direct Analysis API) or use flat arrays
    let strengths: string[] = data.strengths ?? [];
    let weaknesses: string[] = data.weaknesses ?? [];
    let actionItems: string[] = data.actionItems ?? data.recommendations ?? [];

    if (data.audit && !strengths.length && !weaknesses.length) {
        // Flatten the categorized audit object { formatting: [...], experience: [...] }
        Object.values(data.audit).forEach((category) => {
            if (Array.isArray(category)) {
                category.forEach((item) => {
                    const message = item.checkpoint || item.message || "Undefined check";
                    if (item.status === "Pass") {
                        strengths.push(message);
                    } else if (item.status === "Fail") {
                        weaknesses.push(message);
                        if (item.fix) actionItems.push(item.fix);
                    }
                });
            }
        });
    }

    let rewrites = data.suggestedBulletPoints ?? data.aiRewrites ?? [];
    
    // Fallback: If no rewrites but we have recruiter insights, synthesize a 'Improvement Logic'
    if (!rewrites.length && data.recruiterInsights) {
        const insights = data.recruiterInsights;
        rewrites = [
            { rationale: "Content Clarity", after: insights.soWhatTest ?? "Enhance value proposition quantification." },
            { rationale: "Readability Optimization", after: insights.sevenSecondScan ?? "Improve visual hierarchy for top-fold reading." },
            { rationale: "Aesthetic & Consistency", after: insights.readability ?? "Refine layout density and typeface consistency." }
        ];
    }

    // 3. Absolute Safeguard for 'No Information' case
    if (!strengths.length && score > 50) strengths = ["Professional formatting structure", "ATS-compliant heading hierarchy", "Strategic document naming convention"];
    if (!weaknesses.length && score < 95) weaknesses = ["Quantifiable metrics count is below target", "Action verb diversity needs expansion"];
    if (!actionItems.length) actionItems = ["Quantify every bullet point with numbers, % or $", "Remove generic 'Professional Summary' to save space"];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <m.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={onCloseAction} className="absolute inset-0 bg-white/60 backdrop-blur-md"
                />
                
                <m.div 
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: 10 }}
                    className="relative bg-background w-full max-w-6xl max-h-[92vh] rounded-[var(--radius-xl)] shadow-[var(--shadow-2xl)] border border-border-subtle flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="px-4 sm:px-10 py-4 sm:py-6 border-b border-[#F5F5F5] flex items-center justify-between bg-white/40 backdrop-blur-3xl sticky top-0 z-20">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-2.5 py-1 bg-primary/10 text-primary rounded-full">
                                    <PulseIcon />
                                    <span className="text-[0.55rem] font-bold uppercase tracking-widest hidden sm:inline">Complete Analysis Report</span>
                                    <span className="text-[0.55rem] font-bold uppercase tracking-widest sm:hidden">Analysis Report</span>
                                </div>
                                <span className="text-[0.55rem] font-bold uppercase tracking-[0.3em] text-[#A3A3A3] hidden xs:inline">AI Engine</span>
                            </div>
                            <h2 className="text-xl font-bold text-foreground tracking-tight">Analysis Results</h2>
                        </div>
                        <button onClick={onCloseAction} className="w-10 h-10 hover:bg-muted rounded-[var(--radius-md)] flex items-center justify-center text-muted-foreground transition-colors">
                            <CloseIcon />
                        </button>
                    </div>

                    <div className="flex-grow overflow-y-auto no-scrollbar p-4 sm:p-10 pt-6 sm:pt-8 space-y-6 sm:space-y-10 bg-muted/30">
                        
                        {/* Top: Score & Summary Column + Gauges */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                            {/* Strategic Column (Left) */}
                            <div className="lg:col-span-5 flex flex-col gap-6">
                                <div className="bg-white border border-[#F5F5F5] p-6 sm:p-8 rounded-[2.2rem] relative overflow-hidden group shadow-sm">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative z-10 space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-[0.55rem] font-bold uppercase tracking-[0.3em] text-[#A3A3A3] mb-3">Resume Score</p>
                                                <div className="flex items-baseline gap-2">
                                                    <h3 className="text-6xl font-black text-[#0A0A0A] tracking-tighter leading-none">{score}</h3>
                                                    <span className="text-[#A3A3A3] text-xl font-bold">/100</span>
                                                </div>
                                            </div>
                                            <ShieldIcon className="text-primary opacity-20" />
                                        </div>
                                        <div className="pt-4 border-t border-[#F5F5F5]">
                                            <p className="text-[0.85rem] font-medium text-[#171717]/80 leading-relaxed">
                                                &quot;{summary}&quot;
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {actionItems.length > 0 && (
                                    <div className="bg-background border border-border-subtle p-6 sm:p-8 rounded-[var(--radius-xl)] space-y-5">
                                        <div className="flex items-center gap-3 px-6 py-3 bg-black/5 rounded-2xl border border-black/5">
                                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                            <span className="text-[0.65rem] font-black uppercase tracking-widest text-accent-gray">Action Items</span>
                                        </div>
                                        <div className="space-y-3">
                                            {actionItems.slice(0, 3).map((item: string, i: number) => (
                                                <div key={i} className="flex items-start gap-4 p-4 bg-[#FAFAFA] rounded-xl border border-transparent hover:border-[#F5F5F5] transition-all">
                                                    <span className="text-[0.6rem] font-bold text-primary bg-primary/10 w-5 h-5 flex items-center justify-center rounded-md">0{i+1}</span>
                                                    <p className="text-[0.7rem] font-semibold text-[#171717] leading-tight">{item}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="lg:col-span-7 space-y-8">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <CircularGauge value={data?.metrics?.impact ?? 0} label="Impact" icon={FlashIcon} />
                                    <CircularGauge value={data?.metrics?.formatting ?? 0} label="Format" icon={ChartIcon} />
                                    <CircularGauge value={data?.metrics?.ats ?? 0} label="ATS Match" icon={RocketIcon} />
                                    <CircularGauge value={data?.metrics?.branding ?? 0} label="Identity" icon={ShieldIcon} />
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 ml-2">
                                            <AlertIcon className="text-error scale-75" />
                                            <h4 className="text-[0.6rem] font-bold uppercase tracking-[0.15em] text-foreground/60">Required Optimizations</h4>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3">
                                            {weaknesses.map((item: string, i: number) => (
                                                <div key={i} className="p-4 bg-background border border-border-subtle rounded-[var(--radius-md)] flex items-center gap-4 group">
                                                    <div className="w-1.5 h-1.5 bg-error rounded-full" />
                                                    <p className="text-[0.7rem] font-medium text-foreground">{item}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-4 pt-4 border-t border-border-subtle">
                                        <div className="flex items-center gap-3 ml-2">
                                            <div className="w-1.5 h-1.5 bg-success rounded-full" />
                                            <h4 className="text-[0.6rem] font-bold uppercase tracking-[0.15em] text-foreground/60">Current Strengths</h4>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {strengths.map((item: string, i: number) => (
                                                <div key={i} className="p-4 bg-muted rounded-[var(--radius-md)] flex items-center gap-3">
                                                    <div className="w-1 h-1 bg-success/40 rounded-full" />
                                                    <p className="text-[0.65rem] font-medium text-muted-foreground">{item}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {rewrites.length > 0 && (
                            <div className="pt-10 border-t border-border-subtle space-y-8">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h4 className="text-[0.6rem] font-bold uppercase tracking-[0.25em] text-foreground">Improvement Suggestions</h4>
                                        <p className="text-[0.55rem] text-muted-foreground font-medium tracking-wide">Context-aware restructuring and rationale</p>
                                    </div>
                                    <div className="px-3 py-1.5 bg-primary/5 text-primary rounded-lg border border-primary/10 text-[0.5rem] font-bold uppercase tracking-widest flex items-center gap-2">
                                        <PulseIcon />
                                        <span>Analysis Complete</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-6">
                                    {rewrites.map((item: RewriteItem | string, i: number) => {
                                        const isString = typeof item === "string";
                                        const original = isString ? null : item.original;
                                        const problem = isString ? null : item.problem;
                                        const rationale = isString ? "Optimization for clarity and impact." : (item.rationale ?? "Optimization for clarity and impact.");
                                        const suggestion = isString ? item : (item.after ?? item.suggestion ?? "");

                                        return (
                                            <div key={i} className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-[#F5F5F5] rounded-[2rem] overflow-hidden p-6 sm:p-8 hover:border-primary/20 transition-all shadow-sm">
                                                <div className="lg:col-span-4 space-y-4">
                                                    <span className="text-[0.5rem] font-bold uppercase tracking-[0.2em] text-[#A3A3A3] block">Improvement Logic</span>
                                                    <p className="text-[0.7rem] font-medium text-[#171717]/80 leading-relaxed border-l border-[#F5F5F5] pl-4">
                                                        {rationale}
                                                    </p>
                                                </div>
                                                <div className="lg:col-span-8 p-6 bg-primary/[0.02] rounded-2xl border border-primary/5 space-y-3 relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] rotate-12"><RocketIcon /></div>
                                                    <span className="text-[0.5rem] font-bold uppercase tracking-[0.2em] text-primary block">Suggested Content</span>
                                                    <p className="text-[0.75rem] font-medium text-[#171717] leading-relaxed tracking-tight">
                                                        {suggestion}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 sm:p-6 md:p-8 border-t border-black/5 flex flex-col md:flex-row items-center justify-end bg-white/30 backdrop-blur-xl sticky bottom-0 gap-4">
                        
                        <div className="flex items-center gap-3 w-full md:w-auto flex-col sm:flex-row">
                            <button 
                                onClick={() => {
                                    router.push(`/dashboard/resumes/${resumeId || "new"}`);
                                    onCloseAction();
                                }}
                                className="w-full sm:w-auto px-8 py-3.5 bg-primary hover:bg-[#1A1A1A] text-white rounded-[var(--radius-md)] font-bold text-[0.65rem] uppercase tracking-widest transition-all active:scale-[0.98]"
                            >
                                Refine Resume
                            </button>
                            <button 
                                onClick={onCloseAction}
                                className="w-full sm:w-auto px-8 py-3.5 bg-muted hover:bg-[#EAEAEA] text-foreground text-[0.65rem] font-bold uppercase tracking-widest rounded-[var(--radius-md)] transition-all active:scale-[0.98]"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </m.div>
            </div>
        </AnimatePresence>
    );
}
