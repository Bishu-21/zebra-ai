"use client";
import { DashboardToolCard } from "./DashboardToolCard";

import React, { useCallback, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
    RiCloseLine,
    RiCheckboxCircleLine,
    RiErrorWarningLine,
    RiArrowDropDownLine,
    RiLoader4Line,
    RiUploadCloud2Line,
    RiLink,
    RiFileSearchLine,
    RiSaveLine,
    RiRefreshLine,
} from "react-icons/ri";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { getErrorMessage } from "@/lib/async-error-handler";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import { FeatureIcon } from "@/components/dashboard/FeatureIcon";
import { AppIcon } from "@/components/ui/AppIcon";
import { featureChrome } from "@/components/dashboard/feature-chrome";

export interface Resume {
    id: string;
    title: string;
    content?: string | null;
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
    const [availableResumes, setAvailableResumes] = useState<Resume[]>(resumes);
    const [isUploadingResume, setIsUploadingResume] = useState(false);
    const [jobUrl, setJobUrl] = useState("");
    const [importingJob, setImportingJob] = useState(false);
    const [jobSource, setJobSource] = useState("");
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const jobFileInputRef = React.useRef<HTMLInputElement>(null);
    const router = useRouter();
    const closeDialog = useCallback(() => {
        if (!(loading || isUploadingResume || importingJob)) setIsOpen(false);
    }, [importingJob, isUploadingResume, loading]);
    const dialogRef = useDialogFocus(isOpen, closeDialog);

    const importJobUrl = useCallback(async (url: string) => {
        setImportingJob(true);
        setError(null);
        setJobSource("");
        try {
            const response = await fetch("/api/jobs/scrape", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.error || "Could not read this job page. Upload a PDF or paste its description.");
            if (!data.description?.trim()) throw new Error("The page did not provide a readable job description. Upload a PDF or paste the description.");
            setFormData(current => ({ ...current, company: data.company || "", targetRole: data.position || "", jobDescription: data.description }));
            setAnalysis(null);
            setJobSource(data.fieldSource === "page-metadata" ? `${url} (page text imported; check company and role)` : url);
        } catch (cause) {
            setError(`${cause instanceof Error ? cause.message : "Could not import this job page."} Any text already entered has been kept.`);
        } finally {
            setImportingJob(false);
        }
    }, []);

    React.useEffect(() => {
        const open = () => {
            setIsOpen(true);
            sessionStorage.removeItem("zebu:pending-tool");
            const pendingUrl = sessionStorage.getItem("zebu:pending-job-url");
            if (pendingUrl) {
                sessionStorage.removeItem("zebu:pending-job-url");
                setJobUrl(pendingUrl);
                void importJobUrl(pendingUrl);
            }
        };
        window.addEventListener("zebu:open-role_match", open);
        if (sessionStorage.getItem("zebu:pending-tool") === "role_match") open();
        return () => window.removeEventListener("zebu:open-role_match", open);
    }, [importJobUrl]);

    const isBusy = loading || isUploadingResume || importingJob;

    const importJobFile = async (file?: File) => {
        if (!file || isBusy) return;
        setImportingJob(true);
        setError(null);
        setJobSource("");
        try {
            const body = new FormData();
            body.append("file", file);
            const response = await fetch("/api/jobs/extract", { method: "POST", body });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Could not read the job document.");
            setFormData(current => ({ ...current, jobDescription: data.jobDescription, company: "", targetRole: "" }));
            setAnalysis(null);
            setJobSource(file.name);
        } catch (cause) {
            setError(`${cause instanceof Error ? cause.message : "Could not read the job document."} Any text already entered has been kept.`);
        } finally {
            setImportingJob(false);
            if (jobFileInputRef.current) jobFileInputRef.current.value = "";
        }
    };

    const refreshDashboard = () => {
        try {
            router.refresh();
        } catch (err) {
            const msg = getErrorMessage(err, "Dashboard refresh failed");
            setError(msg);
        }
    };

