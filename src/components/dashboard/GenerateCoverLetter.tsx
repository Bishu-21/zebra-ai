"use client";

import React, { useCallback, useEffect, useState } from "react";
import { 
    RiAddLine, 
    RiCloseLine, 
    RiAlertLine, 
    RiArrowDownSLine,
    RiFileCopyLine,
    RiDownload2Line,
    RiCheckLine,
    RiMailSendLine,
    RiLink,
    RiFileSearchLine,
    RiSearchEyeLine,
    RiLoader4Line
} from "react-icons/ri";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import { CoverLetterDocument } from "@/components/dashboard/CoverLetterDocument";
import { AppIcon } from "@/components/ui/AppIcon";

type ResumeOption = { id: string; title: string; candidateName?: string };

export function GenerateCoverLetter({ resumes }: { resumes: ResumeOption[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resumeOptions, setResumeOptions] = useState(resumes);
    const [resumeCursor, setResumeCursor] = useState<string | null>(null);
    const [loadingResumes, setLoadingResumes] = useState(false);
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
    const [intelligence, setIntelligence] = useState<{
        skills: string[];
        companySignals: string[];
        requirements: string[];
    } | null>(null);
    const [enriching, setEnriching] = useState(false);
    const router = useRouter();

    const handleClose = useCallback(() => {
        if (!loading && !isExporting) {
            setIsOpen(false);
        }
    }, [loading, isExporting]);

    const dialogRef = useDialogFocus(isOpen, handleClose);

    const loadResumes = useCallback(async (cursor?: string) => {
        setLoadingResumes(true);
        try {
            const query = new URLSearchParams({ limit: "50" });
            if (cursor) query.set("cursor", cursor);
            const response = await fetch(`/api/resumes?${query.toString()}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Could not load resumes");
            setResumeOptions((current) => {
                const names = new Map(current.map((resume) => [resume.id, resume.candidateName]));
                const incoming = ((data.resumes || []) as ResumeOption[]).map((resume) => ({
                    id: resume.id,
                    title: resume.title,
                    candidateName: resume.candidateName || names.get(resume.id),
                }));
                return cursor ? [...current, ...incoming] : incoming;
            });
            setResumeCursor(data.page?.nextCursor ?? null);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Could not load resumes");
        } finally {
            setLoadingResumes(false);
        }
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        let cancelled = false;
        queueMicrotask(() => { if (!cancelled) void loadResumes(); });
        return () => { cancelled = true; };
    }, [isOpen, loadResumes]);

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
                body: JSON.stringify({
                    ...formData,
                    intelligence: intelligence ?? undefined
                }),
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

    const handleEnrich = async () => {
        if (!formData.jobDescription) return;
        setEnriching(true);
        setError(null);
        try {
            const res = await fetch("/api/azure/job-intelligence", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jobDescription: formData.jobDescription }),
            });
            const data = await res.json();
            if (data.success) {
                setIntelligence(data.data);
            } else if (!data.fallback) {
                setError(data.error || "Enrichment failed.");
            }
        } catch {
            setError("Enrichment failed. Please check your connection.");
        } finally {
            setEnriching(false);
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
                    title: formData.title || "Cover Letter",
                    resumeId: formData.resumeId || undefined,
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

    const selectedCandidateName = resumeOptions.find((resume) => resume.id === formData.resumeId)?.candidateName;

    return (
        <>
            <m.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsOpen(true)}
                className="flex w-full items-center justify-center gap-2 bg-neutral-950 text-white px-5 py-3 rounded-xl font-semibold transition-all shadow-xs text-xs group md:w-auto hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
            >
                <AppIcon icon={RiAddLine} size={16} />
                Generate Cover Letter
            </m.button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
                        <m.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm" 
                            onClick={handleClose}
                            aria-hidden="true"
                        />
                        
                        <m.div 
                            ref={dialogRef}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="cover-letter-dialog-title"
                            initial={{ scale: 0.95, opacity: 0, y: 16 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 16 }}
                            className="relative bg-white w-full max-w-5xl max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] rounded-2xl sm:rounded-3xl shadow-2xl border border-neutral-200 flex flex-col overflow-hidden my-auto z-10"
                        >
                            {/* Accent Line */}
                            <div className="w-full h-1 bg-neutral-950" />
                            
                            {/* Header */}
                            <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/90 backdrop-blur-xl shrink-0">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-950 text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                                        <AppIcon icon={RiMailSendLine} size={22} />
                                    </div>
                                    <div>
                                        <h2 id="cover-letter-dialog-title" className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-neutral-950">
                                            Cover Letter Generator
                                        </h2>
                                        <p className="text-xs font-medium text-neutral-600 mt-0.5">
                                            Draft a letter for a specific role.
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleClose}
                                    type="button"
                                    aria-label="Close generator dialog"
                                    className="w-10 h-10 flex items-center justify-center text-neutral-500 hover:text-neutral-950 hover:bg-neutral-200/60 rounded-xl transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-950"
                                >
                                    <AppIcon icon={RiCloseLine} size={22} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex-grow overflow-y-auto p-4 sm:p-6 md:p-8 bg-neutral-50/40">
                                {!success ? (
                                    <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                            <div className="space-y-2">
                                                <label htmlFor="cover-letter-resume-select" className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
                                                    Select Resume Context
                                                </label>
                                                <div className="relative">
                                                    <select 
                                                        id="cover-letter-resume-select"
                                                        className="w-full bg-white border border-neutral-300 hover:border-neutral-400 focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 rounded-xl px-4 py-3 sm:py-3.5 text-sm font-medium outline-none transition-all appearance-none cursor-pointer text-neutral-900 shadow-xs pr-10"
                                                        value={formData.resumeId}
                                                        onChange={(e) => setFormData({...formData, resumeId: e.target.value})}
                                                    >
                                                        {resumeOptions.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                                                        {resumeOptions.length === 0 && <option value="">No Resumes Found (Template mode)</option>}
                                                    </select>
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                                                        <AppIcon icon={RiArrowDownSLine} size={20} />
                                                    </div>
                                                </div>
                                                {resumeCursor && (
                                                    <button 
                                                        type="button" 
                                                        disabled={loadingResumes} 
                                                        onClick={() => void loadResumes(resumeCursor)} 
                                                        className="text-xs font-semibold text-neutral-700 hover:text-neutral-950 underline disabled:opacity-50"
                                                    >
                                                        {loadingResumes ? "Loading resumes…" : "Load more resumes"}
                                                    </button>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <label htmlFor="cover-letter-title-input" className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
                                                    Internal Reference Title
                                                </label>
                                                <input 
                                                    id="cover-letter-title-input"
                                                    type="text"
                                                    placeholder="e.g., Senior AI Engineer at Vercel"
                                                    className="w-full bg-white border border-neutral-300 hover:border-neutral-400 focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 rounded-xl px-4 py-3 sm:py-3.5 text-sm font-medium outline-none transition-all text-neutral-900 placeholder:text-neutral-600 shadow-xs"
                                                    value={formData.title}
                                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                                />
                                            </div>
                                        </div>

                                        {/* Import from Job URL */}
                                        <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
                                            <div className="flex items-center gap-2.5">
                                                <AppIcon icon={RiLink} size={16} className="text-neutral-700" />
                                                <label htmlFor="cover-letter-url-input" className="text-xs font-bold uppercase tracking-wider text-neutral-950">
                                                    Import from Job URL
                                                </label>
                                            </div>
                                            
                                            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                                                <div className="relative flex-grow">
                                                    <input 
                                                        id="cover-letter-url-input"
                                                        type="text"
                                                        placeholder="Paste LinkedIn, Indeed, or job posting URL..."
                                                        className="w-full bg-neutral-50 border border-neutral-300 focus:bg-white focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 rounded-xl px-4 py-2.5 sm:py-3 text-sm font-medium outline-none transition-all text-neutral-900 placeholder:text-neutral-600 pl-10"
                                                        value={scrapeUrl}
                                                        onChange={(e) => setScrapeUrl(e.target.value)}
                                                    />
                                                    <AppIcon icon={RiLink} size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                                                </div>
                                                <m.button 
                                                    whileHover={{ scale: 1.01 }}
                                                    whileTap={{ scale: 0.99 }}
                                                    type="button"
                                                    onClick={handleScrape}
                                                    disabled={scraping || !scrapeUrl.trim()}
                                                    className="bg-neutral-900 text-white min-h-11 px-5 py-2.5 sm:py-3 rounded-xl font-semibold text-xs hover:bg-neutral-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-xs shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-950"
                                                >
                                                    {scraping ? <AppIcon icon={RiLoader4Line} size={16} className="animate-spin" /> : <AppIcon icon={RiFileSearchLine} size={16} />}
                                                    {scraping ? "Extracting..." : "Extract Description"}
                                                </m.button>
                                            </div>
                                            <p className="text-xs text-neutral-600 leading-normal">
                                                Automatically extracts job title, company, and role requirements from supported platforms.
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label htmlFor="cover-letter-jd-input" className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
                                                    Target Job Description
                                                </label>
                                                <span className="text-xs font-medium text-neutral-500">
                                                    {formData.jobDescription.length} characters
                                                </span>
                                            </div>
                                            <textarea 
                                                id="cover-letter-jd-input"
                                                placeholder="Paste the job description here. Include key requirements, responsibilities, and company information..."
                                                className="w-full bg-white border border-neutral-300 hover:border-neutral-400 focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 rounded-xl p-4 sm:p-5 text-sm font-medium outline-none transition-all min-h-[220px] sm:min-h-[280px] resize-y leading-relaxed text-neutral-900 shadow-xs placeholder:text-neutral-600"
                                                value={formData.jobDescription}
                                                onChange={(e) => {
                                                    setFormData({...formData, jobDescription: e.target.value});
                                                    if (intelligence) setIntelligence(null);
                                                }}
                                            />

                                            {formData.jobDescription.length > 50 && !intelligence && (
                                                <div className="flex justify-center pt-2">
                                                    <m.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        type="button"
                                                        onClick={handleEnrich}
                                                        disabled={enriching}
                                                        className="bg-white border border-neutral-300 text-neutral-900 px-5 py-2.5 rounded-xl font-semibold text-xs shadow-xs flex items-center gap-2 hover:bg-neutral-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-950"
                                                    >
                                                        {enriching ? <AppIcon icon={RiLoader4Line} size={16} className="animate-spin" /> : <AppIcon icon={RiSearchEyeLine} size={16} className="text-neutral-700" />}
                                                        {enriching ? "Analyzing..." : "Analyze with Azure AI"}
                                                    </m.button>
                                                </div>
                                            )}

                                            {intelligence && (
                                                <m.div 
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 pt-2"
                                                >
                                                    <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
                                                        <p className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-3">Role Skills</p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {intelligence.skills.slice(0, 8).map((s, i) => (
                                                                <span key={i} className="px-2.5 py-1 bg-neutral-100 text-neutral-800 text-xs font-medium rounded-md border border-neutral-200">{s}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
                                                        <p className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-3">Company Signals</p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {intelligence.companySignals.slice(0, 5).map((s, i) => (
                                                                <span key={i} className="px-2.5 py-1 bg-neutral-100 text-neutral-800 text-xs font-medium rounded-md border border-neutral-200">{s}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
                                                        <p className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-3">Requirements</p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {intelligence.requirements.slice(0, 5).map((s, i) => (
                                                                <span key={i} className="px-2.5 py-1 bg-neutral-100 text-neutral-800 text-xs font-medium rounded-md border border-neutral-200 truncate max-w-full">{s}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </m.div>
                                            )}
                                        </div>

                                        {error && (
                                            <m.div 
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                role="alert"
                                                className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-start gap-3 text-xs font-medium"
                                            >
                                                <AppIcon icon={RiAlertLine} size={18} className="mt-0.5 text-red-600" />
                                                <div className="space-y-0.5">
                                                    <p className="font-semibold text-red-800">Generation Notice</p>
                                                    <p className="text-red-700">{error}</p>
                                                </div>
                                            </m.div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-6 max-w-4xl mx-auto">
                                        <div className="bg-neutral-950 text-white p-4 sm:p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
                                            <div className="flex items-center gap-3 sm:gap-4">
                                                <div className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center shrink-0">
                                                    <AppIcon icon={RiCheckLine} size={22} />
                                                </div>
                                                <div>
                                                    <p className="text-base sm:text-lg font-bold tracking-tight text-white">Letter Ready</p>
                                                    <p className="text-xs font-medium text-neutral-400">Drafted and ready for review</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                                <m.button 
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    type="button"
                                                    onClick={handleCopy}
                                                    aria-label="Copy letter text"
                                                    className="bg-neutral-800 hover:bg-neutral-700 px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 text-xs font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                                                >
                                                    {copied ? <AppIcon icon={RiCheckLine} size={16} /> : <AppIcon icon={RiFileCopyLine} size={16} />}
                                                    {copied ? "Copied" : "Copy Text"}
                                                </m.button>
                                                <m.button 
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    type="button"
                                                    onClick={downloadPDF}
                                                    disabled={isExporting}
                                                    aria-label="Download PDF"
                                                    className="bg-white hover:bg-neutral-100 text-neutral-950 px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                                                >
                                                    {isExporting ? <AppIcon icon={RiLoader4Line} size={16} className="animate-spin" /> : <AppIcon icon={RiDownload2Line} size={16} />}
                                                    Export PDF
                                                </m.button>
                                            </div>
                                        </div>

                                        <div className="bg-neutral-100 rounded-2xl p-2 sm:p-4 md:p-6 border border-neutral-200 overflow-x-auto">
                                            {/* Letter Preview Design */}
                                            <CoverLetterDocument
                                                content={generatedContent || ""}
                                                candidateName={selectedCandidateName}                                                className="p-6 sm:p-10 md:p-16 rounded-xl shadow-xs border border-neutral-200 w-full max-w-[210mm] mx-auto min-h-[500px]"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-t border-neutral-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/95 backdrop-blur-xl shrink-0">
                                <div className="flex items-center gap-3 min-w-0">
                                    <AppIcon icon={RiMailSendLine} size={16} className="text-neutral-600" />
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Generation cost</p>
                                        <p className="text-xs font-medium text-neutral-700">Uses 1 credit</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 justify-end">
                                    {!success ? (
                                        <>
                                            <button 
                                                type="button"
                                                onClick={handleClose}
                                                className="px-4 py-2.5 text-xs font-semibold text-neutral-600 hover:text-neutral-950 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-950 rounded-lg"
                                            >
                                                Cancel
                                            </button>
                                            <m.button 
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                type="button"
                                                onClick={handleGenerate}
                                                disabled={loading || !formData.jobDescription}
                                                className="bg-neutral-950 text-white px-5 py-2.5 rounded-xl font-semibold text-xs hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-950"
                                            >
                                                {loading ? (
                                                    <>
                                                        <AppIcon icon={RiLoader4Line} size={16} className="animate-spin" />
                                                        Generating...
                                                    </>
                                                ) : (
                                                    <>
                                                        Generate Cover Letter
                                                        <AppIcon icon={RiMailSendLine} size={16} />
                                                    </>
                                                )}
                                            </m.button>
                                        </>
                                    ) : (
                                        <button 
                                            type="button"
                                            onClick={handleClose}
                                            className="bg-neutral-950 text-white px-6 py-2.5 rounded-xl font-semibold text-xs hover:bg-neutral-800 transition-colors shadow-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-950"
                                        >
                                            Done
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
