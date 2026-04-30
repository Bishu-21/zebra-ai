"use client";

import React, { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { 
    RiCloseCircleLine, 
    RiCheckboxCircleLine, 
    RiErrorWarningLine, 
    RiBarChartLine, 
    RiFlashlightLine, 
    RiInformationLine,
    RiMagicLine,
    RiArrowDropDownLine,
    RiLoader4Line,
    RiArrowRightLine,
    RiFileTextLine,
    RiFocus3Line,
    RiArrowRightSLine
} from "react-icons/ri";
import { useRouter } from "next/navigation";

export interface Resume {
    id: string;
    title: string;
    [key: string]: unknown;
}

interface TailorAnalysis {
    matchScore: number;
    roleFit: string;
    keywordsFound: string[];
    keywordsMissing: string[];
    tailoringSuggestions: string[];
}

export function TailorResume({ resumes }: { resumes: Resume[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        resumeId: resumes[0]?.id || "",
        jobDescription: "",
    });
    const [scanStep, setScanStep] = useState("");
    const [analysis, setAnalysis] = useState<TailorAnalysis | null>(null);
    const router = useRouter();

    const refreshDashboard = () => {
        try {
            router.refresh();
        } catch {
            setError("Analysis completed, but the dashboard could not refresh automatically.");
        }
    };

    const handleTailor = async () => {
        if (!formData.resumeId || !formData.jobDescription) {
            setError("Please select a resume and paste the job description.");
            return;
        }

        setLoading(true);
        setError(null);
        
        const steps = ["Parsing Job Requirements...", "Identifying Skill Gaps...", "Cross-Referencing Experience...", "Generating Tailoring Recommendations..."];
        let stepIdx = 0;
        setScanStep(steps[0]);
        const stepInterval = setInterval(() => {
            stepIdx++;
            if (stepIdx < steps.length) setScanStep(steps[stepIdx]);
        }, 1500);

        try {
            const res = await fetch("/api/ai/tailor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await res.json();

            if (data.success) {
                setTimeout(() => {
                    setAnalysis(data.analysis);
                    clearInterval(stepInterval);
                    setScanStep("Tailoring Complete.");
                    refreshDashboard();
                }, 800);
            } else {
                setError(data.error || "Tailoring failed.");
                clearInterval(stepInterval);
            }
        } catch {
            setError("Analysis failed. High traffic or invalid job description detected.");
            clearInterval(stepInterval);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Launcher Card */}
            <div 
                onClick={() => setIsOpen(true)}
                className="group/card relative overflow-hidden flex flex-col justify-between w-full h-full cursor-pointer transition-all p-10 bg-background border border-border-subtle rounded-[var(--radius-xl)] hover:shadow-2xl hover:shadow-black/[0.03] active:scale-[0.99] group"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-black/[0.01] rounded-bl-[4rem] group-hover/card:scale-110 transition-transform" />
                
                <div className="flex items-start justify-between mb-8">
                    <div className="w-14 h-14 bg-muted rounded-[var(--radius-md)] flex items-center justify-center text-muted-foreground/40 group-hover/card:bg-primary group-hover/card:text-white transition-all duration-500">
                        <RiFocus3Line size={24} />
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                        <span className="text-[0.6rem] font-bold uppercase tracking-widest text-accent-gray">Resume Optimization</span>
                        <RiArrowRightSLine size={14} className="text-primary" />
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-2xl mb-2 text-foreground tracking-tighter">Role Match</h3>
                    <p className="text-[0.65rem] text-accent-gray font-bold uppercase tracking-[0.1em] leading-relaxed">
                        Analyze Profile Alignment <br/> with Job Requirements
                    </p>
                </div>
            </div>

            {/* Tool Modal */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10">
                        <m.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                            onClick={() => !loading && setIsOpen(false)}
                        ></m.div>
                        
                        <m.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative bg-background/90 backdrop-blur-xl w-full max-w-5xl max-h-[90vh] rounded-[var(--radius-xl)] shadow-2xl border border-white/50 flex flex-col overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-10 border-b border-border-subtle flex items-center justify-between bg-background/40 backdrop-blur-3xl sticky top-0 z-20">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-primary rounded-[var(--radius-lg)] flex items-center justify-center text-white shadow-2xl shadow-primary/20">
                                        <RiFlashlightLine size={28} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1.5">
                                            <h2 className="text-2xl font-bold text-foreground tracking-tighter uppercase leading-none">Role Match Analysis</h2>
                                        </div>
                                        <p className="text-[0.7rem] font-bold text-accent-gray uppercase tracking-widest text-black/30">
                                            Analyzing Profile <span className="mx-2 opacity-50">&amp;</span> Job Alignment
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => !loading && setIsOpen(false)} className="w-12 h-12 flex items-center justify-center text-black/20 hover:text-black hover:bg-black/[0.03] rounded-full transition-all disabled:opacity-30" disabled={loading}>
                                    <RiCloseCircleLine size={24} />
                                </button>
                            </div>

                            <div className="flex-grow overflow-y-auto p-10 no-scrollbar relative">
                                {!analysis ? (
                                    <div className="max-w-4xl mx-auto space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <label className="text-[0.65rem] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                                                    <RiFileTextLine size={14} />
                                                    Base Profile
                                                </label>
                                                <div className="relative">
                                                    <select 
                                                        className="w-full bg-muted border-2 border-transparent focus:border-primary/20 rounded-[var(--radius-md)] px-6 py-5 text-sm font-bold outline-none transition-all appearance-none cursor-pointer text-foreground"
                                                        value={formData.resumeId}
                                                        onChange={(e) => setFormData({...formData, resumeId: e.target.value})}
                                                    >
                                                        {resumes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                                                        {resumes.length === 0 && <option value="">No Resumes Found</option>}
                                                    </select>
                                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-black/30">
                                                        <RiArrowDropDownLine size={24} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3 relative">
                                            <label className="text-[0.65rem] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                                                <RiInformationLine size={14} />
                                                Target Job Description
                                            </label>
                                            
                                            {/* Input Area */}
                                            <div className="relative group/input overflow-hidden rounded-[var(--radius-xl)] border border-border-subtle shadow-inner bg-muted/20">
                                                {/* Cinematic Scan Animation Overlay */}
                                                <AnimatePresence>
                                                    {loading && (
                                                        <m.div 
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0 }}
                                                            className="absolute inset-0 z-30 pointer-events-none overflow-hidden rounded-[var(--radius-xl)]"
                                                        >
                                                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[4px]"></div>
                                                            
                                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                                                                <div className="scale-150 text-foreground/80">
                                                                    <RiLoader4Line className="animate-spin" size={40} />
                                                                </div>
                                                                <div className="flex flex-col items-center gap-2">
                                                                    <span className="text-sm font-bold uppercase tracking-[0.2em] text-foreground animate-pulse">{scanStep}</span>
                                                                    <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                                                                        <m.div 
                                                                            className="h-full bg-primary"
                                                                            initial={{ width: "0%" }}
                                                                            animate={{ width: "100%" }}
                                                                            transition={{ duration: 6, ease: "linear" }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </m.div>
                                                    )}
                                                </AnimatePresence>

                                                <textarea 
                                                    placeholder="Paste the full job requirements from the recruiter..."
                                                    className={`w-full min-h-[350px] px-8 py-8 text-[0.95rem] font-medium outline-none transition-all resize-none leading-relaxed text-foreground bg-transparent ${loading ? "blur-[2px]" : ""}`}
                                                    value={formData.jobDescription}
                                                    onChange={(e) => setFormData({...formData, jobDescription: e.target.value})}
                                                    disabled={loading}
                                                />
                                            </div>
                                        </div>

                                        {error && (
                                            <m.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-error text-white p-6 rounded-[var(--radius-md)] flex items-center gap-3 text-sm font-black uppercase tracking-wider shadow-xl"
                                            >
                                                <RiErrorWarningLine size={24} />
                                                {error}
                                            </m.div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-500 max-w-4xl mx-auto">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="bg-foreground text-background p-8 rounded-[var(--radius-xl)] flex flex-col justify-between aspect-square md:aspect-auto shadow-2xl shadow-black/20">
                                                <p className="text-[0.65rem] font-bold uppercase tracking-widest text-background/40 mb-2 text-center">Match Potential</p>
                                                <h3 className="text-7xl font-bold text-primary text-center">{analysis.matchScore}%</h3>
                                                <div className="mt-4 w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                                    <m.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${analysis.matchScore}%` }}
                                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                                        className="h-full bg-white" 
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="md:col-span-2 bg-background border border-border-subtle p-10 rounded-[var(--radius-xl)] flex flex-col justify-center shadow-sm">
                                                <h4 className="text-sm font-black uppercase tracking-widest mb-4 text-muted-foreground/30">Role Fit Assessment</h4>
                                                <p className="text-foreground/70 leading-relaxed font-bold text-lg">
                                                    {analysis.roleFit}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-6">
                                                <h4 className="font-black flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground/30">
                                                    <RiCheckboxCircleLine size={18} className="text-success" />
                                                    Target Keywords Found
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {(analysis.keywordsFound || []).map((kw: string, i: number) => (
                                                        <span key={i} className="px-5 py-2.5 bg-success/5 text-success rounded-[var(--radius-md)] text-[0.7rem] font-black uppercase tracking-wider border border-success/10">
                                                            {kw}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <h4 className="font-black flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground/30">
                                                    <RiErrorWarningLine size={18} className="text-warning" />
                                                    Critical Profile Gaps
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {(analysis.keywordsMissing || []).map((kw: string, i: number) => (
                                                        <span key={i} className="px-5 py-2.5 bg-warning/5 text-warning rounded-[var(--radius-md)] text-[0.7rem] font-bold uppercase tracking-wider border border-warning/10">
                                                            {kw}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-muted/50 border border-border-subtle p-10 rounded-[var(--radius-xl)]">
                                            <h4 className="font-black text-foreground flex items-center gap-3 mb-8 uppercase tracking-widest text-sm">
                                                <RiMagicLine size={20} className="text-foreground/60" />
                                                Priority Recommendations
                                            </h4>
                                            <div className="grid grid-cols-1 gap-4">
                                                {(analysis.tailoringSuggestions || []).map((tip: string, i: number) => (
                                                    <div key={i} className="flex items-start gap-6 p-6 bg-background rounded-[var(--radius-md)] border border-border-subtle hover:border-primary/20 transition-all group">
                                                        <span className="w-10 h-10 bg-primary text-white rounded-[var(--radius-sm)] flex items-center justify-center text-xs font-bold shadow-lg flex-shrink-0">
                                                            0{i + 1}
                                                        </span>
                                                        <p className="text-[0.9rem] font-bold text-foreground/70 leading-relaxed pt-1">
                                                            {tip}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-8 border-t border-border-subtle flex items-center justify-between bg-background/30 backdrop-blur-xl sticky bottom-0">
                                <div className="flex items-center gap-3 px-6 py-3 bg-muted rounded-[var(--radius-md)] border border-border-subtle">
                                    <RiBarChartLine size={18} className="text-foreground/60 theme-pulse" />
                                    <span className="text-[0.65rem] font-black uppercase tracking-widest text-muted-foreground">Analysis Hub</span>
                                </div>

                                <div className="flex items-center gap-4">
                                    {!analysis ? (
                                        <>
                                            <button 
                                                onClick={() => setIsOpen(false)}
                                                className="px-8 py-4 text-[0.7rem] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={handleTailor}
                                                disabled={loading || !formData.jobDescription.trim()}
                                                className="bg-primary text-white px-10 py-5 rounded-[var(--radius-md)] font-bold text-sm hover:bg-primary-dark hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-primary/20 disabled:opacity-30 flex items-center gap-3"
                                            >
                                                {loading ? "Analyzing Alignment..." : "Run Analysis"}
                                                {!loading && <RiArrowRightLine size={18} />}
                                            </button>
                                        </>
                                    ) : (
                                        <button 
                                            onClick={() => {
                                                setAnalysis(null);
                                                setIsOpen(false);
                                            }}
                                            className="bg-primary text-white px-12 py-5 rounded-[var(--radius-md)] font-bold text-sm hover:bg-primary-dark hover:scale-[1.02] transition-all shadow-2xl shadow-primary/20 uppercase tracking-widest"
                                        >
                                            Close Report
                                        </button>
                                    )}
                                </div>
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
