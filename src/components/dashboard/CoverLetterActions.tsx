"use client";
import React, { useState } from "react";
import { Trash, DirectRight, CloseCircle, TickCircle, Copy, DocumentText } from "iconsax-react";
import { useRouter } from "next/navigation";

type CoverLetter = {
    id: string;
    title: string;
    content: string;
    createdAt: Date;
};

export function CoverLetterActions({ letter }: { letter: CoverLetter }) {
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
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
        } catch (err) {
            alert("Network error.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <div className="flex items-center gap-3 pt-6 border-t border-[#F5F5F5]">
                <button 
                    onClick={() => setIsViewOpen(true)}
                    className="flex-grow h-12 bg-[#0A0A0A] text-white rounded-xl text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    View Letter
                    <DirectRight size={14} />
                </button>
                <button 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-12 h-12 border border-[#EAEAEA] rounded-xl flex items-center justify-center text-red-400 hover:bg-red-50 hover:border-red-100 transition-all disabled:opacity-50"
                >
                    {isDeleting ? (
                        <span className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin"></span>
                    ) : (
                        <Trash size={18} />
                    )}
                </button>
            </div>

            {isViewOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 sm:p-10">
                    <div className="absolute inset-0 bg-[#0A0A0A]/40 backdrop-blur-sm" onClick={() => setIsViewOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl border border-[#EAEAEA] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-8 border-b border-[#F5F5F5] flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-[#0A0A0A]/5 rounded-2xl flex items-center justify-center">
                                    <DocumentText size={24} variant="Bold" />
                                </div>
                                <h2 className="text-xl font-bold text-[#0A0A0A] truncate max-w-[300px]">{letter.title}</h2>
                            </div>
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={handleCopy}
                                    className="flex items-center gap-2 bg-[#F9F9F9] border border-[#EAEAEA] hover:border-[#3B82F6] px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
                                >
                                    {copied ? (
                                        <>
                                            <TickCircle size={16} variant="Bold" className="text-green-500" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={16} />
                                            Copy Text
                                        </>
                                    )}
                                </button>
                                <button onClick={() => setIsViewOpen(false)} className="text-[#B5B5B5] hover:text-[#0A0A0A] transition-colors">
                                    <CloseCircle size={28} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-grow overflow-y-auto p-12 custom-scrollbar bg-[#FDFDFD]">
                            <div className="bg-white p-12 rounded-xl shadow-sm border border-[#F5F5F5] font-serif text-[1.1rem] leading-[1.8] text-[#1A1A1A] max-w-2xl mx-auto whitespace-pre-wrap">
                                {letter.content}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-8 border-t border-[#F5F5F5] flex items-center justify-end bg-white">
                            <button 
                                onClick={() => setIsViewOpen(false)}
                                className="bg-[#0A0A0A] text-white px-8 py-3 rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                Close View
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
