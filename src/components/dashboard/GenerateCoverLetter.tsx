"use client";

import React, { useState } from "react";
import { 
    RiAddLine, 
    RiMagicLine, 
    RiCloseCircleLine, 
    RiCheckboxCircleLine, 
    RiAlertLine, 
    RiArrowDropDownLine,
    RiFileCopyLine,
    RiDownload2Line,
    RiCheckLine,
    RiMailSendLine,
    RiExternalLinkLine,
    RiFlashlightLine,
    RiLoader4Line,
    RiSparkling2Line
} from "react-icons/ri";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { sanitizeHtml } from "@/lib/utils";

export function GenerateCoverLetter({ resumes }: { resumes: { id: string; title: string }[] }) {
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
    const [copied, setCopied] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [scraping, setScraping] = useState(false);
    const [scrapeUrl, setScrapeUrl] = useState("");
    const router = useRouter();

    const handleScrape = async () => {
        if (!scrapeUrl.trim()) return;
        setScraping(true);
        setError(null);
        try {
            const res = await fetch("/api/jobs/scrape", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: scrapeUrl }),
            });
            const data = await res.json();
            if (data.success) {
                setFormData({
                    ...formData,
                    jobDescription: `${data.position} at ${data.company}\nLocation: ${data.location}\n\n${data.description}`,
                    title: `${data.position} @ ${data.company}`
                });
            } else {
                setError(data.details || "Failed to scrape. Please paste manually.");
            }
        } catch {
            setError("Scrape failed. Check your network or URL.");
        } finally {
            setScraping(false);
        }
    };

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
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (!generatedContent) return;
        navigator.clipboard.writeText(generatedContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadPDF = async () => {
        if (!generatedContent) return;
        setIsExporting(true);
        try {
            const res = await fetch("/api/export/pdf/cover-letter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: generatedContent,
                    title: formData.title || "Cover Letter"
                }),
            });

            if (!res.ok) throw new Error("Export failed");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Zebra_Cover_Letter_${new Date().getTime()}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("PDF generation failed:", err);
            setError("Failed to generate PDF. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    const renderFormattedContent = (content: string) => {
        if (!content) return null;
        
        return content.split('\n').map((line, i) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={i} className="h-6" />;
            
            const formatted = trimmed
                .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-black">$1</strong>')
                .replace(/\*(.*?)\*/g, '<strong class="font-bold text-black">$1</strong>');

            if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
                return (
                    <li key={i} className="ml-6 mb-4 list-none relative flex gap-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-black/20 mt-2.5 flex-shrink-0" />
                        <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(formatted.replace(/^[•-]\s*/, '')) }} />
                    </li>
                );
            }

            return (
                <p 
                    key={i} 
                    className="mb-6 text-justify leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(formatted) }}
                />
            );
        });
    };

    return (
        <>
            <m.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-3 bg-black text-white px-8 py-5 rounded-2xl font-black transition-all shadow-2xl shadow-black/20 text-sm group"
            >
                <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <RiAddLine size={20} />
                </div>
                Generate New Letter
            </m.button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-10 overflow-hidden">
                        <m.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md" 
                            onClick={() => !loading && setIsOpen(false)}
                        />
                        
                        <m.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-[#F9F9FB] w-full h-full md:h-auto md:max-w-5xl md:max-h-[92vh] md:rounded-[3.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] border border-white/40 flex flex-col overflow-hidden"
                        >
                            {/* Animated Background Decor */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-gradient-x" />
                            
                            {/* Header */}
                            <div className="p-10 border-b border-black/5 flex items-center justify-between bg-white/60 backdrop-blur-xl sticky top-0 z-10">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                                        <RiMagicLine size={30} />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black text-black tracking-tighter">Zebra Cover Letter Coach</h2>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 text-[0.65rem] font-black uppercase tracking-widest rounded-md">AI Engine v2.5</span>
                                            <span className="w-1 h-1 rounded-full bg-black/20" />
                                            <p className="text-[0.7rem] font-bold text-black/40 uppercase tracking-widest">
                                                Tailored <span className="opacity-40">&middot;</span> High-Conversion <span className="opacity-40">&middot;</span> Professional
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsOpen(false)} 
                                    className="w-12 h-12 flex items-center justify-center text-black/30 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all duration-300"
                                >
                                    <RiCloseCircleLine size={32} />
                                </button>
                            </div>

                            <div className="flex-grow overflow-y-auto p-8 md:p-12 no-scrollbar bg-gradient-to-b from-transparent to-white/50">
                                {!success ? (
                                    <div className="space-y-10 max-w-4xl mx-auto">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="group space-y-4">
                                                <label className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-black/30 group-hover:text-blue-500 transition-colors">Select Resume Context</label>
                                                <div className="relative">
                                                    <select 
                                                        className="w-full bg-white border-2 border-transparent hover:border-black/5 focus:border-blue-500/50 rounded-[1.5rem] px-8 py-6 text-[0.95rem] font-bold outline-none transition-all appearance-none cursor-pointer text-black shadow-sm"
                                                        value={formData.resumeId}
                                                        onChange={(e) => setFormData({...formData, resumeId: e.target.value})}
                                                    >
                                                        {resumes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                                                        {resumes.length === 0 && <option value="">No Resumes Found (Template mode)</option>}
                                                    </select>
                                                    <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-black/30">
                                                        <RiArrowDropDownLine size={28} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="group space-y-4">
                                                <label className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-black/30 group-hover:text-blue-500 transition-colors">Internal Reference Title</label>
                                                <input 
                                                    type="text"
                                                    placeholder="e.g., Senior AI Engineer at Vercel"
                                                    className="w-full bg-white border-2 border-transparent hover:border-black/5 focus:border-blue-500/50 rounded-[1.5rem] px-8 py-6 text-[0.95rem] font-bold outline-none transition-all text-black placeholder:text-black/20 shadow-sm"
                                                    value={formData.title}
                                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                                />
                                            </div>
                                        </div>

                                        {/* Magic Scrape Feature - Reimagined */}
                                        <div className="relative p-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-[3rem] overflow-hidden group shadow-xl">
                                            <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl rounded-[3rem]" />
                                            <div className="relative p-10 space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[0.75rem] font-black uppercase tracking-[0.25em] text-blue-600 flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-blue-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                                            <RiFlashlightLine size={16} />
                                                        </div>
                                                        Magic Scrape Intelligence
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                        <span className="text-[0.6rem] font-black text-green-600/60 uppercase tracking-widest">Live Agent Active</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex flex-col md:flex-row gap-4">
                                                    <div className="relative flex-grow">
                                                        <input 
                                                            type="text"
                                                            placeholder="Paste LinkedIn, Indeed, or any Job URL..."
                                                            className="w-full bg-white border-2 border-black/5 focus:border-blue-500 rounded-[1.5rem] px-8 py-5 text-[0.95rem] font-bold outline-none transition-all text-black shadow-inner"
                                                            value={scrapeUrl}
                                                            onChange={(e) => setScrapeUrl(e.target.value)}
                                                        />
                                                        <RiExternalLinkLine className="absolute right-8 top-1/2 -translate-y-1/2 text-black/20" size={20} />
                                                    </div>
                                                    <m.button 
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={handleScrape}
                                                        disabled={scraping || !scrapeUrl.trim()}
                                                        className="bg-blue-600 text-white px-12 py-5 rounded-[1.5rem] font-black text-sm hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-600/20 active:bg-blue-800"
                                                    >
                                                        {scraping ? <RiLoader4Line className="animate-spin" size={24} /> : <RiSparkling2Line size={24} />}
                                                        {scraping ? "Scanning..." : "Auto-Extract"}
                                                    </m.button>
                                                </div>
                                                <p className="text-[0.75rem] font-bold text-black/40 leading-relaxed max-w-2xl">
                                                    Our autonomous browser agent will visit the page, bypass noise, and extract critical job requirements instantly.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between px-2">
                                                <label className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-black/30">Target Job Description</label>
                                                <span className="text-[0.65rem] font-bold text-black/20 uppercase tracking-widest">{formData.jobDescription.length} characters</span>
                                            </div>
                                            <textarea 
                                                placeholder="Paste the full job description here. Zebra's AI will parse requirements, company culture, and key skills automatically..."
                                                className="w-full bg-white border-2 border-transparent focus:border-blue-500/20 rounded-[2.5rem] px-10 py-10 text-[1.1rem] font-medium outline-none transition-all min-h-[350px] resize-none leading-[1.7] text-black shadow-sm placeholder:text-black/10 no-scrollbar"
                                                value={formData.jobDescription}
                                                onChange={(e) => setFormData({...formData, jobDescription: e.target.value})}
                                            />
                                        </div>

                                        {error && (
                                            <m.div 
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="bg-red-500/5 text-red-600 p-6 rounded-3xl border border-red-500/10 flex items-start gap-4 text-sm font-bold shadow-sm"
                                            >
                                                <RiAlertLine size={24} className="mt-0.5 flex-shrink-0" />
                                                <div className="space-y-1">
                                                    <p>Intelligence Error</p>
                                                    <p className="text-red-600/60 font-medium">{error}</p>
                                                </div>
                                            </m.div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-10 animate-in slide-in-from-bottom-12 duration-700 max-w-4xl mx-auto">
                                        <div className="bg-black text-white p-8 rounded-[2.5rem] flex items-center justify-between shadow-2xl shadow-black/20">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-green-400">
                                                    <RiCheckboxCircleLine size={30} />
                                                </div>
                                                <div>
                                                    <p className="text-xl font-black tracking-tight">Generation Complete</p>
                                                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Optimized for high-impact response</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <m.button 
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={handleCopy}
                                                    className="bg-white/10 hover:bg-white/20 px-6 py-4 rounded-xl transition-all flex items-center gap-3 text-sm font-black"
                                                >
                                                    {copied ? <RiCheckLine size={20} className="text-green-400" /> : <RiFileCopyLine size={20} />}
                                                    {copied ? "Copied" : "Copy Text"}
                                                </m.button>
                                                <m.button 
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={downloadPDF}
                                                    disabled={isExporting}
                                                    className="bg-blue-600 hover:bg-blue-700 px-6 py-4 rounded-xl transition-all disabled:opacity-50 flex items-center gap-3 text-sm font-black"
                                                >
                                                    {isExporting ? <RiLoader4Line className="animate-spin" size={20} /> : <RiDownload2Line size={20} />}
                                                    Export PDF
                                                </m.button>
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-[3.5rem] p-4 md:p-16 border border-black/5 relative shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
                                            {/* Letter Preview Design */}
                                            <div 
                                                id="preview-letter-content"
                                                className="bg-white p-12 md:p-24 rounded-2xl shadow-sm border border-black/5 text-black/90 max-w-[210mm] mx-auto min-h-[900px] relative"
                                                style={{ fontFamily: "'STIX Two Text', serif" }}
                                            >
                                                {/* Professional Header Decor */}
                                                <div className="mb-20 flex justify-between items-start">
                                                    <div className="font-sans">
                                                        <h1 className="text-4xl font-black tracking-tighter text-black uppercase leading-none">Applicant</h1>
                                                        <p className="text-[0.7rem] font-bold text-blue-600 uppercase tracking-[0.3em] mt-3">Professional Candidate Profile</p>
                                                        <div className="h-1 w-20 bg-blue-600 mt-6" />
                                                    </div>
                                                    <div className="text-right font-sans">
                                                        <p className="text-[0.7rem] uppercase tracking-widest font-black text-black/20 mb-3">Zebra AI Premium Document</p>
                                                        <p className="text-[0.9rem] font-bold text-black/70">
                                                            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-[1.15rem] leading-[1.85] font-normal tracking-normal text-justify">
                                                    {renderFormattedContent(generatedContent || "")}
                                                </div>
                                                
                                                <div className="mt-24 pt-12 border-t border-black/5 flex justify-between items-end font-sans">
                                                    <div>
                                                        <p className="text-lg font-serif italic text-black/60 mb-8">Professional Regards,</p>
                                                        <div className="w-48 h-px bg-black/10 mb-4" />
                                                        <p className="text-2xl font-black text-black tracking-tight">Applicant Name</p>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        <div className="w-14 h-14 bg-black/[0.03] rounded-2xl flex items-center justify-center border border-black/5">
                                                            <div className="w-6 h-6 border-2 border-blue-600/20 rounded-full" />
                                                        </div>
                                                        <span className="text-[0.6rem] font-black text-black/10 uppercase tracking-widest">Seal of Quality</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer Sticky */}
                            <div className="p-10 border-t border-black/5 flex items-center justify-between bg-white/80 backdrop-blur-2xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-black/5 rounded-xl flex items-center justify-center text-black/20">
                                        <RiMailSendLine size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-black/40">Secure Transaction</p>
                                        <p className="text-xs font-bold text-black/60">1 AI Credit will be utilized</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    {!success ? (
                                        <>
                                            <button 
                                                onClick={() => setIsOpen(false)}
                                                className="px-8 py-4 text-sm font-black text-black/30 hover:text-black transition-colors"
                                            >
                                                Discard Draft
                                            </button>
                                            <m.button 
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={handleGenerate}
                                                disabled={loading || !formData.jobDescription}
                                                className="bg-black text-white px-12 py-5 rounded-[1.5rem] font-black text-sm hover:shadow-2xl hover:shadow-black/20 transition-all disabled:opacity-50 flex items-center gap-4"
                                            >
                                                {loading ? (
                                                    <>
                                                        <RiLoader4Line className="animate-spin" size={24} />
                                                        Zebra is Drafting...
                                                    </>
                                                ) : (
                                                    <>
                                                        Generate High-Impact Letter
                                                        <RiSparkling2Line size={22} className="text-blue-400" />
                                                    </>
                                                )}
                                            </m.button>
                                        </>
                                    ) : (
                                        <button 
                                            onClick={() => setIsOpen(false)}
                                            className="bg-black text-white px-14 py-5 rounded-[1.5rem] font-black text-sm hover:scale-[1.02] transition-all shadow-xl shadow-black/20 active:scale-[0.98]"
                                        >
                                            Close Suite
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
