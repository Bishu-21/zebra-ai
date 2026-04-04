"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    RiProfileLine, 
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
    RiFocus3Line
} from "react-icons/ri";
import { useRouter } from "next/navigation";

export function TailorResume({ resumes }: { resumes: any[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        resumeId: resumes[0]?.id || "",
        jobDescription: "",
    });
    const [scanStep, setScanStep] = useState("");
    const [analysis, setAnalysis] = useState<any | null>(null);
    const router = useRouter();

    const handleTailor = async () => {
        if (!formData.resumeId || !formData.jobDescription) {
            setError("Please select a resume and paste the job description.");
            return;
        }

        setLoading(true);
        setError(null);
        
        const steps = ["Parsing Job Requirements...", "Extracting Semantic Gaps...", "Cross-Referencing Skills...", "Generating Alpha Recommendations..."];
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
                    router.refresh();
                }, 800);
            } else {
                setError(data.error || "Tailoring failed.");
                clearInterval(stepInterval);
            }
        } catch (err) {
            setError("Network error. Please try again.");
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
                className="flex items-center justify-between w-full h-full cursor-pointer hover:opacity-90 transition-all p-10 bg-white border border-black/5 rounded-[2.5rem] shadow-sm group/card hover:shadow-xl hover:shadow-black/5 active:scale-[0.99]"
            >
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-black/[0.02] border border-black/5 rounded-2xl flex items-center justify-center text-black/[0.12] shadow-inner group-hover/card:scale-110 group-hover/card:bg-black group-hover/card:text-white transition-all duration-500">
                        <RiFocus3Line size={24} />
                    </div>
                    <div>
                        <h3 className="font-black text-xl mb-1 text-black tracking-tight group-hover/card:translate-x-1 transition-transform duration-300">Strategic Match</h3>
                        <p className="text-sm text-black/40 font-bold uppercase tracking-wider">
                            Synthesize your profile to match job requirements with precision.
                        </p>
                    </div>
                </div>
                <button className="px-6 py-3 bg-black text-white rounded-xl text-[0.7rem] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10">
                    Open Protocol
                </button>
            </div>

            {/* Tool Modal */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                            onClick={() => !loading && setIsOpen(false)}
                        ></motion.div>
                        
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative bg-white/90 backdrop-blur-xl w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] shadow-2xl border border-white/50 flex flex-col overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-8 border-b border-black/5 flex items-center justify-between bg-white/30 backdrop-blur-md sticky top-0 z-20">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-black/5 rounded-2xl flex items-center justify-center text-black/60">
                                        <RiFlashlightLine size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-black uppercase tracking-tight">Alpha Tailoring Protocol</h2>
                                        <p className="text-sm font-medium text-black/50">Align your semantic profile with employer expectations.</p>
                                    </div>
                                </div>
                                <button onClick={() => !loading && setIsOpen(false)} className="text-black/30 hover:text-black transition-colors" disabled={loading}>
                                    <RiCloseCircleLine size={28} />
                                </button>
                            </div>

                            <div className="flex-grow overflow-y-auto p-10 no-scrollbar relative">
                                {!analysis ? (
                                    <div className="max-w-4xl mx-auto space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <label className="text-[0.65rem] font-black uppercase tracking-widest text-black/40 flex items-center gap-2">
                                                    <RiFileTextLine size={14} />
                                                    Base Profile
                                                </label>
                                                <div className="relative">
                                                    <select 
                                                        className="w-full bg-black/5 border-2 border-transparent focus:border-black/10 rounded-2xl px-6 py-5 text-sm font-bold outline-none transition-all appearance-none cursor-pointer text-black"
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
                                            <label className="text-[0.65rem] font-black uppercase tracking-widest text-black/40 flex items-center gap-2">
                                                <RiInformationLine size={14} />
                                                Target Job Description
                                            </label>
                                            
                                            {/* Input Area */}
                                            <div className="relative group/input overflow-hidden rounded-[2rem] border border-black/5 shadow-inner bg-black/[0.02]">
                                                {/* Cinematic Scan Animation Overlay */}
                                                <AnimatePresence>
                                                    {loading && (
                                                        <motion.div 
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0 }}
                                                            className="absolute inset-0 z-30 pointer-events-none overflow-hidden rounded-[2rem]"
                                                        >
                                                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[4px]"></div>
                                                            
                                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                                                                <div className="scale-150 text-black/80">
                                                                    <RiLoader4Line className="animate-spin" size={40} />
                                                                </div>
                                                                <div className="flex flex-col items-center gap-2">
                                                                    <span className="text-sm font-black uppercase tracking-[0.2em] text-black animate-pulse">{scanStep}</span>
                                                                    <div className="w-48 h-1 bg-black/5 rounded-full overflow-hidden">
                                                                        <motion.div 
                                                                            className="h-full bg-black"
                                                                            initial={{ width: "0%" }}
                                                                            animate={{ width: "100%" }}
                                                                            transition={{ duration: 6, ease: "linear" }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                <textarea 
                                                    placeholder="Paste the full job requirements from the recruiter..."
                                                    className={`w-full min-h-[350px] px-8 py-8 text-[0.95rem] font-medium outline-none transition-all resize-none leading-relaxed text-black bg-transparent ${loading ? "blur-[2px]" : ""}`}
                                                    value={formData.jobDescription}
                                                    onChange={(e) => setFormData({...formData, jobDescription: e.target.value})}
                                                    disabled={loading}
                                                />
                                            </div>
                                        </div>

                                        {error && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-red-500 text-white p-6 rounded-2xl flex items-center gap-3 text-sm font-black uppercase tracking-wider shadow-xl"
                                            >
                                                <RiErrorWarningLine size={24} />
                                                {error}
                                            </motion.div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-500 max-w-4xl mx-auto">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="bg-black text-white p-8 rounded-[2.5rem] flex flex-col justify-between aspect-square md:aspect-auto shadow-2xl shadow-black/20">
                                                <p className="text-[0.65rem] font-bold uppercase tracking-widest text-white/40 mb-2 text-center">Match Potential</p>
                                                <h3 className="text-7xl font-black italic text-center">{analysis.matchScore}%</h3>
                                                <div className="mt-4 w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${analysis.matchScore}%` }}
                                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                                        className="h-full bg-white" 
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="md:col-span-2 bg-white border border-black/5 p-10 rounded-[2.5rem] flex flex-col justify-center shadow-sm">
                                                <h4 className="text-sm font-black uppercase tracking-widest mb-4 text-black/30">Strategic Fit Assessment</h4>
                                                <p className="text-black/70 leading-relaxed font-bold text-lg">
                                                    {analysis.roleFit}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-6">
                                                <h4 className="font-black flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.2em] text-black/30">
                                                    <RiCheckboxCircleLine size={18} className="text-green-500" />
                                                    Target Keywords Found
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {analysis.keywordsFound.map((kw: string, i: number) => (
                                                        <span key={i} className="px-5 py-2.5 bg-green-500/5 text-green-700 rounded-xl text-[0.7rem] font-black uppercase tracking-wider border border-green-500/10">
                                                            {kw}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <h4 className="font-black flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.2em] text-black/30">
                                                    <RiErrorWarningLine size={18} className="text-orange-500" />
                                                    Critical Profile Gaps
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {analysis.keywordsMissing.map((kw: string, i: number) => (
                                                        <span key={i} className="px-5 py-2.5 bg-orange-500/5 text-orange-700 rounded-xl text-[0.7rem] font-black uppercase tracking-wider border border-orange-500/10 italic">
                                                            {kw}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-black/5 border border-black/5 p-10 rounded-[2.5rem]">
                                            <h4 className="font-black text-black flex items-center gap-3 mb-8 uppercase tracking-widest text-sm">
                                                <RiMagicLine size={20} className="text-black/60" />
                                                Alpha Recommendations
                                            </h4>
                                            <div className="grid grid-cols-1 gap-4">
                                                {analysis.tailoringSuggestions.map((tip: string, i: number) => (
                                                    <div key={i} className="flex items-start gap-6 p-6 bg-white rounded-2xl border border-black/5 hover:border-black/20 transition-all group">
                                                        <span className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center text-xs font-black shadow-lg flex-shrink-0">
                                                            0{i + 1}
                                                        </span>
                                                        <p className="text-[0.9rem] font-bold text-black/70 leading-relaxed pt-1">
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
                            <div className="p-8 border-t border-black/5 flex items-center justify-between bg-white/30 backdrop-blur-xl sticky bottom-0">
                                <div className="flex items-center gap-3 px-6 py-3 bg-black/5 rounded-2xl border border-black/5">
                                    <RiBarChartLine size={18} className="text-black/60 theme-pulse" />
                                    <span className="text-[0.65rem] font-black uppercase tracking-widest text-black/50">Semantic Engine v2.4</span>
                                </div>

                                <div className="flex items-center gap-4">
                                    {!analysis ? (
                                        <>
                                            <button 
                                                onClick={() => setIsOpen(false)}
                                                className="px-8 py-4 text-[0.7rem] font-black uppercase tracking-widest text-black/40 hover:text-black transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={handleTailor}
                                                disabled={loading || !formData.jobDescription.trim()}
                                                className="bg-black text-white px-10 py-5 rounded-[1.25rem] font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-black/20 disabled:opacity-30 flex items-center gap-3"
                                            >
                                                {loading ? "Matching Matrix..." : "Execute Alpha Match"}
                                                {!loading && <RiArrowRightLine size={18} />}
                                            </button>
                                        </>
                                    ) : (
                                        <button 
                                            onClick={() => {
                                                setAnalysis(null);
                                                setIsOpen(false);
                                            }}
                                            className="bg-black text-white px-12 py-5 rounded-[1.25rem] font-black text-sm hover:scale-[1.02] transition-all shadow-2xl shadow-black/20 uppercase tracking-widest"
                                        >
                                            Protocol Secure
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
