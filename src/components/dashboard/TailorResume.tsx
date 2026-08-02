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
import { useToast } from "@/components/ui/Toast";
import { RiSaveLine, RiBuildingLine, RiBriefcaseLine, RiRefreshLine } from "react-icons/ri";
import { getErrorMessage } from "@/lib/async-error-handler";

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
    tailoredResumeContent?: string;
    executiveSummary?: string;
}

export function TailorResume({ resumes }: { resumes: Resume[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        resumeId: resumes[0]?.id || "",
        jobDescription: "",
        company: "",
        targetRole: "",
    });
    const [savingVersion, setSavingVersion] = useState(false);
    const { showToast } = useToast();
    const [scanStep, setScanStep] = useState("");
    const [analysis, setAnalysis] = useState<TailorAnalysis | null>(null);
    const router = useRouter();

    const refreshDashboard = () => {
        try {
            router.refresh();
        } catch (err) {
            const msg = getErrorMessage(err, "Dashboard refresh failed");
            setError(msg);
        }
    };

    const handleTailor = async () => {
        if (loading) return;

        if (!formData.resumeId || !formData.jobDescription.trim()) {
            const msg = "Please select a base profile and enter the target job description.";
            setError(msg);
            showToast(msg, "error");
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

            if (res.ok && data.success) {
                setTimeout(() => {
                    setAnalysis(data.analysis);
                    clearInterval(stepInterval);
                    setScanStep("Tailoring Complete.");
                    showToast("Role match analysis complete!", "success");
                    refreshDashboard();
                }, 800);
            } else {
                const msg = data.error || "Role match analysis failed.";
                setError(msg);
                showToast(msg, "error");
                clearInterval(stepInterval);
            }
        } catch (err) {
            const msg = getErrorMessage(err, "Analysis failed. Please check network connection and try again.");
            setError(msg);
            showToast(msg, "error");
            clearInterval(stepInterval);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveVersion = async () => {
        if (savingVersion) return;
        if (!formData.resumeId || !formData.jobDescription || !analysis) return;
        
        const baseResume = resumes.find(r => r.id === formData.resumeId);
        if (!baseResume) return;

        setSavingVersion(true);
        try {
            const res = await fetch("/api/resume-versions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    resumeId: formData.resumeId,
                    title: `Tailored for ${formData.company || formData.targetRole || 'Job'}`,
                    company: formData.company,
                    targetRole: formData.targetRole,
                    jobDescription: formData.jobDescription,
                    content: analysis.tailoredResumeContent || JSON.stringify({ baseContent: baseResume.content, tailoringAnalysis: analysis }),
                    matchScore: analysis.matchScore,
                    feedback: analysis
                }),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                showToast("Version saved successfully!", "success");
                router.refresh();
            } else {
                const msg = data.error || "Failed to save version";
                showToast(msg, "error");
            }
        } catch (err) {
            const msg = getErrorMessage(err, "Connection error. Try again later.");
            showToast(msg, "error");
        } finally {
            setSavingVersion(false);
        }
    };

    return (
        <>
            {/* Launcher Card */}
            <div 
                onClick={() => setIsOpen(true)}
                className="group/card relative overflow-hidden flex flex-col justify-between w-full h-full cursor-pointer transition-all p-7 bg-white border border-neutral-200/80 rounded-3xl hover:border-neutral-300 hover:shadow-xl active:scale-[0.99] group shadow-xs"
            >
                <div className="flex items-start justify-between mb-8">
                    <div className="w-11 h-11 bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-600 group-hover/card:bg-[#0A0A0A] group-hover/card:text-white transition-colors duration-300">
                        <RiFocus3Line size={22} />
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                        <span className="text-xs font-semibold text-neutral-500">Job Matcher</span>
                        <RiArrowRightSLine size={16} className="text-[#0A0A0A]" />
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-xl mb-1.5 text-[#0A0A0A] tracking-tight">How well does this fit the job?</h3>
                    <p className="text-xs text-neutral-500 font-normal leading-relaxed">
                        Match your experience against specific job descriptions.
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
                            <div className="p-6 sm:p-10 border-b border-black/[0.03] flex items-center justify-between bg-white/40 backdrop-blur-3xl sticky top-0 z-20">
                                <div className="flex items-center gap-4 sm:gap-6">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary rounded-[1rem] sm:rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-black/10">
                                        <RiFlashlightLine size={24} className="sm:size-[28px]" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1.5">
                                            <h2 className="text-lg sm:text-2xl font-bold text-foreground tracking-tighter uppercase leading-none">Role Match Analysis</h2>
                                        </div>
                                        <p className="text-[0.6rem] sm:text-[0.7rem] font-bold text-accent-gray uppercase tracking-widest text-black/30">
                                            Analyzing Profile <span className="mx-2 opacity-50">&amp;</span> Job Alignment
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => !loading && setIsOpen(false)} className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-black/20 hover:text-black hover:bg-black/[0.03] rounded-full transition-all disabled:opacity-30" disabled={loading}>
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
                                                        disabled={loading}
                                                        className="w-full bg-muted border-2 border-transparent focus:border-primary/20 rounded-[var(--radius-md)] px-6 py-5 text-sm font-bold outline-none transition-all appearance-none cursor-pointer text-foreground disabled:opacity-50"
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

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-3">
                                                    <label className="text-[0.65rem] font-black uppercase tracking-widest text-black/40 flex items-center gap-2">
                                                        <RiBuildingLine size={14} />
                                                        Company
                                                    </label>
                                                    <input 
                                                        type="text"
                                                        disabled={loading}
                                                        placeholder="e.g. Google"
                                                        className="w-full bg-black/5 border-2 border-transparent focus:border-black/10 rounded-2xl px-6 py-5 text-sm font-bold outline-none transition-all text-black disabled:opacity-50"
                                                        value={formData.company}
                                                        onChange={(e) => setFormData({...formData, company: e.target.value})}
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[0.65rem] font-black uppercase tracking-widest text-black/40 flex items-center gap-2">
                                                        <RiBriefcaseLine size={14} />
                                                        Role
                                                    </label>
                                                    <input 
                                                        type="text"
                                                        disabled={loading}
                                                        placeholder="e.g. Frontend Dev"
                                                        className="w-full bg-black/5 border-2 border-transparent focus:border-black/10 rounded-2xl px-6 py-5 text-sm font-bold outline-none transition-all text-black disabled:opacity-50"
                                                        value={formData.targetRole}
                                                        onChange={(e) => setFormData({...formData, targetRole: e.target.value})}
                                                    />
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
                                                    className={`w-full min-h-[300px] sm:min-h-[350px] px-6 sm:px-8 py-6 sm:py-8 text-[0.85rem] sm:text-[0.95rem] font-medium outline-none transition-all resize-none leading-relaxed text-black bg-transparent ${loading ? "blur-[2px]" : ""}`}
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
                                                className="bg-error text-white p-6 rounded-[var(--radius-md)] flex items-center justify-between gap-4 text-sm font-black uppercase tracking-wider shadow-xl"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <RiErrorWarningLine size={24} className="shrink-0" />
                                                    <span>{error}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleTailor}
                                                    disabled={loading}
                                                    className="px-4 py-2 bg-white text-error rounded-xl font-extrabold text-xs uppercase tracking-wider hover:bg-white/90 transition-all flex items-center gap-1.5 shrink-0 shadow-sm disabled:opacity-50"
                                                >
                                                    <RiRefreshLine size={16} />
                                                    Retry
                                                </button>
                                            </m.div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-500 max-w-4xl mx-auto">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="bg-[#0A0A0A] text-white p-8 rounded-[2.5rem] flex flex-col justify-between aspect-square md:aspect-auto shadow-2xl shadow-black/20">
                                                <p className="text-[0.65rem] font-bold uppercase tracking-widest text-white/40 mb-2 text-center">Match Potential</p>
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
                                                    <div key={i} className="flex items-start gap-6 p-6 bg-white rounded-2xl border border-black/5 hover:border-black/20 transition-all group">
                                                        <span className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center text-xs font-bold shadow-lg flex-shrink-0">
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
                            <div className="p-6 sm:p-8 border-t border-black/5 flex flex-col sm:flex-row items-center justify-between bg-white/30 backdrop-blur-xl sticky bottom-0 gap-4">
                                <div className="flex items-center gap-3 px-6 py-3 bg-black/5 rounded-2xl border border-black/5 w-full sm:w-auto justify-center sm:justify-start">
                                    <RiBarChartLine size={18} className="text-black/60 theme-pulse" />
                                    <span className="text-[0.65rem] font-black uppercase tracking-widest text-[#737373]">Analysis Hub</span>
                                </div>

                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                    {!analysis ? (
                                        <>
                                            <button 
                                                onClick={() => setIsOpen(false)}
                                                className="flex-grow sm:flex-grow-0 px-8 py-4 text-[0.7rem] font-black uppercase tracking-widest text-black/40 hover:text-black transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={handleTailor}
                                                disabled={loading || !formData.jobDescription.trim()}
                                                className="flex-grow sm:flex-grow-0 bg-primary text-white px-10 py-5 rounded-[1.25rem] font-bold text-sm hover:bg-primary-dark hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-black/10 disabled:opacity-30 flex items-center justify-center gap-3"
                                            >
                                                {loading ? "Analyzing..." : "Run Analysis"}
                                                {!loading && <RiArrowRightLine size={18} />}
                                            </button>
                                        </>
                                    ) : (
                                        <div className="flex flex-col sm:flex-row-reverse items-center gap-3 w-full sm:w-auto">
                                            <button 
                                                onClick={handleSaveVersion}
                                                disabled={savingVersion}
                                                className="w-full sm:w-auto bg-primary text-white px-8 py-5 rounded-[1.25rem] font-bold text-sm hover:bg-primary-dark hover:scale-[1.02] transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-3 disabled:opacity-50"
                                            >
                                                {savingVersion ? (
                                                    <RiLoader4Line className="animate-spin" size={20} />
                                                ) : (
                                                    <RiSaveLine size={20} />
                                                )}
                                                {savingVersion ? "Saving..." : "Save Version"}
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setAnalysis(null);
                                                    setIsOpen(false);
                                                }}
                                                className="w-full sm:w-auto bg-black/5 text-black/60 hover:text-black hover:bg-black/10 px-12 py-5 rounded-[1.25rem] font-bold text-[0.7rem] transition-all uppercase tracking-widest"
                                            >
                                                Close
                                            </button>
                                        </div>
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
