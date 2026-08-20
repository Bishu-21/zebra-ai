"use client";

import React, { useRef, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
    RiUploadCloud2Line,
    RiArrowRightSLine,
    RiLoader4Line,
    RiCloseLine,
    RiFileTextLine,
    RiTerminalBoxLine,
    RiArrowRightLine,
    RiErrorWarningLine,
    RiRefreshLine
} from "react-icons/ri";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { getErrorMessage } from "@/lib/async-error-handler";

export function ImportResume() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"file" | "raw">("file");
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStep, setUploadStep] = useState("");
    const [error, setError] = useState<string | null>(null);

    // Raw import states
    const [rawTitle, setRawTitle] = useState("");
    const [rawText, setRawText] = useState("");

    const { showToast } = useToast();
    const router = useRouter();

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
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !isUploading) setIsModalOpen(false);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isModalOpen, isUploading]);

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
            if (!res.ok) throw new Error(data.error || "Neural extraction failed");

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
                    title: rawTitle || "Imported LaTeX"
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
            {/* The Trigger Card */}
            <div
                onClick={() => setIsModalOpen(true)}
                className="group/card relative overflow-hidden flex flex-col justify-between h-full cursor-pointer transition-all p-7 bg-white border border-neutral-200/80 rounded-3xl hover:border-neutral-300 hover:shadow-xl active:scale-[0.99] group shadow-xs"
            >
                <div className="flex items-start justify-between mb-8">
                    <div className="w-11 h-11 bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-600 group-hover/card:bg-[#0A0A0A] group-hover/card:text-white transition-colors duration-300">
                        <RiUploadCloud2Line size={22} />
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                        <span className="text-xs font-semibold text-neutral-500">Upload File</span>
                        <RiArrowRightSLine size={16} className="text-[#0A0A0A]" />
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-xl mb-1.5 text-[#0A0A0A] tracking-tight">Import Resume</h3>
                    <p className="text-xs text-neutral-500 font-normal leading-relaxed">
                        Import PDF, Word document, or LaTeX source files.
                    </p>
                </div>
            </div>

            {/* Centered Dual-Tab Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10">
                        {/* Overlay backdrop */}
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in duration-300"
                            onClick={() => !isUploading && setIsModalOpen(false)}
                        />

                        {/* Modal Box */}
                        <m.div
                            initial={{ scale: 0.96, opacity: 0, y: 12 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.96, opacity: 0, y: 12 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="relative bg-white w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl border border-neutral-200/80 overflow-hidden flex flex-col z-10"
                        >
                            {/* Cinematic In-Modal Loading Screen */}
                            <AnimatePresence>
                                {isUploading && (
                                    <m.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 z-50 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center gap-6 p-8 text-center"
                                    >
                                        <div className="w-12 h-12 bg-[#0A0A0A] rounded-full flex items-center justify-center text-white">
                                            <RiLoader4Line size={24} className="animate-spin" />
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-xs font-bold text-[#0A0A0A]">
                                                {uploadStep}
                                            </span>
                                            <div className="w-40 h-1.5 bg-neutral-200 rounded-full overflow-hidden mx-auto">
                                                <m.div
                                                    className="h-full bg-[#0A0A0A]"
                                                    initial={{ width: "0%" }}
                                                    animate={{ width: "100%" }}
                                                    transition={{ duration: 3, ease: "easeInOut" }}
                                                />
                                            </div>
                                        </div>
                                    </m.div>
                                )}
                            </AnimatePresence>

                            {/* Header */}
                            <div className="px-6 py-5 border-b border-neutral-200/60 flex items-center justify-between bg-white sticky top-0 z-20">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center shadow-2xs shrink-0">
                                        <RiUploadCloud2Line size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold tracking-tight text-[#0A0A0A]">Import Resume</h2>
                                        <p className="text-xs font-normal text-neutral-500">Upload a document file or paste raw text</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-[#0A0A0A] flex items-center justify-center transition-all"
                                >
                                    <RiCloseLine size={18} />
                                </button>
                            </div>

                            {/* Tabs Switcher */}
                            <div className="flex border-b border-neutral-200/60 px-6 sm:px-8 bg-neutral-50/50">
                                <button
                                    disabled={isUploading}
                                    onClick={() => { setError(null); setActiveTab("file"); }}
                                    className={`py-3.5 px-4 text-xs font-semibold tracking-tight flex items-center gap-2 border-b-2 transition-all ${
                                        activeTab === "file"
                                            ? "border-[#0A0A0A] text-[#0A0A0A]"
                                            : "border-transparent text-neutral-500 hover:text-[#0A0A0A]"
                                    }`}
                                >
                                    <RiFileTextLine size={15} />
                                    Document Upload
                                </button>
                                <button
                                    disabled={isUploading}
                                    onClick={() => { setError(null); setActiveTab("raw"); }}
                                    className={`py-3.5 px-4 text-xs font-semibold tracking-tight flex items-center gap-2 border-b-2 transition-all ${
                                        activeTab === "raw"
                                            ? "border-[#0A0A0A] text-[#0A0A0A]"
                                            : "border-transparent text-neutral-500 hover:text-[#0A0A0A]"
                                    }`}
                                >
                                    <RiTerminalBoxLine size={15} />
                                    LaTeX / Raw Text
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="p-6 sm:p-8 overflow-y-auto max-h-[60vh] flex-grow space-y-6">
                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200/80 text-red-700 rounded-xl text-xs font-medium flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <RiErrorWarningLine size={16} className="shrink-0 text-red-600" />
                                            <span>{error}</span>
                                        </div>
                                        <button
                                            disabled={isUploading}
                                            onClick={(e) => {
                                                setError(null);
                                                if (activeTab === "file") {
                                                    fileInputRef.current?.click();
                                                } else {
                                                    handleRawImport(e);
                                                }
                                            }}
                                            className="px-3 py-1.5 bg-white text-red-700 border border-red-200 rounded-full font-bold text-xs hover:bg-red-100/50 transition-all flex items-center gap-1 shrink-0 disabled:opacity-50"
                                        >
                                            <RiRefreshLine size={14} />
                                            Retry
                                        </button>
                                    </div>
                                )}

                                {activeTab === "file" ? (
                                    /* Tab 1: File Upload */
                                    <div className="space-y-6">
                                        <div
                                            onClick={() => !isUploading && fileInputRef.current?.click()}
                                            className={`border-2 border-dashed border-neutral-200/80 bg-neutral-50/50 rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center text-center transition-all group ${
                                                isUploading ? "opacity-50 cursor-not-allowed" : "hover:border-[#0A0A0A] hover:bg-neutral-50 cursor-pointer"
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
                                            <div className="w-12 h-12 bg-white border border-neutral-200/80 rounded-full flex items-center justify-center text-neutral-600 group-hover:scale-105 shadow-2xs transition-all mb-3">
                                                <RiUploadCloud2Line size={24} />
                                            </div>
                                            <h3 className="font-bold text-sm text-[#0A0A0A] mb-1">Click to Upload Document</h3>
                                            <p className="text-xs text-neutral-500 max-w-xs leading-relaxed">
                                                PDF, DOCX, or TXT up to 5MB. Import uses one AI credit and preserves the original text for review.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    /* Tab 2: Raw LaTeX / Text */
                                    <form onSubmit={handleRawImport} className="space-y-5">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
                                                Document Title
                                            </label>
                                            <input
                                                type="text"
                                                value={rawTitle}
                                                disabled={isUploading}
                                                onChange={(e) => setRawTitle(e.target.value)}
                                                placeholder="e.g. Master Resume Draft"
                                                className="w-full bg-neutral-50 border border-neutral-200/80 focus:bg-white focus:border-[#0A0A0A] rounded-full px-4 py-2.5 text-xs font-semibold text-[#0A0A0A] outline-none transition-all disabled:opacity-50"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
                                                LaTeX Code / Raw Text
                                            </label>
                                            <textarea
                                                value={rawText}
                                                disabled={isUploading}
                                                onChange={(e) => setRawText(e.target.value)}
                                                rows={8}
                                                placeholder="Paste your raw LaTeX markup or unformatted text resume here..."
                                                className="w-full bg-neutral-50 border border-neutral-200/80 focus:bg-white focus:border-[#0A0A0A] rounded-2xl p-4 text-xs font-mono text-[#0A0A0A] outline-none transition-all resize-y min-h-[180px] disabled:opacity-50"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isUploading || !rawText.trim()}
                                            className="w-full px-6 py-3 bg-[#0A0A0A] text-white rounded-full text-xs font-bold shadow-2xs hover:bg-neutral-800 active:scale-95 transition-all inline-flex items-center justify-center gap-2 disabled:opacity-40"
                                        >
                                            Import Resume
                                            <RiArrowRightLine size={15} />
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
