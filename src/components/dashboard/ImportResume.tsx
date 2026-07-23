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
    RiArrowRightLine
} from "react-icons/ri";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

export function ImportResume() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"file" | "raw">("file");
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStep, setUploadStep] = useState("");
    
    // Raw import states
    const [rawTitle, setRawTitle] = useState("");
    const [rawText, setRawText] = useState("");

    const { showToast } = useToast();
    const router = useRouter();

    const openImportedResume = (resumeId: string) => {
        try {
            router.push(`/dashboard/resumes/${resumeId}`);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Could not open imported resume";
            showToast(message, "error");
            setIsUploading(false);
            setUploadStep("");
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            showToast("File size exceeds 5MB limit", "error");
            return;
        }

        setIsUploading(true);
        setUploadStep("Establishing Secure Connection...");
        
        const formData = new FormData();
        formData.append("file", file);

        try {
            setUploadStep("Extracting Document Data...");
            const res = await fetch("/api/resumes/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Neural extraction failed");

            setUploadStep("Mapping Document Structure...");
            showToast("Resume imported successfully", "success");
            
            setTimeout(() => {
                setIsModalOpen(false);
                openImportedResume(data.id);
            }, 800);

        } catch (err) {
            const error = err as Error;
            showToast(error.message, "error");
            setIsUploading(false);
            setUploadStep("");
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleRawImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rawText.trim()) {
            showToast("Please enter LaTeX or raw text content", "error");
            return;
        }
        if (rawText.length < 50) {
            showToast("Content is too short (min 50 characters)", "error");
            return;
        }

        setIsUploading(true);
        setUploadStep("Ingesting Raw Text...");

        try {
            setUploadStep("Writing Draft to Database...");
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

            setUploadStep("Structuring Document...");
            showToast("Narrative imported successfully", "success");

            setTimeout(() => {
                setIsModalOpen(false);
                openImportedResume(data.id);
            }, 800);
        } catch (err) {
            const error = err as Error;
            showToast(error.message, "error");
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
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-black/[0.05] overflow-hidden flex flex-col max-h-[90vh]"
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
                                        <div className="w-16 h-16 bg-[#0A0A0A]/5 rounded-2xl flex items-center justify-center text-[#0A0A0A]">
                                            <RiLoader4Line size={32} className="animate-spin" />
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#0A0A0A] animate-pulse">
                                                {uploadStep}
                                            </span>
                                            <div className="w-40 h-1 bg-black/[0.05] rounded-full overflow-hidden mx-auto">
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
                            <div className="p-8 border-b border-black/[0.04] flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-black/[0.03] rounded-2xl flex items-center justify-center text-[#0A0A0A]">
                                        <RiUploadCloud2Line size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-[#0A0A0A] tracking-tight">Import Professional Source</h2>
                                        <p className="text-[0.7rem] font-bold text-[#737373] uppercase tracking-wider">Sync structured details or compile raw text</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-10 h-10 bg-black/[0.03] rounded-full flex items-center justify-center text-[#737373] hover:text-[#0A0A0A] hover:bg-black/[0.06] transition-all"
                                >
                                    <RiCloseLine size={20} />
                                </button>
                            </div>

                            {/* Tabs Switcher */}
                            <div className="flex border-b border-black/[0.04] px-8 bg-neutral-50/50">
                                <button 
                                    onClick={() => setActiveTab("file")}
                                    className={`py-4 px-6 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
                                        activeTab === "file" 
                                            ? "border-[#0A0A0A] text-[#0A0A0A]" 
                                            : "border-transparent text-[#737373] hover:text-[#0A0A0A]"
                                    }`}
                                >
                                    <RiFileTextLine size={16} />
                                    Document Upload
                                </button>
                                <button 
                                    onClick={() => setActiveTab("raw")}
                                    className={`py-4 px-6 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
                                        activeTab === "raw" 
                                            ? "border-[#0A0A0A] text-[#0A0A0A]" 
                                            : "border-transparent text-[#737373] hover:text-[#0A0A0A]"
                                    }`}
                                >
                                    <RiTerminalBoxLine size={16} />
                                    LaTeX / Raw Text
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="p-8 overflow-y-auto max-h-[60vh] custom-scrollbar flex-grow">
                                {activeTab === "file" ? (
                                    /* Tab 1: File Upload */
                                    <div className="space-y-6">
                                        <div 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="border-2 border-dashed border-black/[0.08] hover:border-black/30 bg-neutral-50/50 hover:bg-neutral-50 rounded-3xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
                                        >
                                            <input 
                                                type="file" 
                                                ref={fileInputRef}
                                                onChange={handleFileUpload}
                                                accept=".pdf,.docx,.txt"
                                                className="hidden"
                                            />
                                            <div className="w-16 h-16 bg-white border border-black/[0.04] rounded-2xl flex items-center justify-center text-[#737373] group-hover:scale-110 shadow-sm transition-all mb-4">
                                                <RiUploadCloud2Line size={28} />
                                            </div>
                                            <h3 className="font-bold text-lg text-[#0A0A0A] mb-1">Click to Upload Document</h3>
                                            <p className="text-xs text-[#737373] max-w-xs leading-relaxed">
                                                Supports PDF, DOCX, or TXT up to 5MB. Make sure files contain readable text rather than image scans.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    /* Tab 2: Raw LaTeX / Text */
                                    <form onSubmit={handleRawImport} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[0.65rem] font-bold text-[#737373] uppercase tracking-[0.2em] block">
                                                Document Title
                                            </label>
                                            <input 
                                                type="text"
                                                value={rawTitle}
                                                onChange={(e) => setRawTitle(e.target.value)}
                                                placeholder="e.g. LaTeX Master Resume, Raw Draft"
                                                className="w-full h-12 bg-white border border-black/[0.08] rounded-2xl px-4 text-sm font-bold text-[#0A0A0A] focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] outline-none transition-all"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[0.65rem] font-bold text-[#737373] uppercase tracking-[0.2em] block">
                                                LaTeX Code / Raw Text
                                            </label>
                                            <textarea 
                                                value={rawText}
                                                onChange={(e) => setRawText(e.target.value)}
                                                rows={10}
                                                placeholder="Paste your raw LaTeX markup or unformatted text resume here..."
                                                className="w-full bg-white border border-black/[0.08] rounded-3xl p-5 text-xs font-mono text-[#0A0A0A] focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] outline-none transition-all resize-y min-h-[200px]"
                                            />
                                        </div>

                                        <button 
                                            type="submit"
                                            className="w-full h-14 bg-[#0A0A0A] text-white hover:bg-neutral-800 rounded-2xl font-bold text-sm tracking-wide transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                                        >
                                            Import Narrative Source
                                            <RiArrowRightLine size={16} />
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
