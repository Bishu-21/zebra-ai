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
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                        <m.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-md" 
                            onClick={() => !loading && setIsOpen(false)}
                        />
                        
                        <m.div 
                            initial={{ scale: 0.96, opacity: 0, y: 12 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.96, opacity: 0, y: 12 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="relative bg-white w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl border border-neutral-200/80 flex flex-col overflow-hidden z-10"
                        >
                            {/* Header */}
                            <div className="px-6 py-5 border-b border-neutral-200/60 flex items-center justify-between bg-white sticky top-0 z-20">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center shadow-2xs shrink-0">
                                        <RiFlashlightLine size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold tracking-tight text-[#0A0A0A]">Role Match Analysis</h2>
                                        <p className="text-xs font-normal text-neutral-500">Analyze profile &amp; job description alignment</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => !loading && setIsOpen(false)} 
                                    className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-[#0A0A0A] flex items-center justify-center transition-all disabled:opacity-40" 
                                    disabled={loading}
                                >
                                    <RiCloseCircleLine size={18} />
                                </button>
                            </div>

                            <div className="flex-grow overflow-y-auto p-6 sm:p-8 space-y-6">
                                {!analysis ? (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="space-y-1.5 sm:col-span-1">
                                                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    <RiFileTextLine size={14} />
                                                    Base Profile
                                                </label>
                                                <div className="relative">
                                                    <select 
                                                        disabled={loading}
                                                        className="w-full bg-neutral-50 border border-neutral-200/80 focus:bg-white focus:border-[#0A0A0A] rounded-full px-4 py-2.5 text-xs font-semibold text-[#0A0A0A] outline-none transition-all appearance-none cursor-pointer disabled:opacity-50"
                                                        value={formData.resumeId}
                                                        onChange={(e) => setFormData({...formData, resumeId: e.target.value})}
                                                    >
                                                        {resumes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                                                        {resumes.length === 0 && <option value="">No Resumes Found</option>}
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                                                        <RiArrowDropDownLine size={20} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    <RiBuildingLine size={14} />
                                                    Company
                                                </label>
                                                <input 
                                                    type="text"
                                                    disabled={loading}
                                                    placeholder="e.g. Google"
                                                    className="w-full bg-neutral-50 border border-neutral-200/80 focus:bg-white focus:border-[#0A0A0A] rounded-full px-4 py-2.5 text-xs font-semibold text-[#0A0A0A] outline-none transition-all disabled:opacity-50"
                                                    value={formData.company}
                                                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    <RiBriefcaseLine size={14} />
                                                    Role
                                                </label>
                                                <input 
                                                    type="text"
                                                    disabled={loading}
                                                    placeholder="e.g. Frontend Dev"
                                                    className="w-full bg-neutral-50 border border-neutral-200/80 focus:bg-white focus:border-[#0A0A0A] rounded-full px-4 py-2.5 text-xs font-semibold text-[#0A0A0A] outline-none transition-all disabled:opacity-50"
                                                    value={formData.targetRole}
                                                    onChange={(e) => setFormData({...formData, targetRole: e.target.value})}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                                                <RiInformationLine size={14} />
                                                Target Job Description
                                            </label>
                                            
                                            <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-neutral-50/50">
                                                <AnimatePresence>
                                                    {loading && (
                                                        <m.div 
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0 }}
                                                            className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xs gap-4 p-6"
                                                        >
                                                            <RiLoader4Line className="animate-spin text-[#0A0A0A]" size={32} />
                                                            <div className="flex flex-col items-center gap-2 text-center">
                                                                <span className="text-xs font-bold text-[#0A0A0A]">{scanStep}</span>
                                                                <div className="w-40 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                                                                    <m.div 
                                                                        className="h-full bg-[#0A0A0A]"
                                                                        initial={{ width: "0%" }}
                                                                        animate={{ width: "100%" }}
                                                                        transition={{ duration: 6, ease: "linear" }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </m.div>
                                                    )}
                                                </AnimatePresence>

                                                <textarea 
                                                    placeholder="Paste the full job requirements from the recruiter..."
                                                    className="w-full min-h-[220px] p-4 text-xs font-medium text-[#0A0A0A] focus:outline-none transition-all resize-none leading-relaxed bg-transparent placeholder:text-neutral-400"
                                                    value={formData.jobDescription}
                                                    onChange={(e) => setFormData({...formData, jobDescription: e.target.value})}
                                                    disabled={loading}
                                                />
                                            </div>
                                        </div>

                                        {error && (
                                            <m.div 
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="p-3 bg-red-50 border border-red-200/80 rounded-xl flex items-center justify-between gap-3 text-xs font-medium text-red-700"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <RiErrorWarningLine size={16} className="shrink-0 text-red-600" />
                                                    <span>{error}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleTailor}
                                                    disabled={loading}
                                                    className="px-3 py-1.5 bg-white text-red-700 border border-red-200 rounded-full font-bold text-xs hover:bg-red-100/50 transition-all flex items-center gap-1 shrink-0"
                                                >
                                                    <RiRefreshLine size={14} />
                                                    Retry
                                                </button>
                                            </m.div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="bg-[#0A0A0A] text-white p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                                                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">Match Potential</p>
                                                <h3 className="text-5xl font-black text-white">{analysis.matchScore}%</h3>
                                                <div className="mt-3 w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                                                    <m.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${analysis.matchScore}%` }}
                                                        transition={{ duration: 1.2, ease: "easeOut" }}
                                                        className="h-full bg-emerald-400" 
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="sm:col-span-2 bg-neutral-50 border border-neutral-200/80 p-5 rounded-2xl flex flex-col justify-center">
                                                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Role Fit Assessment</h4>
                                                <p className="text-xs font-semibold text-[#0A0A0A] leading-relaxed">
                                                    {analysis.roleFit}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <h4 className="font-semibold flex items-center gap-1.5 text-xs text-neutral-500">
                                                    <RiCheckboxCircleLine size={16} className="text-emerald-600" />
                                                    Target Keywords Found
                                                </h4>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {(analysis.keywordsFound || []).map((kw: string, i: number) => (
                                                        <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-semibold border border-emerald-200/60">
                                                            {kw}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <h4 className="font-semibold flex items-center gap-1.5 text-xs text-neutral-500">
                                                    <RiErrorWarningLine size={16} className="text-amber-600" />
                                                    Critical Profile Gaps
                                                </h4>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {(analysis.keywordsMissing || []).map((kw: string, i: number) => (
                                                        <span key={i} className="px-3 py-1 bg-amber-50 text-amber-800 rounded-full text-xs font-semibold border border-amber-200/60">
                                                            {kw}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-neutral-50 border border-neutral-200/80 p-5 rounded-2xl space-y-3">
                                            <h4 className="font-bold text-xs text-[#0A0A0A] flex items-center gap-2">
                                                <RiMagicLine size={16} className="text-neutral-500" />
                                                Priority Recommendations
                                            </h4>
                                            <div className="space-y-2">
                                                {(analysis.tailoringSuggestions || []).map((tip: string, i: number) => (
                                                    <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-neutral-200/60 text-xs font-medium text-neutral-700 leading-relaxed">
                                                        <span className="w-5 h-5 bg-[#0A0A0A] text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
                                                            {i + 1}
                                                        </span>
                                                        <span>{tip}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-neutral-200/60 flex items-center justify-between bg-white sticky bottom-0 z-20 gap-3">
                                <div className="px-3 py-1.5 bg-neutral-100 rounded-full text-xs font-semibold text-neutral-600 flex items-center gap-2">
                                    <RiBarChartLine size={16} className="text-neutral-500" />
                                    <span>Role Match</span>
                                </div>

                                <div className="flex items-center gap-3">
                                    {!analysis ? (
                                        <>
                                            <button 
                                                onClick={() => setIsOpen(false)}
                                                className="px-5 py-2.5 rounded-full text-xs font-semibold text-neutral-500 hover:text-[#0A0A0A] transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={handleTailor}
                                                disabled={loading || !formData.jobDescription.trim()}
                                                className="px-6 py-2.5 bg-[#0A0A0A] text-white rounded-full text-xs font-bold shadow-2xs hover:bg-neutral-800 active:scale-95 transition-all inline-flex items-center gap-2 disabled:opacity-40"
                                            >
                                                {loading ? "Analyzing..." : "Run Analysis"}
                                                {!loading && <RiArrowRightLine size={15} />}
                                            </button>
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => {
                                                    setAnalysis(null);
                                                    setIsOpen(false);
                                                }}
                                                className="px-5 py-2.5 rounded-full text-xs font-semibold text-neutral-500 hover:text-[#0A0A0A] transition-all"
                                            >
                                                Close
                                            </button>
                                            <button 
                                                onClick={handleSaveVersion}
                                                disabled={savingVersion}
                                                className="px-6 py-2.5 bg-[#0A0A0A] text-white rounded-full text-xs font-bold shadow-2xs hover:bg-neutral-800 active:scale-95 transition-all inline-flex items-center gap-2 disabled:opacity-40"
                                            >
                                                {savingVersion ? (
                                                    <RiLoader4Line className="animate-spin" size={15} />
                                                ) : (
                                                    <RiSaveLine size={15} />
                                                )}
                                                {savingVersion ? "Saving..." : "Save Version"}
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
