"use client";
import React, { useState } from "react";
import { 
    RiDeleteBin6Line, 
    RiArrowRightSLine, 
    RiCloseCircleLine, 
    RiCheckboxCircleLine, 
    RiFileCopyLine, 
    RiDownload2Line, 
    RiMailSendLine
} from "react-icons/ri";
import { useRouter } from "next/navigation";
import { sanitizeHtml } from "@/lib/utils";

type CoverLetter = {
    id: string;
    title: string;
    content: string;
    createdAt: Date;
};

export function CoverLetterActions({ letter }: { letter: CoverLetter }) {
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [copied, setCopied] = useState(false);
    const router = useRouter();

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
                    title: letter.title
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

    const renderFormattedContent = (content: string) => {
        return content.split('\n').map((line, i) => {
            if (!line.trim()) return <div key={i} className="h-4" />;
            
            // Handle bullet points
            if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
                const text = line.trim().substring(2);
                const formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                     .replace(/\*(.*?)\*/g, '<strong>$1</strong>');
                return (
                    <li key={i} className="ml-6 list-disc mb-2" dangerouslySetInnerHTML={{ __html: sanitizeHtml(formatted) }} />
                );
            }

            // Handle bold/italics
            const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                 .replace(/\*(.*?)\*/g, '<strong>$1</strong>');
            
            return (
                <p 
                    key={i} 
                    className="mb-4 text-justify"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(formatted) }}
                />
            );
        });
    };

    return (
        <>
            <div className="flex items-center gap-3 pt-6 border-t border-[#F5F5F5]">
                <button 
                    onClick={() => setIsViewOpen(true)}
                    className="flex-grow h-12 bg-[#0A0A0A] text-white rounded-xl text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    View Letter
                    <RiArrowRightSLine size={14} />
                </button>
                <button 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-12 h-12 border border-[#EAEAEA] rounded-xl flex items-center justify-center text-red-400 hover:bg-red-50 hover:border-red-100 transition-all disabled:opacity-50"
                >
                    {isDeleting ? (
                        <span className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin"></span>
                    ) : (
                        <RiDeleteBin6Line size={18} />
                    )}
                </button>
            </div>

            {isViewOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 md:p-10">
                    <div className="absolute inset-0 bg-[#0A0A0A]/60 backdrop-blur-md" onClick={() => setIsViewOpen(false)}></div>
                    <div className="relative bg-white w-full h-full md:h-auto md:max-w-4xl md:max-h-[92vh] md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        
                        {/* Header */}
                        <div className="px-6 py-5 md:p-8 border-b border-[#F5F5F5] flex items-center justify-between bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className="hidden sm:flex w-12 h-12 bg-[#3B82F6]/5 text-[#3B82F6] rounded-2xl items-center justify-center">
                                    <RiMailSendLine size={24} />
                                </div>
                                <div>
                                    <h2 className="text-lg md:text-xl font-black text-[#0A0A0A] truncate max-w-[200px] md:max-w-[400px]">{letter.title}</h2>
                                    <p className="text-[0.7rem] font-bold text-[#B5B5B5] uppercase tracking-wider hidden sm:block">AI-Tailored Professional Letter</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 md:gap-4">
                                <button 
                                    onClick={handleCopy}
                                    className="flex items-center justify-center w-10 h-10 md:w-auto md:px-5 md:py-2.5 bg-[#F9F9F9] border border-[#EAEAEA] hover:border-[#3B82F6] rounded-xl text-xs font-bold transition-all text-[#0A0A0A]"
                                    title="Copy Text"
                                >
                                    {copied ? <RiCheckboxCircleLine size={20} className="text-green-500" /> : <RiFileCopyLine size={20} className="md:size-4 md:mr-2" />}
                                    <span className="hidden md:inline">{copied ? "Copied!" : "Copy Text"}</span>
                                </button>
                                <button 
                                    onClick={downloadPDF}
                                    disabled={isExporting}
                                    className="flex items-center justify-center w-10 h-10 md:w-auto md:px-5 md:py-2.5 bg-[#3B82F6] text-white rounded-xl text-xs font-bold transition-all hover:bg-[#2563EB] disabled:opacity-50"
                                    title="Download PDF"
                                >
                                    {isExporting ? (
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    ) : (
                                        <RiDownload2Line size={20} className="md:size-4 md:mr-2" />
                                    )}
                                    <span className="hidden md:inline">Download PDF</span>
                                </button>
                                <button onClick={() => setIsViewOpen(false)} className="text-[#B5B5B5] hover:text-[#0A0A0A] transition-colors ml-2">
                                    <RiCloseCircleLine size={28} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-grow overflow-y-auto p-4 md:p-12 custom-scrollbar bg-[#F5F5F7]">
                            <div 
                                id={`letter-content-${letter.id}`}
                                className="bg-white p-8 md:p-16 rounded-[1rem] md:rounded-[1.5rem] shadow-sm border border-[#EAEAEA] font-serif text-[0.95rem] md:text-[1.1rem] leading-[1.8] text-[#1A1A1A] max-w-[210mm] mx-auto min-h-[297mm] flex flex-col"
                            >
                                <div className="flex-grow">
                                    {renderFormattedContent(letter.content)}
                                </div>
                                <div className="mt-12 pt-8 border-t border-[#F5F5F5] text-[0.7rem] text-[#B5B5B5] text-center font-sans uppercase tracking-[0.2em] print:hidden">
                                    Generated by Zebra AI • High Conversion Technology
                                </div>
                            </div>
                        </div>

                        {/* Footer (Mobile Only) */}
                        <div className="md:hidden p-6 border-t border-[#F5F5F5] bg-white flex gap-4">
                            <button 
                                onClick={() => setIsViewOpen(false)}
                                className="flex-grow bg-[#F9F9F9] text-[#0A0A0A] py-4 rounded-2xl font-black text-sm transition-all border border-[#EAEAEA]"
                            >
                                Close
                            </button>
                            <button 
                                onClick={downloadPDF}
                                disabled={isExporting}
                                className="flex-grow bg-[#3B82F6] text-white py-4 rounded-2xl font-black text-sm transition-all shadow-lg shadow-[#3B82F6]/20 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isExporting ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                ) : (
                                    <>
                                        Download PDF
                                        <RiDownload2Line size={18} />
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