    React.useEffect(() => {
        if (!isOpen) return;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || isBusy) return;

        setIsUploadingResume(true);
        setError(null);
        setScanStep("Extracting and mapping resume sections...");
        const body = new FormData();
        body.append("file", file);

        try {
            const response = await fetch("/api/resumes/upload", { method: "POST", body });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Resume upload failed");

            const uploaded: Resume = { id: data.id, title: data.title, content: data.content };
            setAvailableResumes((current) => [uploaded, ...current.filter((item) => item.id !== uploaded.id)]);
            setFormData((current) => ({ ...current, resumeId: uploaded.id }));
            showToast("Resume structured and selected. Review it later in your resume vault.", "success");
            refreshDashboard();
        } catch (uploadError: unknown) {
            const message = getErrorMessage(uploadError, "Could not upload this resume");
            setError(message);
            showToast(message, "error");
        } finally {
            setIsUploadingResume(false);
            setScanStep("");
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleTailor = async () => {
        if (isBusy) return;

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
                headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
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
            <DashboardToolCard
                icon={RiFileSearchLine}
                title="Review against a job"
                description="Compare a resume with a job description and review suggested changes."
                onClick={() => setIsOpen(true)}
            />

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={featureChrome.backdrop}
                            onClick={closeDialog}
                        />

                        <m.div
                            ref={dialogRef}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="role-match-title"
                            initial={{ scale: 0.98, opacity: 0, y: 8 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.98, opacity: 0, y: 8 }}
                            transition={{ duration: 0.16, ease: "easeOut" }}
                            className={`${featureChrome.dialog} max-w-2xl`}
                        >
                            <div className={featureChrome.dialogHeader}>
                                <div className="flex min-w-0 flex-1 items-start gap-2.5 sm:items-center">
                                    <FeatureIcon feature="Resumes" size={18} className="text-muted-foreground" />
                                    <div className="min-w-0">
                                        <h2 id="role-match-title" className="text-base font-semibold tracking-tight text-foreground">
                                            Review against a job
                                        </h2>
                                        <p className={featureChrome.helper}>Compare a resume with a job description</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeDialog}
                                    aria-label="Close job match"
                                    className={featureChrome.iconButton}
                                    disabled={isBusy}
                                >
                                    <AppIcon icon={RiCloseLine} size={18} />
                                </button>
                            </div>

                            <div className={`${featureChrome.dialogBody} space-y-5`}>
                                {!analysis ? (
                                    <div className="space-y-5">
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div className="space-y-1.5 sm:col-span-2">
                                                <label htmlFor="role-match-resume" className={featureChrome.label}>
                                                    Base resume
                                                </label>
                                                <div className="flex flex-col gap-2 sm:flex-row">
                                                    <div className="relative flex-1">
                                                        <select
                                                            id="role-match-resume"
                                                            disabled={isBusy}
                                                            className={featureChrome.select}
                                                            value={formData.resumeId}
                                                            onChange={(e) => setFormData({ ...formData, resumeId: e.target.value })}
                                                        >
                                                            {availableResumes.map((r) => (
                                                                <option key={r.id} value={r.id}>{r.title}</option>
                                                            ))}
                                                            {availableResumes.length === 0 && <option value="">No resumes yet</option>}
                                                        </select>
                                                        <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                                                            <AppIcon icon={RiArrowDropDownLine} size={20} />
                                                        </div>
                                                    </div>
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        accept=".pdf,.docx,.txt"
                                                        onChange={handleResumeUpload}
                                                        className="hidden"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        disabled={isBusy}
                                                        className={featureChrome.secondaryButton}
                                                    >
                                                        {isUploadingResume ? (
                                                            <AppIcon icon={RiLoader4Line} size={15} className="animate-spin" />
                                                        ) : (
                                                            <AppIcon icon={RiUploadCloud2Line} size={15} />
                                                        )}
                                                        {isUploadingResume ? "Structuring..." : "Upload resume"}
                                                    </button>
                                                </div>
                                                <p className={featureChrome.helper}>PDF, DOCX, or TXT up to 5MB. The original source is preserved for review.</p>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label htmlFor="role-match-company" className={featureChrome.label}>Company</label>
                                                <input
                                                    id="role-match-company"
                                                    type="text"
                                                    disabled={isBusy}
                                                    placeholder="e.g. Example Co."
                                                    className={featureChrome.input}
                                                    value={formData.company}
                                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label htmlFor="role-match-role" className={featureChrome.label}>Role</label>
                                                <input
                                                    id="role-match-role"
                                                    type="text"
                                                    disabled={isBusy}
                                                    placeholder="e.g. Frontend developer"
                                                    className={featureChrome.input}
                                                    value={formData.targetRole}
                                                    onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label htmlFor="role-match-job-url" className={featureChrome.label}>Job link</label>
                                            <div className="flex flex-col gap-2 sm:flex-row">
                                                <div className="relative min-w-0 flex-1">
                                                    <AppIcon icon={RiLink} size={16} className={featureChrome.fieldIcon} />
                                                    <input
                                                        id="role-match-job-url"
                                                        type="url"
                                                        value={jobUrl}
                                                        onChange={(event) => setJobUrl(event.target.value)}
                                                        disabled={isBusy}
                                                        placeholder="https://company.com/careers/role"
                                                        className={`${featureChrome.input} pl-10`}
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => void importJobUrl(jobUrl.trim())}
                                                    disabled={isBusy || !jobUrl.trim()}
                                                    className={featureChrome.primaryButton}
                                                >
                                                    <AppIcon icon={RiFileSearchLine} size={16} />
                                                    {importingJob ? "Importing…" : "Import job"}
                                                </button>
                                                <input
                                                    ref={jobFileInputRef}
                                                    type="file"
                                                    accept=".pdf,.txt,application/pdf,text/plain"
                                                    className="hidden"
                                                    onChange={(event) => void importJobFile(event.target.files?.[0])}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => jobFileInputRef.current?.click()}
                                                    disabled={isBusy}
                                                    className={featureChrome.secondaryButton}
                                                >
                                                    Upload PDF or TXT
                                                </button>
                                            </div>
                                            {jobSource && (
                                                <p role="status" className={featureChrome.helper}>
                                                    Imported from {jobSource}. Check the fields and description before analysis.
                                                </p>
                                            )}
                                            {importingJob && (
                                                <p role="status" className={featureChrome.helper}>Reading the job source…</p>
                                            )}
                                        </div>

                                        <div className="relative space-y-1.5">
                                            <label htmlFor="role-match-description" className={featureChrome.label}>
                                                Job description
                                            </label>
                                            <AnimatePresence>
                                                {loading && (
                                                    <m.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/90 p-6"
                                                    >
                                                        <AppIcon icon={RiLoader4Line} size={24} className="animate-spin text-foreground" />
                                                        <p className="text-sm font-medium text-foreground">{scanStep}</p>
                                                    </m.div>
                                                )}
                                            </AnimatePresence>
                                            <textarea
                                                id="role-match-description"
                                                placeholder="Import a job link or PDF above, or paste the description here."
                                                className={`${featureChrome.textarea} min-h-[180px]`}
                                                value={formData.jobDescription}
                                                onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                                                disabled={isBusy}
                                            />
                                        </div>

                                        {error && (
                                            <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                                <div className="flex items-center gap-2">
                                                    <AppIcon icon={RiErrorWarningLine} size={16} className="text-red-600" />
                                                    <span>{error}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => formData.jobDescription.trim() ? void handleTailor() : jobUrl.trim() ? void importJobUrl(jobUrl.trim()) : jobFileInputRef.current?.click()}
                                                    disabled={isBusy}
                                                    className={featureChrome.secondaryButton}
                                                >
                                                    <AppIcon icon={RiRefreshLine} size={14} />
                                                    Retry
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                            <div className={`${featureChrome.card} items-center text-center`}>
                                                <p className={featureChrome.helper}>Match score</p>
                                                <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">{analysis.matchScore}%</p>
                                            </div>
                                            <div className={`${featureChrome.card} sm:col-span-2`}>
                                                <p className={featureChrome.helper}>Role fit</p>
                                                <p className="mt-1 text-sm leading-6 text-foreground">{analysis.roleFit}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <h4 className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                                                    <AppIcon icon={RiCheckboxCircleLine} size={16} className="text-emerald-600" />
                                                    Keywords found
                                                </h4>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {(analysis.keywordsFound || []).map((kw: string, i: number) => (
                                                        <span key={i} className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                                                            {kw}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                                                    <AppIcon icon={RiErrorWarningLine} size={16} className="text-amber-600" />
                                                    Missing keywords
                                                </h4>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {(analysis.keywordsMissing || []).map((kw: string, i: number) => (
                                                        <span key={i} className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                                                            {kw}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className={`${featureChrome.card} space-y-3`}>
                                            <h4 className="text-sm font-semibold text-foreground">Suggested changes</h4>
                                            <ol className="space-y-2">
                                                {(analysis.tailoringSuggestions || []).map((tip: string, i: number) => (
                                                    <li key={i} className="flex items-start gap-3 text-sm leading-6 text-neutral-700">
                                                        <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium text-foreground">
                                                            {i + 1}
                                                        </span>
                                                        <span>{tip}</span>
                                                    </li>
                                                ))}
                                            </ol>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className={featureChrome.dialogFooter}>
                                {!analysis ? (
                                    <>
                                        <button type="button" onClick={closeDialog} disabled={isBusy} className={featureChrome.ghostButton}>
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleTailor}
                                            disabled={isBusy || !formData.resumeId || !formData.jobDescription.trim()}
                                            className={featureChrome.primaryButton}
                                        >
                                            {loading ? "Analyzing..." : "Run analysis"}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setAnalysis(null);
                                                setIsOpen(false);
                                            }}
                                            className={featureChrome.ghostButton}
                                        >
                                            Close
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSaveVersion}
                                            disabled={savingVersion}
                                            className={featureChrome.primaryButton}
                                        >
                                            {savingVersion ? (
                                                <AppIcon icon={RiLoader4Line} size={15} className="animate-spin" />
                                            ) : (
                                                <AppIcon icon={RiSaveLine} size={15} />
                                            )}
                                            {savingVersion ? "Saving..." : "Save analysis snapshot"}
                                        </button>
                                    </>
                                )}
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
