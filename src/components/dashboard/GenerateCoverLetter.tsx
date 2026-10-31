"use client";

import React, { useCallback, useEffect, useState } from "react";
import { 
    RiCloseLine, 
    RiAlertLine, 
    RiArrowDownSLine,
    RiFileCopyLine,
    RiDownload2Line,
    RiCheckLine,
    RiMailSendLine,
    RiArticleLine,
    RiLink,
    RiFileSearchLine,
    RiSearchEyeLine,
    RiLoader4Line
} from "react-icons/ri";
import { useRouter } from "next/navigation";
import { AnimatePresence, m } from "framer-motion";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import { CoverLetterDocument } from "@/components/dashboard/CoverLetterDocument";
import { FeatureIcon } from "@/components/dashboard/FeatureIcon";
import { AppIcon } from "@/components/ui/AppIcon";
import { featureChrome } from "@/components/dashboard/feature-chrome";

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
            <button 
                type="button"
                data-cover-letter-trigger
                onClick={() => setIsOpen(true)}
                className={`${featureChrome.primaryButton} w-full md:w-auto`}
            >
                <AppIcon icon={RiArticleLine} size={16} />
                Generate cover letter
            </button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto p-3 sm:items-center sm:p-4">
                        <m.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={featureChrome.backdrop}
                            onClick={handleClose}
                            aria-hidden="true"
                        />
                        
                        <m.div 
                            ref={dialogRef}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="cover-letter-dialog-title"
                            initial={{ y: 16 }}
                            animate={{ y: 0 }}
                            exit={{ y: 16 }}
                            className={`${featureChrome.dialog} ${success ? "max-w-3xl" : "max-w-xl"}`}
                        >
                            <div className={featureChrome.dialogHeader}>
                                <div className="flex min-w-0 items-center gap-2.5">
                                    <FeatureIcon feature="Cover Letters" size={18} className="text-muted-foreground" />
                                    <div className="min-w-0">
                                        <h2 id="cover-letter-dialog-title" className="font-sans text-sm font-semibold tracking-tight text-foreground">
                                            Cover letter generator
                                        </h2>
                                        <p className={featureChrome.helper}>
                                            Draft a letter for a specific role.
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleClose}
                                    type="button"
                                    aria-label="Close generator dialog"
                                    className={featureChrome.iconButton}
                                >
                                    <AppIcon icon={RiCloseLine} size={18} />
                                </button>
                            </div>

                            <div className={featureChrome.dialogBody}>
                                {!success ? (
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label htmlFor="cover-letter-resume-select" className={featureChrome.label}>
                                                Resume
                                            </label>
                                            <div className="relative">
                                                <select 
                                                    id="cover-letter-resume-select"
                                                    className={featureChrome.select}
                                                    value={formData.resumeId}
                                                    onChange={(e) => setFormData({...formData, resumeId: e.target.value})}
                                                >
                                                    {resumeOptions.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                                                    {resumeOptions.length === 0 && <option value="">No resumes found (template mode)</option>}
                                                </select>
                                                <AppIcon icon={RiArrowDownSLine} size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                            </div>
                                            {resumeCursor && (
                                                <button 
                                                    type="button" 
                                                    disabled={loadingResumes} 
                                                    onClick={() => void loadResumes(resumeCursor)} 
                                                    className="font-sans text-xs font-medium text-muted-foreground underline hover:text-foreground disabled:opacity-50"
                                                >
                                                    {loadingResumes ? "Loading resumes…" : "Load more resumes"}
                                                </button>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label htmlFor="cover-letter-title-input" className={featureChrome.label}>
                                                Reference title
                                            </label>
                                            <input 
                                                id="cover-letter-title-input"
                                                type="text"
                                                placeholder="e.g. Senior AI engineer at Vercel"
                                                className={featureChrome.input}
                                                value={formData.title}
                                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label htmlFor="cover-letter-url-input" className={featureChrome.label}>
                                                Job URL
                                            </label>
                                            <div className="flex flex-col gap-2 sm:flex-row">
                                                <div className="relative min-w-0 flex-1">
                                                    <input 
                                                        id="cover-letter-url-input"
                                                        type="text"
                                                        placeholder="Paste a LinkedIn, Indeed, or job posting URL"
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
                                                    className={`${featureChrome.secondaryButton} shrink-0`}
                                                >
                                                    {scraping ? <AppIcon icon={RiLoader4Line} size={16} className="animate-spin" /> : <AppIcon icon={RiFileSearchLine} size={16} />}
                                                    {scraping ? "Extracting…" : "Extract"}
                                                </button>
                                            </div>
                                            <p className={`${featureChrome.helper} hidden sm:block`}>
                                                Pulls the title, company, and requirements from supported listings.
                                            </p>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between gap-2">
                                                <label htmlFor="cover-letter-jd-input" className={featureChrome.label}>
                                                    Job description
                                                </label>
                                                <span className={featureChrome.helper}>
                                                    {formData.jobDescription.length} characters
                                                </span>
                                            </div>
                                            <textarea 
                                                id="cover-letter-jd-input"
                                                placeholder="Paste the job description, including requirements and company details."
                                                className={featureChrome.textarea}
                                                value={formData.jobDescription}
                                                onChange={(e) => {
                                                    setFormData({...formData, jobDescription: e.target.value});
                                                    if (intelligence) setIntelligence(null);
                                                }}
                                            />

                                            {formData.jobDescription.length > 50 && !intelligence && (
                                                <button
                                                    type="button"
                                                    onClick={handleEnrich}
                                                    disabled={enriching}
                                                    className={featureChrome.secondaryButton}
                                                >
                                                    {enriching ? <AppIcon icon={RiLoader4Line} size={16} className="animate-spin" /> : <AppIcon icon={RiSearchEyeLine} size={16} />}
                                                    {enriching ? "Analyzing…" : "Analyze role"}
                                                </button>
                                            )}

                                            {intelligence && (
                                                <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-3">
                                                    <div className="rounded-xl border border-neutral-200/70 bg-white p-3">
                                                        <p className="mb-2 font-sans text-xs font-medium text-muted-foreground">Role skills</p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {intelligence.skills.slice(0, 8).map((s, i) => (
                                                                <span key={i} className="rounded-lg border border-neutral-200 bg-muted px-2 py-0.5 font-sans text-xs font-medium text-foreground">{s}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="rounded-xl border border-neutral-200/70 bg-white p-3">
                                                        <p className="mb-2 font-sans text-xs font-medium text-muted-foreground">Company signals</p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {intelligence.companySignals.slice(0, 5).map((s, i) => (
                                                                <span key={i} className="rounded-lg border border-neutral-200 bg-muted px-2 py-0.5 font-sans text-xs font-medium text-foreground">{s}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="rounded-xl border border-neutral-200/70 bg-white p-3">
                                                        <p className="mb-2 font-sans text-xs font-medium text-muted-foreground">Requirements</p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {intelligence.requirements.slice(0, 5).map((s, i) => (
                                                                <span key={i} className="max-w-full truncate rounded-lg border border-neutral-200 bg-muted px-2 py-0.5 font-sans text-xs font-medium text-foreground">{s}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {error && (
                                            <div
                                                role="alert"
                                                className="flex items-start gap-2.5 rounded-xl border border-neutral-200/70 bg-muted px-3.5 py-3 font-sans text-sm"
                                            >
                                                <AppIcon icon={RiAlertLine} size={16} className="mt-0.5 text-muted-foreground" />
                                                <div className="space-y-0.5">
                                                    <p className="font-semibold text-foreground">Could not generate</p>
                                                    <p className="text-muted-foreground">{error}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex flex-col gap-3 rounded-xl border border-neutral-200/70 bg-muted/60 p-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <AppIcon icon={RiCheckLine} size={18} className="text-muted-foreground" />
                                                <div>
                                                    <p className="font-sans text-sm font-semibold text-foreground">Letter ready</p>
                                                    <p className={featureChrome.helper}>Drafted and ready for review</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={handleCopy}
                                                    aria-label="Copy letter text"
                                                    className={featureChrome.secondaryButton}
                                                >
                                                    {copied ? <AppIcon icon={RiCheckLine} size={16} /> : <AppIcon icon={RiFileCopyLine} size={16} />}
                                                    {copied ? "Copied" : "Copy text"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={downloadPDF}
                                                    disabled={isExporting}
                                                    aria-label="Download PDF"
                                                    className={featureChrome.primaryButton}
                                                >
                                                    {isExporting ? <AppIcon icon={RiLoader4Line} size={16} className="animate-spin" /> : <AppIcon icon={RiDownload2Line} size={16} />}
                                                    Download PDF
                                                </button>
                                            </div>
                                        </div>

                                        <CoverLetterDocument
                                            content={generatedContent || ""}
                                            candidateName={selectedCandidateName}
                                            className="mx-auto w-full max-w-[210mm] rounded-xl border border-neutral-200/70 p-6 sm:p-10"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className={featureChrome.dialogFooter}>
                                <p className={featureChrome.helper}>Uses 1 credit</p>
                                <div className="flex items-center justify-end gap-2">
                                    {!success ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={handleClose}
                                                className={featureChrome.ghostButton}
                                            >
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
                                                        Generating…
                                                    </>
                                                ) : (
                                                    <>
                                                        <AppIcon icon={RiMailSendLine} size={16} />
                                                        Generate
                                                    </>
                                                )}
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleClose}
                                            className={featureChrome.primaryButton}
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
