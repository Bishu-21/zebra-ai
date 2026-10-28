"use client";
import React, { useCallback, useState } from "react";
import { 
    RiDeleteBinLine, 
    RiArrowRightSLine, 
    RiCloseLine, 
    RiCheckLine, 
    RiFileCopyLine, 
    RiDownload2Line, 
    RiMailSendLine
} from "react-icons/ri";
import { useRouter } from "next/navigation";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import { CoverLetterDocument } from "@/components/dashboard/CoverLetterDocument";
import { AppIcon } from "@/components/ui/AppIcon";

type CoverLetter = {
    id: string;
    title: string;
    content: string;
    createdAt: Date;
    resumeId?: string | null;
    candidateName?: string;
};

export function CoverLetterActions({ letter }: { letter: CoverLetter }) {
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [copied, setCopied] = useState(false);
    const router = useRouter();

    const handleClose = useCallback(() => {
        setIsViewOpen(false);
    }, []);

    const dialogRef = useDialogFocus(isViewOpen, handleClose);

    const handleCopy = () => {
        navigator.clipboard.writeText(letter.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this cover letter? This action cannot be undone.")) return;
        
        setIsDeleting(true);
        try {
            const res = await fetch("/api/cover-letters", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: letter.id }),
            });
            if (res.ok) {
                router.refresh();
            } else {
                alert("Failed to delete. Please try again.");
            }
        } catch {
            alert("Network error.");
        } finally {
            setIsDeleting(false);
        }
    };

    const downloadPDF = async () => {
        setIsExporting(true);
        try {
            const res = await fetch("/api/export/pdf/cover-letter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: letter.content,
                    title: letter.title,
                    resumeId: letter.resumeId || undefined,
                }),
            });

            if (!res.ok) throw new Error("Export failed");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${letter.title.replace(/\s+/g, "_")}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("PDF generation failed:", err);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <>
            <div className="flex items-center gap-3 pt-6 border-t border-neutral-100 group-hover:border-neutral-200 transition-colors duration-300">
                <button 
                    onClick={() => setIsViewOpen(true)}
                    aria-label="Preview cover letter"
                    className="flex-grow h-12 bg-neutral-950 text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group/btn focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
                >
                    View Letter
                    <AppIcon icon={RiArrowRightSLine} size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
                <button 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    aria-label="Delete cover letter"
                    className="w-12 h-12 border border-neutral-200 rounded-xl flex items-center justify-center text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-950"
                >
                    {isDeleting ? (
                        <span className="w-4 h-4 border-2 border-red-400/30 border-t-red-500 rounded-full animate-spin"></span>
                    ) : (
                        <AppIcon icon={RiDeleteBinLine} size={18} />
                    )}
                </button>
            </div>

            {isViewOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 overflow-y-auto">
                    <div 
                        aria-hidden="true"
                        className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm" 
                        onClick={handleClose}
                    />
                    <div 
                        ref={dialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={`letter-title-${letter.id}`}
                        className="relative bg-white w-full max-w-4xl max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] rounded-2xl sm:rounded-3xl shadow-2xl border border-neutral-200 flex flex-col overflow-hidden my-auto z-10"
                    >
                        {/* Header */}
                        <div className="px-4 py-3.5 sm:px-6 sm:py-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/90 backdrop-blur-xl shrink-0">
                            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 mr-2">
                                <div className="hidden sm:flex w-10 h-10 sm:w-11 sm:h-11 bg-neutral-950 text-white rounded-xl items-center justify-center shrink-0 shadow-xs">
                                    <AppIcon icon={RiMailSendLine} size={20} />
                                </div>
                                <div className="min-w-0">
                                    <h2 id={`letter-title-${letter.id}`} className="text-base sm:text-lg font-bold text-neutral-950 truncate max-w-[180px] xs:max-w-[240px] sm:max-w-[340px] md:max-w-[420px]">{letter.title}</h2>
                                    <p className="text-xs font-medium text-neutral-600 hidden sm:block">AI-Tailored Professional Letter</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                <button 
                                    onClick={handleCopy}
                                    aria-label="Copy letter text"
                                    className="flex items-center justify-center min-h-9 sm:min-h-10 px-3 sm:px-4 py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-xl text-xs font-semibold transition-colors text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-950"
                                >
                                    {copied ? <AppIcon icon={RiCheckLine} size={16} className="sm:mr-1.5" /> : <AppIcon icon={RiFileCopyLine} size={16} className="sm:mr-1.5" />}
                                    <span className="hidden sm:inline">{copied ? "Copied!" : "Copy Text"}</span>
                                </button>
                                <button 
                                    onClick={downloadPDF}
                                    disabled={isExporting}
                                    aria-label="Download PDF"
                                    className="flex items-center justify-center min-h-9 sm:min-h-10 px-3 sm:px-4 py-2 bg-neutral-950 text-white rounded-xl text-xs font-semibold transition-colors hover:bg-neutral-800 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-950"
                                >
                                    {isExporting ? (
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin sm:mr-1.5"></span>
                                    ) : (
                                        <AppIcon icon={RiDownload2Line} size={16} className="sm:mr-1.5" />
                                    )}
                                    <span className="hidden sm:inline">Download PDF</span>
                                </button>
                                <button 
                                    onClick={handleClose} 
                                    aria-label="Close preview"
                                    className="w-10 h-10 flex items-center justify-center text-neutral-500 hover:text-neutral-950 hover:bg-neutral-200/60 rounded-xl transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-950 ml-1"
                                >
                                    <AppIcon icon={RiCloseLine} size={22} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-grow overflow-y-auto p-4 sm:p-6 md:p-8 bg-neutral-100/50">
                            <CoverLetterDocument
                                content={letter.content}
                                candidateName={letter.candidateName}                                className="p-6 sm:p-10 md:p-14 rounded-xl shadow-xs border border-neutral-200 max-w-[210mm] w-full mx-auto"
                            />
                        </div>

                        {/* Footer (Mobile Only) */}
                        <div className="md:hidden p-3.5 border-t border-neutral-200 bg-white flex gap-3 shrink-0">
                            <button 
                                onClick={handleClose}
                                aria-label="Close preview"
                                className="flex-grow bg-neutral-100 text-neutral-900 py-2.5 rounded-xl font-semibold text-xs transition-colors border border-neutral-200 hover:bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-950"
                            >
                                Close
                            </button>
                            <button 
                                onClick={downloadPDF}
                                disabled={isExporting}
                                aria-label="Download PDF"
                                className="flex-grow bg-neutral-950 text-white py-2.5 rounded-xl font-semibold text-xs transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-950"
                            >
                                {isExporting ? (
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                ) : (
                                    <>
                                        Download PDF
                                        <AppIcon icon={RiDownload2Line} size={16} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
