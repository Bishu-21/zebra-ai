"use client";
import { DashboardToolCard } from "./DashboardToolCard";

import React, { useCallback, useRef, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
    RiUploadCloud2Line,
    RiLoader4Line,
    RiCloseLine,
    RiFileTextLine,
    RiTerminalBoxLine,
    RiErrorWarningLine,
    RiRefreshLine,
} from "react-icons/ri";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { getErrorMessage } from "@/lib/async-error-handler";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import { FeatureIcon } from "@/components/dashboard/FeatureIcon";
import { AppIcon } from "@/components/ui/AppIcon";
import { featureChrome } from "@/components/dashboard/feature-chrome";

export function ImportResume({ defaultOpen = false }: { defaultOpen?: boolean } = {}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isModalOpen, setIsModalOpen] = useState(defaultOpen);
    const [activeTab, setActiveTab] = useState<"file" | "raw">("file");
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStep, setUploadStep] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [rawTitle, setRawTitle] = useState("");
    const [rawText, setRawText] = useState("");
    const { showToast } = useToast();
    const router = useRouter();
    const closeModal = useCallback(() => {
        if (!isUploading) setIsModalOpen(false);
    }, [isUploading]);
    const dialogRef = useDialogFocus(isModalOpen, closeModal);

    const openImportedResume = (resumeId: string) => {
        try {
            router.push(`/dashboard/resumes/${resumeId}`);
        } catch (err) {
            const message = getErrorMessage(err, "Could not open imported resume");
            setError(message);
            showToast(message, "error");
            setIsUploading(false);
            setUploadStep("");
        }
    };

    React.useEffect(() => {
        if (!isModalOpen) return;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isModalOpen]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isUploading) return;
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            const msg = "File size exceeds 5MB limit";
            setError(msg);
            showToast(msg, "error");
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        setIsUploading(true);
        setError(null);
        setUploadStep("Validating document...");

        const formData = new FormData();
        formData.append("file", file);

        try {
            setUploadStep("Extracting and mapping resume sections...");
            const res = await fetch("/api/resumes/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Resume extraction failed");

            setUploadStep("Structured draft ready for review.");
            showToast("Resume imported. Review the mapped sections before using suggestions.", "success");

            setTimeout(() => {
                setIsModalOpen(false);
                openImportedResume(data.id);
            }, 800);
        } catch (err) {
            const msg = getErrorMessage(err, "Failed to upload and extract document");
            setError(msg);
            showToast(msg, "error");
            setIsUploading(false);
            setUploadStep("");
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleRawImport = async (e?: React.SyntheticEvent) => {
        if (e) e.preventDefault();
        if (isUploading) return;

        if (!rawText.trim()) {
            const msg = "Please enter LaTeX or raw text content";
            setError(msg);
            showToast(msg, "error");
            return;
        }
        if (rawText.length < 50) {
            const msg = "Content is too short (min 50 characters)";
            setError(msg);
            showToast(msg, "error");
            return;
        }

        setIsUploading(true);
        setError(null);
        setUploadStep("Validating source text...");

        try {
            setUploadStep("Mapping source into resume sections...");
            const res = await fetch("/api/resumes/import-raw", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: rawText,
                    title: rawTitle || "Imported LaTeX",
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to import raw text");

            setUploadStep("Structured draft ready for review.");
            showToast("Source imported. Review the mapped sections before using suggestions.", "success");

            setTimeout(() => {
                setIsModalOpen(false);
                openImportedResume(data.id);
            }, 800);
        } catch (err) {
            const msg = getErrorMessage(err, "Failed to import raw text");
            setError(msg);
            showToast(msg, "error");
            setIsUploading(false);
            setUploadStep("");
        }
    };

    return (
        <>
            <DashboardToolCard
                icon={RiUploadCloud2Line}
                title="Import resume"
                description="Upload a PDF, DOCX, or text file, or paste text or LaTeX."
                onClick={() => setIsModalOpen(true)}
            />

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={featureChrome.backdrop}
                            onClick={closeModal}
                        />

                        <m.div
                            ref={dialogRef}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="import-resume-title"
                            initial={{ scale: 0.98, opacity: 0, y: 8 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.98, opacity: 0, y: 8 }}
                            transition={{ duration: 0.16, ease: "easeOut" }}
                            className={`${featureChrome.dialog} max-w-2xl`}
                        >
                            <AnimatePresence>
                                {isUploading && (
                                    <m.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-white/90 p-8 text-center"
                                    >
                                        <AppIcon icon={RiLoader4Line} size={24} className="animate-spin text-foreground" />
                                        <p className="text-sm font-medium text-foreground">{uploadStep}</p>
                                    </m.div>
                                )}
                            </AnimatePresence>

                            <div className={featureChrome.dialogHeader}>
                                <div className="flex min-w-0 flex-1 items-start gap-2.5 sm:items-center">
                                    <FeatureIcon feature="Resumes" size={18} className="text-muted-foreground" />
                                    <div className="min-w-0">
                                        <h2 id="import-resume-title" className="text-base font-semibold tracking-tight text-foreground">
                                            Import resume
                                        </h2>
                                        <p className={featureChrome.helper}>Upload a document or paste text</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    aria-label="Close import resume"
                                    className={featureChrome.iconButton}
                                >
                                    <AppIcon icon={RiCloseLine} size={18} />
                                </button>
                            </div>

                            <div className="flex border-b border-neutral-200/70 px-4">
                                <button
                                    type="button"
                                    disabled={isUploading}
                                    onClick={() => { setError(null); setActiveTab("file"); }}
                                    className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-3 text-sm font-medium transition-colors ${
                                        activeTab === "file"
                                            ? "border-foreground text-foreground"
                                            : "border-transparent text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    <AppIcon icon={RiFileTextLine} size={15} />
                                    Document
                                </button>
                                <button
                                    type="button"
                                    disabled={isUploading}
                                    onClick={() => { setError(null); setActiveTab("raw"); }}
                                    className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-3 text-sm font-medium transition-colors ${
                                        activeTab === "raw"
                                            ? "border-foreground text-foreground"
                                            : "border-transparent text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    <AppIcon icon={RiTerminalBoxLine} size={15} />
                                    Text or LaTeX
                                </button>
                            </div>

                            <div className={featureChrome.dialogBody}>
                                {error && (
                                    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                        <div className="flex items-center gap-2">
                                            <AppIcon icon={RiErrorWarningLine} size={16} className="text-red-600" />
                                            <span>{error}</span>
                                        </div>
                                        <button
                                            type="button"
                                            disabled={isUploading}
                                            onClick={(e) => {
                                                setError(null);
                                                if (activeTab === "file") {
                                                    fileInputRef.current?.click();
                                                } else {
                                                    handleRawImport(e);
                                                }
                                            }}
                                            className={featureChrome.secondaryButton}
                                        >
                                            <AppIcon icon={RiRefreshLine} size={14} />
                                            Retry
                                        </button>
                                    </div>
                                )}

                                {activeTab === "file" ? (
                                    <div
                                        onClick={() => !isUploading && fileInputRef.current?.click()}
                                        onKeyDown={(event) => {
                                            if (!isUploading && (event.key === "Enter" || event.key === " ")) {
                                                event.preventDefault();
                                                fileInputRef.current?.click();
                                            }
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-muted/40 p-8 text-center ${
                                            isUploading ? "pointer-events-none opacity-50" : "hover:border-neutral-400"
                                        }`}
                                    >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                            accept=".pdf,.docx,.txt"
                                            disabled={isUploading}
                                            className="hidden"
                                        />
                                        <AppIcon icon={RiUploadCloud2Line} size={22} className="text-muted-foreground" />
                                        <h3 className="mt-3 text-sm font-semibold text-foreground">Upload a document</h3>
                                        <p className={`mt-1 max-w-xs ${featureChrome.helper}`}>
                                            PDF, DOCX, or TXT up to 5MB. Import uses one AI credit and preserves the original text for review.
                                        </p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleRawImport} className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label htmlFor="import-resume-title-field" className={featureChrome.label}>
                                                Document title
                                            </label>
                                            <input
                                                id="import-resume-title-field"
                                                type="text"
                                                value={rawTitle}
                                                disabled={isUploading}
                                                onChange={(e) => setRawTitle(e.target.value)}
                                                placeholder="e.g. Master resume draft"
                                                className={featureChrome.input}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label htmlFor="import-resume-raw-text" className={featureChrome.label}>
                                                Text or LaTeX
                                            </label>
                                            <textarea
                                                id="import-resume-raw-text"
                                                value={rawText}
                                                disabled={isUploading}
                                                onChange={(e) => setRawText(e.target.value)}
                                                rows={8}
                                                placeholder="Paste LaTeX markup or unformatted resume text."
                                                className={`${featureChrome.textarea} font-mono`}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isUploading || !rawText.trim()}
                                            className={`${featureChrome.primaryButton} w-full`}
                                        >
                                            Import resume
                                        </button>
                                    </form>
                                )}
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
