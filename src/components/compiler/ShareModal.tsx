"use client";

import React, { useState, useEffect, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { RiCloseLine, RiFileCopyLine, RiCheckboxCircleFill, RiLoader4Line, RiShareLine, RiLinkM, RiDeleteBinLine } from "react-icons/ri";
import QRCode from "qrcode";
import { useToast } from "@/components/ui/Toast";

interface ShareModalProps {
    isOpen: boolean;
    onCloseAction: () => void;
    resumeId: string;
    resumeTitle: string;
}

export function ShareModal({ isOpen, onCloseAction, resumeId, resumeTitle }: ShareModalProps) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [isPublic, setIsPublic] = useState(false);
    const [copied, setCopied] = useState(false);
    const [revoking, setRevoking] = useState(false);
    const [toggling, setToggling] = useState(false);

    const fetchShareStatus = useCallback(async () => {
        try {
            const res = await fetch(`/api/resumes/${resumeId}/share`);
            const data = await res.json();
            if (data.shared && data.shareUrl) {
                setShareUrl(data.shareUrl);
                setIsPublic(data.isPublic);
                if (data.isPublic) generateQR(data.shareUrl);
            }
        } catch {}
    }, [resumeId]);

    // Fetch existing share status on open
    useEffect(() => {
        if (!isOpen || resumeId === "new") return;
        fetchShareStatus();
    }, [isOpen, resumeId, fetchShareStatus]);

    const generateShareLink = async () => {
        if (resumeId === "new") return;
        setLoading(true);
        try {
            const res = await fetch(`/api/resumes/${resumeId}/share`, { 
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isPublic: true })
            });
            const data = await res.json();
            if (data.shareUrl) {
                setShareUrl(data.shareUrl);
                setIsPublic(true);
                generateQR(data.shareUrl);
                showToast("Link generated!", "success");
            }
        } catch (err) {
            console.error("Failed to generate share link:", err);
            showToast("Failed to generate link", "error");
        } finally {
            setLoading(false);
        }
    };

    const toggleVisibility = async () => {
        setToggling(true);
        try {
            const nextStatus = !isPublic;
            const res = await fetch(`/api/resumes/${resumeId}/share`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isPublic: nextStatus })
            });
            const data = await res.json();
            setIsPublic(data.isPublic);
            if (data.isPublic) generateQR(data.shareUrl);
            showToast(data.isPublic ? "Visibility set to Public" : "Visibility set to Private", "success");
        } catch (err) {
            console.error("Toggle failed:", err);
            showToast("Failed to update visibility", "error");
        } finally {
            setToggling(false);
        }
    };

    const revokeShareLink = async () => {
        setRevoking(true);
        try {
            await fetch(`/api/resumes/${resumeId}/share`, { method: "DELETE" });
            setShareUrl(null);
            setIsPublic(false);
            setQrDataUrl(null);
            showToast("Share link revoked", "success");
        } catch (err) {
            console.error("Failed to revoke:", err);
            showToast("Failed to revoke link", "error");
        } finally {
            setRevoking(false);
        }
    };

    const generateQR = async (url: string) => {
        try {
            const dataUrl = await QRCode.toDataURL(url, {
                width: 200,
                margin: 2,
                color: { dark: "#0A0A0A", light: "#FFFFFF" },
                errorCorrectionLevel: "M",
            });
            setQrDataUrl(dataUrl);
        } catch { }
    };

    const copyLink = async () => {
        if (!shareUrl) return;
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCloseAction} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                <m.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.95, y: 10 }} 
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="h-12 border-b border-black/6 flex items-center justify-between px-5">
                        <div className="flex items-center gap-2">
                            <RiShareLine size={14} className="text-[#3B82F6]" />
                            <span className="text-sm font-semibold text-[#0A0A0A]">Share Resume</span>
                        </div>
                        <button onClick={onCloseAction} className="w-7 h-7 rounded-md flex items-center justify-center text-[#737373] hover:bg-[#F5F5F5] transition-all">
                            <RiCloseLine size={16} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-5 space-y-5">
                        {resumeId === "new" ? (
                            <div className="text-center py-6">
                                <p className="text-sm text-[#737373]">Save your resume first before sharing.</p>
                            </div>
                        ) : !shareUrl ? (
                            /* No link yet — generate */
                            <div className="text-center space-y-4 py-4">
                                <div className="w-14 h-14 bg-[#3B82F6]/10 rounded-full flex items-center justify-center mx-auto">
                                    <RiLinkM size={24} className="text-[#3B82F6]" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-[#0A0A0A]">Create a shareable link</p>
                                    <p className="text-xs text-[#737373] mt-1">Anyone with the link can view your resume as a clean, formatted page.</p>
                                </div>
                                <button 
                                    onClick={generateShareLink} 
                                    disabled={loading}
                                    className="mx-auto h-9 px-6 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
                                >
                                    {loading ? <RiLoader4Line size={14} className="animate-spin" /> : <RiLinkM size={14} />}
                                    {loading ? "Generating..." : "Generate Link"}
                                </button>
                            </div>
                        ) : (
                            /* Link exists — show URL + QR */
                            <div className="space-y-5">
                                {/* QR Code */}
                                {isPublic && qrDataUrl && (
                                    <m.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3">
                                        <div className="p-3 bg-white border-2 border-black/8 rounded-xl shadow-sm">
                                            <Image src={qrDataUrl} alt="QR Code" width={140} height={140} className="rounded" />
                                        </div>
                                        <p className="text-[10px] text-[#737373] font-medium">Scan to view resume</p>
                                    </m.div>
                                )}

                                {!isPublic && (
                                    <div className="py-6 bg-[#FAFAFA] border border-dashed border-black/10 rounded-xl flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-500"><RiShareLine size={16} /></div>
                                        <p className="text-[10px] font-semibold text-[#737373] uppercase tracking-wide">Sharing is Paused</p>
                                        <p className="text-[11px] text-[#A3A3A3] text-center px-8">Your resume is not visible via the link right now.</p>
                                    </div>
                                )}

                                {/* Visibility Toggle */}
                                <div className="p-3 bg-white border border-black/6 rounded-xl flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <p className="text-[11px] font-bold text-[#0A0A0A]">Public Visibility</p>
                                        <p className="text-[10px] text-[#737373]">{isPublic ? "Visible to anyone with the link" : "Only visible to you"}</p>
                                    </div>
                                    <button 
                                        onClick={toggleVisibility}
                                        disabled={toggling}
                                        className={`w-9 h-5 rounded-full relative transition-all ${isPublic ? "bg-[#3B82F6]" : "bg-black/15"} ${toggling ? "opacity-50" : ""}`}
                                    >
                                        <m.div 
                                            animate={{ x: isPublic ? 18 : 2 }} 
                                            className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
                                        />
                                    </button>
                                </div>

                                {/* Link */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-semibold text-[#737373] tracking-wide uppercase">Share Link</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            readOnly 
                                            value={shareUrl} 
                                            className="flex-grow h-9 bg-[#F5F5F5] rounded-lg px-3 text-xs text-[#0A0A0A] font-mono border border-[#E5E5E5] outline-none truncate"
                                        />
                                        <button 
                                            onClick={copyLink}
                                            className={`h-9 px-4 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${copied ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-[#0A0A0A] text-white hover:bg-[#333]"}`}
                                        >
                                            {copied ? <><RiCheckboxCircleFill size={12} /> Copied!</> : <><RiFileCopyLine size={12} /> Copy</>}
                                        </button>
                                    </div>
                                </div>

                                {/* Title */}
                                <p className="text-[10px] text-[#737373] text-center">
                                    Sharing: <span className="font-semibold text-[#0A0A0A]">{resumeTitle}</span>
                                </p>

                                {/* Revoke */}
                                <div className="pt-3 border-t border-black/6">
                                    <button 
                                        onClick={revokeShareLink}
                                        disabled={revoking}
                                        className="w-full h-8 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                                    >
                                        <RiDeleteBinLine size={11} />
                                        {revoking ? "Revoking..." : "Revoke Share Link"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </m.div>
            </m.div>
        </AnimatePresence>
    );
}
