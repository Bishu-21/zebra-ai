"use client";
import React, { useCallback, useState } from "react";
import {
    RiDeleteBinLine,
    RiCloseLine,
    RiCheckLine,
    RiFileCopyLine,
    RiDownload2Line,
    RiArticleLine,
    RiLoader4Line,
    RiEyeLine,
} from "react-icons/ri";
import { useRouter } from "next/navigation";
import { sanitizeHtml } from "@/lib/utils";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import { AppIcon } from "@/components/ui/AppIcon";
import { featureChrome } from "@/components/dashboard/feature-chrome";

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
        return content.split("\n").map((line, i) => {
            if (!line.trim()) return <div key={i} className="h-4" />;

            if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
                const text = line.trim().substring(2);
                const formatted = text
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                    .replace(/\*(.*?)\*/g, "<strong>$1</strong>");
                return (
                    <li key={i} className="mb-2 ml-6 list-disc" dangerouslySetInnerHTML={{ __html: sanitizeHtml(formatted) }} />
                );
            }

            const formatted = line
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                .replace(/\*(.*?)\*/g, "<strong>$1</strong>");

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
            <div className="mt-4 flex items-center gap-2 border-t border-neutral-200/70 pt-3">
                <button
                    onClick={() => setIsViewOpen(true)}
                    aria-label="Preview cover letter"
                    className={`${featureChrome.primaryButton} flex-1`}
                >
                    <AppIcon icon={RiEyeLine} size={16} />
                    View letter
                </button>
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    aria-label="Delete cover letter"
                    className={featureChrome.iconButton}
                >
                    {isDeleting ? (
                        <AppIcon icon={RiLoader4Line} size={16} className="animate-spin" />
                    ) : (
                        <AppIcon icon={RiDeleteBinLine} size={16} />
                    )}
                </button>
            </div>

            {isViewOpen && (
                <div className="fixed inset-0 z-[110] flex items-end justify-center overflow-y-auto p-3 sm:items-center sm:p-4">
                    <div aria-hidden="true" className={featureChrome.backdrop} onClick={handleClose} />
                    <div
                        ref={dialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={`letter-title-${letter.id}`}
                        className={`${featureChrome.dialog} max-w-3xl`}
                    >
                        <div className={featureChrome.dialogHeader}>
                            <div className="flex min-w-0 items-center gap-2.5">
                                <AppIcon icon={RiArticleLine} size={18} className="text-muted-foreground" />
                                <h2 id={`letter-title-${letter.id}`} className="truncate font-sans text-sm font-semibold tracking-tight text-foreground">
                                    {letter.title}
                                </h2>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                                <div className="hidden items-center gap-1 sm:flex">
                                    <button onClick={handleCopy} aria-label="Copy letter text" className={featureChrome.secondaryButton}>
                                        {copied ? <AppIcon icon={RiCheckLine} size={16} /> : <AppIcon icon={RiFileCopyLine} size={16} />}
                                        {copied ? "Copied" : "Copy text"}
                                    </button>
                                    <button onClick={downloadPDF} disabled={isExporting} aria-label="Download PDF" className={featureChrome.primaryButton}>
                                        {isExporting ? <AppIcon icon={RiLoader4Line} size={16} className="animate-spin" /> : <AppIcon icon={RiDownload2Line} size={16} />}
                                        Download PDF
                                    </button>
                                </div>
                                <button onClick={handleClose} aria-label="Close preview" className={featureChrome.iconButton}>
                                    <AppIcon icon={RiCloseLine} size={18} />
                                </button>
                            </div>
                        </div>

                        <div className={`${featureChrome.dialogBody} bg-muted/40`}>
                            <div
                                id={`letter-content-${letter.id}`}
                                className="mx-auto min-h-[297mm] max-w-[210mm] rounded-xl border border-neutral-200/70 bg-white p-8 font-serif text-[0.95rem] leading-[1.8] text-[#1A1A1A] sm:p-12"
                            >
                                {renderFormattedContent(letter.content)}
                            </div>
                        </div>

                        <div className={`${featureChrome.dialogFooter} sm:hidden`}>
                            <button onClick={handleClose} aria-label="Close preview" className={featureChrome.ghostButton}>
                                Close
                            </button>
                            <div className="flex gap-2">
                                <button onClick={handleCopy} aria-label="Copy letter text" className={featureChrome.secondaryButton}>
                                    {copied ? <AppIcon icon={RiCheckLine} size={16} /> : <AppIcon icon={RiFileCopyLine} size={16} />}
                                    {copied ? "Copied" : "Copy"}
                                </button>
                                <button onClick={downloadPDF} disabled={isExporting} aria-label="Download PDF" className={featureChrome.primaryButton}>
                                    {isExporting ? (
                                        <AppIcon icon={RiLoader4Line} size={16} className="animate-spin" />
                                    ) : (
                                        <>
                                            <AppIcon icon={RiDownload2Line} size={16} />
                                            Download PDF
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
