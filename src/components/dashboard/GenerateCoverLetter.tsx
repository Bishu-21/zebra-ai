"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
    RiArticleLine,
    RiCloseLine,
    RiAlertLine,
    RiArrowDropDownLine,
    RiFileCopyLine,
    RiDownload2Line,
    RiCheckLine,
    RiMailSendLine,
    RiLink,
    RiSearchLine,
    RiFileSearchLine,
    RiLoader4Line
} from "react-icons/ri";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { sanitizeHtml } from "@/lib/utils";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import { useHydrated } from "@/hooks/useHydrated";
import { AppIcon } from "@/components/ui/AppIcon";
import { featureChrome } from "@/components/dashboard/feature-chrome";
import { FeatureIcon } from "@/components/dashboard/FeatureIcon";

export function GenerateCoverLetter({ resumes }: { resumes: { id: string; title: string }[] }) {
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
    const isMounted = useHydrated();
    const [intelligence, setIntelligence] = useState<{
        skills: string[];
        companySignals: string[];
        requirements: string[];
    } | null>(null);
    const [enriching, setEnriching] = useState(false);
    const router = useRouter();
    const closeDialog = useCallback(() => { if (!loading) setIsOpen(false); }, [loading]);
    const dialogRef = useDialogFocus(isOpen, closeDialog);

    const loadResumes = useCallback(async (cursor?: string) => {
        setLoadingResumes(true);
        try {
            const query = new URLSearchParams({ limit: "50" });
            if (cursor) query.set("cursor", cursor);
            const response = await fetch(`/api/resumes?${query.toString()}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Could not load resumes");
            setResumeOptions((current) => cursor ? [...current, ...(data.resumes || [])] : (data.resumes || []));
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
                    intelligence: intelligence // Pass intelligence as optional enrichment
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
            <button
                type="button"
                data-cover-letter-trigger
                onClick={() => setIsOpen(true)}
                className={`${featureChrome.primaryButton} w-full md:w-auto`}
            >
                <AppIcon icon={RiArticleLine} />
                Generate Cover Letter
            </button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-hidden">
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={featureChrome.backdrop}
                            onClick={() => !loading && setIsOpen(false)}
                        />

                        <m.div
                            ref={dialogRef}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="cover-letter-generator-title"
                            initial={{ scale: 0.98, opacity: 0, y: 8 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.98, opacity: 0, y: 8 }}
                            className={`${featureChrome.dialog} max-w-2xl`}
                        >

                            <div className={featureChrome.dialogHeader}>
                                <div className="flex min-w-0 flex-1 items-start gap-2.5 sm:items-center">
                                    <FeatureIcon feature="Cover Letters" size={18} className="text-muted-foreground" />
                                    <div className="min-w-0">
                                        <h2 id="cover-letter-generator-title" className="text-base font-semibold tracking-tight text-foreground">Cover Letter Generator</h2>
                                        <p className={featureChrome.helper}>Draft a letter for a specific role.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    aria-label="Close cover letter generator"
                                    className={featureChrome.iconButton}
                                >
                                    <AppIcon icon={RiCloseLine} size={18} />
                                </button>
                            </div>

                            <div className={featureChrome.dialogBody}>
                                {!success ? (
                                    <div className="space-y-5 mx-auto">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="group space-y-2">
                                                <label htmlFor="cover-letter-resume" className={featureChrome.label}>Resume</label>
                                                <div className="relative">
                                                    <select style={{ appearance: "none", WebkitAppearance: "none" }} id="cover-letter-resume"
                                                        className={featureChrome.select}
                                                        value={formData.resumeId}
                                                        onChange={(e) => setFormData({...formData, resumeId: e.target.value})}
                                                    >
                                                        {resumeOptions.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                                                        {resumeOptions.length === 0 && <option value="">No resumes available</option>}
                                                    </select>
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-black/30">
                                                        <RiArrowDropDownLine aria-hidden="true" size={22} />
                                                    </div>
                                                </div>
                                                {resumeCursor && (
                                                    <button type="button" disabled={loadingResumes} onClick={() => void loadResumes(resumeCursor)} className="text-xs font-bold text-black/50 underline disabled:opacity-50">
                                                        {loadingResumes ? "Loading resumes…" : "Load more resumes"}
                                                    </button>
                                                )}
                                            </div>
                                            <div className="group space-y-2">
                                                <label htmlFor="cover-letter-title" className={featureChrome.label}>Letter title</label>
                                                <input
                                                    type="text"
                                                    id="cover-letter-title"
                                                    placeholder="e.g., Software engineer at Example Co."
                                                    className={featureChrome.input}
                                                    value={formData.title}
                                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                                />
                                            </div>
                                        </div>

                                        {/* Magic Scrape Feature - Reimagined */}
                                        <div className="space-y-3 rounded-xl border border-neutral-200/70 p-4">
                                                <label className={featureChrome.label}>
                                                    Import from job URL (optional)
                                                </label>
                                                <div className="flex flex-col gap-2 md:flex-row">
                                                    <div className="relative flex-grow">
                                                        <input
                                                            type="text"
                                                            aria-label="Job posting URL"
                                                            placeholder="Paste a job posting URL"
                                                            className={`${featureChrome.input} pl-10`}
                                                            value={scrapeUrl}
                                                            onChange={(e) => setScrapeUrl(e.target.value)}
                                                        />
                                                        <AppIcon icon={RiLink} size={16} className={featureChrome.fieldIcon} />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={handleScrape}
                                                        disabled={scraping || !scrapeUrl.trim()}
                                                        className={featureChrome.primaryButton}
                                                    >
                                                        {scraping ? <AppIcon icon={RiLoader4Line} size={16} className="animate-spin" /> : <AppIcon icon={RiFileSearchLine} />}
                                                        {scraping ? "Extracting..." : "Extract Description"}
                                                    </button>
                                                </div>
                                                <p className={featureChrome.helper}>
                                                    Or paste the job description below if the link cannot be imported.
                                                </p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between px-2">
                                                <label htmlFor="cover-letter-description" className={featureChrome.label}>Job description</label>
                                                <span className="text-xs text-neutral-600">{formData.jobDescription.length} characters</span>
                                            </div>
                                            <textarea id="cover-letter-description"
                                                placeholder="Paste the role requirements and responsibilities."
                                                className={featureChrome.textarea}
                                                value={formData.jobDescription}
                                                onChange={(e) => {
                                                    setFormData({...formData, jobDescription: e.target.value});
                                                    if (intelligence) setIntelligence(null); // Reset intelligence when text changes
                                                }}
                                            />

                                            {formData.jobDescription.length > 50 && !intelligence && (
                                                <div className="flex justify-end mt-2">
                                                    <m.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={handleEnrich}
                                                        disabled={enriching}
                                                        className={featureChrome.secondaryButton}
                                                    >
                                                        {enriching ? <AppIcon icon={RiLoader4Line} size={16} className="animate-spin" /> : <AppIcon icon={RiSearchLine} size={16} />}
                                                        {enriching ? "Analyzing..." : "Analyze requirements"}
                                                    </m.button>
                                                </div>
                                            )}

                                            {intelligence && (
                                                <m.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4"
                                                >
                                                    <div className={featureChrome.card}>
                                                        <p className={`${featureChrome.helper} mb-2`}>Role skills</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {intelligence.skills.slice(0, 8).map((s, i) => (
                                                                <span key={i} className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-foreground">{s}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className={featureChrome.card}>
                                                        <p className={`${featureChrome.helper} mb-2`}>Company signals</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {intelligence.companySignals.slice(0, 5).map((s, i) => (
                                                                <span key={i} className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-foreground">{s}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className={featureChrome.card}>
                                                        <p className={`${featureChrome.helper} mb-2`}>Requirements</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {intelligence.requirements.slice(0, 5).map((s, i) => (
                                                                <span key={i} className="truncate rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-foreground">{s}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </m.div>
                                            )}
                                        </div>

                                        {error && (
                                            <m.div
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="bg-red-500/5 text-red-600 p-6 rounded-3xl border border-red-500/10 flex items-start gap-4 text-sm font-bold shadow-sm"
                                            >
                                                <RiAlertLine size={24} className="mt-0.5 flex-shrink-0" />
                                                <div className="space-y-1">
                                                    <p>Could not complete the request</p>
                                                    <p className="text-red-600/60 font-medium">{error}</p>
                                                </div>
                                            </m.div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-10 animate-in slide-in-from-bottom-12 duration-700 max-w-4xl mx-auto">
                                        <div className={`${featureChrome.card} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
                                            <div>
                                                <p className="text-sm font-semibold tracking-tight text-foreground">Letter ready</p>
                                                <p className={featureChrome.helper}>Review the draft, then copy or export.</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button type="button" onClick={handleCopy} className={featureChrome.secondaryButton}>
                                                    {copied ? <AppIcon icon={RiCheckLine} size={16} /> : <AppIcon icon={RiFileCopyLine} size={16} />}
                                                    {copied ? "Copied" : "Copy text"}
                                                </button>
                                                <button type="button" onClick={downloadPDF} disabled={isExporting} className={featureChrome.primaryButton}>
                                                    {isExporting ? <AppIcon icon={RiLoader4Line} size={16} className="animate-spin" /> : <AppIcon icon={RiDownload2Line} size={16} />}
                                                    Export PDF
                                                </button>
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
                                                        <h1 className="text-4xl font-semibold tracking-tighter text-black uppercase leading-none">Draft</h1>
                                                        <p className="text-[0.7rem] font-bold text-black uppercase tracking-[0.3em] mt-3">Personalized Cover Letter</p>
                                                        <div className="h-1 w-20 bg-black mt-6" />
                                                    </div>
                                                    <div className="text-right font-sans">
                                                        <p className="text-[0.7rem] uppercase tracking-widest font-semibold text-black/20 mb-3">Zebra AI System Generated</p>
                                                        <p className="text-[0.9rem] font-bold text-black/70">
                                                            {isMounted ? new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "---"}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-[1.15rem] leading-[1.85] font-normal tracking-normal text-justify">
                                                    {renderFormattedContent(generatedContent || "")}
                                                </div>

                                                <div className="mt-24 pt-12 border-t border-black/5 flex justify-between items-end font-sans">
                                                    <div>
                                                        <p className="text-lg font-serif italic text-black/60 mb-8">Sincerely,</p>
                                                        <div className="w-48 h-px bg-black/10 mb-4" />
                                                        <p className="text-2xl font-semibold text-black tracking-tight">Applicant Name</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer Sticky */}
                            <div className={featureChrome.dialogFooter}>
                                <div className="flex items-center gap-2">
                                    <AppIcon icon={RiMailSendLine} size={16} className="text-neutral-600" />
                                    <div>
                                        <p className={featureChrome.helper}>Generation cost</p>
                                        <p className="text-sm font-medium text-foreground">Uses 1 credit</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!success ? (
                                        <>
                                            <button onClick={() => setIsOpen(false)} className={featureChrome.ghostButton}>
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleGenerate}
                                                disabled={loading || !formData.jobDescription}
                                                className={featureChrome.primaryButton}
                                            >
                                                {loading ? (
                                                    <>
                                                        <AppIcon icon={RiLoader4Line} size={16} className="animate-spin" />
                                                        Generating...
                                                    </>
                                                ) : (
                                                    <>
                                                        Generate Cover Letter
                                                        <AppIcon icon={RiMailSendLine} />
                                                    </>
                                                )}
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={() => setIsOpen(false)} className={featureChrome.primaryButton}>
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
