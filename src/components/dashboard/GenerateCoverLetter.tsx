"use client";

import React, { useState, useEffect } from "react";
import { 
    RiAddLine, 
    RiMagicLine, 
    RiCloseCircleLine, 
    RiCheckboxCircleLine, 
    RiAlertLine, 
    RiFileTextLine,
    RiArrowDropDownLine
} from "react-icons/ri";
import { useRouter } from "next/navigation";

export function GenerateCoverLetter({ resumes }: { resumes: any[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        resumeId: resumes[0]?.id || "",
        jobDescription: "",
        title: "",
    });
    const [generatedContent, setGeneratedContent] = useState<string | null>(null);
    const router = useRouter();

    const handleGenerate = async () => {
        if (!formData.jobDescription) {
            setError("Please provide a job description.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/cover-letters", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await res.json();

            if (data.success) {
                setGeneratedContent(data.content);
                setSuccess(true);
                router.refresh();
            } else {
                setError(data.error || "Generation failed.");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 bg-black hover:bg-black/80 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-black/10 text-sm active:scale-95"
            >
                <RiAddLine size={20} />
                Generate New Letter
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !loading && setIsOpen(false)}></div>
                    <div className="relative bg-white/90 backdrop-blur-2xl w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl border border-white/50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        
                        {/* Header */}
                        <div className="p-8 border-b border-black/5 flex items-center justify-between bg-white/30 backdrop-blur-md">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-black/5 rounded-2xl flex items-center justify-center text-black/60">
                                    <RiMagicLine size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-black">AI Cover Letter Generator</h2>
                                    <p className="text-sm font-medium text-black/40">Tailored precisely to your next role.</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-black/30 hover:text-black transition-colors">
                                <RiCloseCircleLine size={28} />
                            </button>
                        </div>

                        <div className="flex-grow overflow-y-auto p-8 no-scrollbar">
                            {!success ? (
                                <div className="space-y-8 max-w-3xl mx-auto">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold uppercase tracking-widest text-black/40">Select Resume Context</label>
                                            <div className="relative">
                                                <select 
                                                    className="w-full bg-black/5 border-2 border-transparent focus:border-black/10 rounded-2xl px-6 py-5 text-sm font-bold outline-none transition-all appearance-none cursor-pointer text-black"
                                                    value={formData.resumeId}
                                                    onChange={(e) => setFormData({...formData, resumeId: e.target.value})}
                                                >
                                                    {resumes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                                                    {resumes.length === 0 && <option value="">No Resumes Found (Template mode)</option>}
                                                </select>
                                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-black/30">
                                                    <RiArrowDropDownLine size={24} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold uppercase tracking-widest text-black/40">Internal Reference Title</label>
                                            <input 
                                                type="text"
                                                placeholder="e.g., Senior Designer at Vercel"
                                                className="w-full bg-black/5 border-2 border-transparent focus:border-black/10 rounded-2xl px-6 py-5 text-sm font-bold outline-none transition-all text-black placeholder:text-black/20"
                                                value={formData.title}
                                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-xs font-bold uppercase tracking-widest text-black/40">Target Job Description</label>
                                        <textarea 
                                            placeholder="Paste the full job description here. Zebra will extract keywords and requirements automatically..."
                                            className="w-full bg-black/5 border-2 border-transparent focus:border-black/10 rounded-[2.5rem] px-8 py-8 text-sm font-medium outline-none transition-all min-h-[300px] resize-none leading-relaxed text-black placeholder:text-black/20"
                                            value={formData.jobDescription}
                                            onChange={(e) => setFormData({...formData, jobDescription: e.target.value})}
                                        />
                                    </div>

                                    {error && (
                                        <div className="bg-black/5 text-black p-5 rounded-2xl border border-black/5 flex items-center gap-3 text-sm font-bold animate-shake">
                                            <RiAlertLine size={24} className="text-black/30" />
                                            {error}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500 max-w-3xl mx-auto">
                                    <div className="bg-black text-white p-5 rounded-2xl flex items-center gap-3 text-sm font-black shadow-xl shadow-black/10">
                                        <RiCheckboxCircleLine size={24} />
                                        Letter Generated Successfully! (1 Credit Deducted)
                                    </div>
                                    <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] p-10 border border-black/5 relative group shadow-sm">
                                        <pre className="whitespace-pre-wrap font-serif text-[1.1rem] leading-relaxed text-black/80">
                                            {generatedContent}
                                        </pre>
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(generatedContent || "");
                                                alert("Copied to clipboard!");
                                            }}
                                            className="absolute top-6 right-6 bg-black text-white px-6 py-3 rounded-xl text-xs font-black shadow-xl hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            Copy Letter
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-8 border-t border-black/5 flex items-center justify-between bg-white/30 backdrop-blur-xl">
                            <div className="flex items-center gap-2 text-black/30">
                                <div className="w-1.5 h-1.5 rounded-full bg-black/40"></div>
                                <span className="text-[0.65rem] font-bold uppercase tracking-widest text-black/40">Costs 1 AI Credit</span>
                            </div>
                            <div className="flex items-center gap-4">
                                {!success ? (
                                    <>
                                        <button 
                                            onClick={() => setIsOpen(false)}
                                            className="px-6 py-3 text-sm font-bold text-black/40 hover:text-black transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={handleGenerate}
                                            disabled={loading}
                                            className="bg-black text-white px-10 py-4 rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/10 disabled:opacity-50 disabled:scale-100 flex items-center gap-3"
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                                    Zebra is Writing...
                                                </>
                                            ) : (
                                                <>
                                                    Generate with AI
                                                    <RiMagicLine size={20} />
                                                </>
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    <button 
                                        onClick={() => setIsOpen(false)}
                                        className="bg-black text-white px-10 py-4 rounded-2xl font-black text-sm hover:scale-[1.02] transition-all shadow-xl shadow-black/10"
                                    >
                                        Done
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
