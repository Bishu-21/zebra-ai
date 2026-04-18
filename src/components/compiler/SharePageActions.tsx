"use client";

import React, { useState } from "react";
import { 
    RiFileDownloadLine, RiBallPenLine, RiLink, 
    RiCheckboxCircleLine, RiLoader4Line 
} from "react-icons/ri";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import type { ResumeContent } from "./types";

interface SharePageActionsProps {
    token: string;
    resumeTitle: string;
    resumeData: ResumeContent;
}

export function SharePageActions({ token, resumeTitle, resumeData }: SharePageActionsProps) {
    const [isDownloading, setIsDownloading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const { showToast } = useToast();

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const res = await fetch("/api/export/pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resumeData, template: "modern" }),
            });

            if (!res.ok) throw new Error("Export failed");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${resumeTitle.toLowerCase().replace(/\s+/g, "-")}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            showToast("PDF Downloaded!", "success");
        } catch {
            showToast("Failed to generate PDF", "error");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setIsCopied(true);
        showToast("Link copied to clipboard", "success");
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="flex items-center gap-2">
            {/* Copy Link */}
            <button 
                onClick={handleCopyLink}
                className="h-8 px-3 flex items-center gap-1.5 text-[11px] font-semibold text-[#737373] hover:bg-black/5 rounded-md transition-all"
            >
                {isCopied ? <RiCheckboxCircleLine className="text-emerald-500" size={14} /> : <RiLink size={14} />}
                {isCopied ? "Copied" : "Copy Link"}
            </button>

            {/* Download PDF */}
            <button 
                onClick={handleDownload}
                disabled={isDownloading}
                className="h-8 px-4 bg-[#0A0A0A] text-white text-[11px] font-bold rounded-md hover:bg-black/80 transition-all flex items-center gap-2 disabled:opacity-50"
            >
                {isDownloading ? <RiLoader4Line className="animate-spin" size={14} /> : <RiFileDownloadLine size={14} />}
                {isDownloading ? "Generating..." : "Download PDF"}
            </button>

            <div className="w-px h-4 bg-black/10 mx-1" />

            {/* Build Yours */}
            <Link 
                href={`/register?import=${token}`}
                className="h-8 px-4 bg-[#3B82F6] text-white text-[11px] font-bold rounded-md hover:bg-[#2563EB] transition-all flex items-center gap-2"
            >
                <RiBallPenLine size={14} />
                Edit this Resume
            </Link>
        </div>
    );
}
