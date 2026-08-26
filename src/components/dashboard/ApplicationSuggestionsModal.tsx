"use client";

import React, { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
    RiCloseLine,
    RiCheckLine,
    RiCloseCircleLine,
    RiEdit2Line,
    RiHistoryLine,
    RiMagicLine,
    RiLoader4Line
} from "react-icons/ri";
import { useToast } from "@/components/ui/Toast";

export interface ApplicationChangeItem {
    id: string;
    applicationId: string;
    section: string;
    changeType: string;
    originalText?: string | null;
    suggestedText: string;
    userEdits?: string | null;
    status: "pending" | "approved" | "rejected";
    createdAt: string;
}

interface ApplicationSuggestionsModalProps {
    applicationId: string;
    company: string;
    position: string;
    isOpen: boolean;
    onCloseAction: () => void;
    onStatusChangeAction?: () => void;
}

export function ApplicationSuggestionsModal({
    applicationId,
    company,
    position,
    isOpen,
    onCloseAction,
    onStatusChangeAction
}: ApplicationSuggestionsModalProps) {
    const [changes, setChanges] = useState<ApplicationChangeItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState("");
    const { showToast } = useToast();

    const fetchChanges = React.useCallback(async () => {
        if (!applicationId) return;
        try {
            setLoading(true);
            const res = await fetch(`/api/applications/changes?applicationId=${applicationId}`);
            const data = await res.json();
            if (res.ok) {
                setChanges(data.changes || []);
            } else {
                showToast(data.error || "Failed to load suggestions", "error");
            }
        } catch (err) {
            console.error("Fetch changes error:", err);
            showToast("Error loading suggestions", "error");
        } finally {
            setLoading(false);
        }
    }, [applicationId, showToast]);

    useEffect(() => {
        let cancelled = false;
        if (isOpen && applicationId) {
            queueMicrotask(() => { if (!cancelled) void fetchChanges(); });
        }
        return () => { cancelled = true; };
    }, [isOpen, applicationId, fetchChanges]);

    useEffect(() => {
        if (!isOpen) return;
        document.body.style.overflow = "hidden";
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onCloseAction();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onCloseAction]);

    const handleUpdateStatus = async (id: string, newStatus: "approved" | "rejected" | "pending", userEdits?: string) => {
        try {
            setUpdatingId(id);
            const res = await fetch("/api/applications/changes", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id,
                    status: newStatus,
                    userEdits: userEdits !== undefined ? userEdits : null
                }),
            });
            const data = await res.json();
            if (res.ok) {
                showToast(
                    newStatus === "approved" ? "Change applied!" : newStatus === "rejected" ? "Change rejected" : "Change reset to pending",
                    "success"
                );
                setChanges(prev => prev.map(item => item.id === id ? { ...item, status: newStatus, userEdits: userEdits ?? item.userEdits } : item));
                setEditingId(null);
                if (onStatusChangeAction) onStatusChangeAction();
            } else {
                showToast(data.error || "Failed to update suggestion", "error");
            }
        } catch {
            showToast("Error updating suggestion", "error");
        } finally {
            setUpdatingId(null);
        }
    };


    const startEditing = (item: ApplicationChangeItem) => {
        setEditingId(item.id);
        setEditText(item.userEdits || item.suggestedText);
    };

    const saveEdit = (id: string) => {
        handleUpdateStatus(id, "approved", editText);
    };

    if (!isOpen) return null;

    const pendingCount = changes.filter(c => c.status === "pending").length;
    const approvedCount = changes.filter(c => c.status === "approved").length;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
                <m.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[85vh]"
                >
                    {/* Modal Header */}
                    <div className="p-6 border-b border-neutral-200/80 flex items-center justify-between bg-[#FAF9F6] shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#0A0A0A] text-white flex items-center justify-center shadow-xs">
                                <RiMagicLine size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-[#0A0A0A]">Review AI Suggestions</h2>
                                <p className="text-xs text-neutral-500 font-medium">
                                    {position} @ {company} — {pendingCount} pending, {approvedCount} applied
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onCloseAction}
                            className="w-8 h-8 rounded-lg bg-neutral-200/60 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 hover:text-[#0A0A0A] transition-colors"
                        >
                            <RiCloseLine size={20} />
                        </button>
                    </div>

                    {/* Content List */}
                    <div className="p-6 overflow-y-auto space-y-4 flex-grow">
                        {loading ? (
                            <div className="py-16 text-center text-neutral-400 text-sm font-medium flex items-center justify-center gap-2">
                                <RiLoader4Line className="animate-spin" size={20} />
                                Loading suggestions...
                            </div>
                        ) : changes.length === 0 ? (
                            <div className="py-16 text-center text-neutral-500 text-xs font-medium space-y-2">
                                <p className="text-sm font-bold text-[#0A0A0A]">No suggestions generated yet</p>
                                <p className="max-w-md mx-auto text-neutral-400">
                                    Run AI tailoring on this application to receive line-by-line recommendations.
                                </p>
                            </div>
                        ) : (
                            changes.map((item) => {
                                const isUpdating = updatingId === item.id;
                                const isEditing = editingId === item.id;

                                return (
                                    <div
                                        key={item.id}
                                        className={`p-4 rounded-2xl border transition-all space-y-3 ${
                                            item.status === "approved"
                                                ? "bg-emerald-50/50 border-emerald-200"
                                                : item.status === "rejected"
                                                ? "bg-neutral-50 border-neutral-200 opacity-60"
                                                : "bg-white border-neutral-200 shadow-xs"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2.5 py-1 rounded-md bg-neutral-100 text-[#0A0A0A] text-[10px] font-bold uppercase tracking-wider">
                                                    {item.section}
                                                </span>
                                                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                                                    {item.changeType}
                                                </span>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                item.status === "approved"
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : item.status === "rejected"
                                                    ? "bg-neutral-200 text-neutral-600"
                                                    : "bg-amber-100 text-amber-700"
                                            }`}>
                                                {item.status.toUpperCase()}
                                            </span>
                                        </div>

                                        {/* 4-Stage Section-Level Diff Lifecycle */}
                                        <div className="space-y-3 pt-1">
                                            {/* Stage 1: Original */}
                                            <div className="text-xs bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-slate-300">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span> 1. Original (Master Profile)
                                                    </span>
                                                </div>
                                                <p className="font-mono text-[11px] leading-relaxed text-slate-400 bg-black/40 p-2 rounded border border-slate-800">
                                                    {item.originalText || "No original text (New section addition)"}
                                                </p>
                                            </div>

                                            {/* Stage 2: AI Evidence-Grounded Suggestion */}
                                            <div className="text-xs bg-emerald-950/30 p-3 rounded-xl border border-emerald-800/60 text-emerald-100">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                                                        <RiMagicLine className="text-emerald-400" /> 2. AI Evidence-Grounded Suggestion
                                                    </span>
                                                    <span className="text-[10px] bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded font-mono">
                                                        Evidence Lineage Grounded
                                                    </span>
                                                </div>
                                                <p className="font-mono text-[11px] leading-relaxed text-emerald-200 bg-black/40 p-2 rounded border border-emerald-900">
                                                    {item.suggestedText}
                                                </p>
                                            </div>

                                            {/* Stage 3: Candidate Edit */}
                                            <div className="text-xs bg-slate-900 p-3 rounded-xl border border-slate-800 text-slate-200 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                                                        <RiEdit2Line className="text-blue-400" /> 3. Candidate Manual Edit (Optional)
                                                    </span>
                                                    {!isEditing && (
                                                        <button
                                                            onClick={() => startEditing(item)}
                                                            className="text-[10px] text-blue-400 hover:underline font-bold flex items-center gap-1"
                                                        >
                                                            <RiEdit2Line size={12} /> {item.userEdits ? "Edit your custom version" : "Customize suggestion"}
                                                        </button>
                                                    )}
                                                </div>

                                                {isEditing ? (
                                                    <div className="space-y-2 pt-1">
                                                        <textarea
                                                            value={editText}
                                                            onChange={(e) => setEditText(e.target.value)}
                                                            className="w-full text-xs font-mono p-2.5 bg-black border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                            rows={3}
                                                            placeholder="Type candidate custom edit here..."
                                                        />
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => setEditingId(null)}
                                                                className="px-3 py-1 text-xs font-semibold text-slate-400 hover:text-white"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                onClick={() => saveEdit(item.id)}
                                                                className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-md hover:bg-emerald-500 flex items-center gap-1"
                                                            >
                                                                <RiCheckLine /> Save &amp; Approve
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="font-mono text-[11px] leading-relaxed text-slate-300 bg-black/40 p-2 rounded border border-slate-800">
                                                        {item.userEdits ? item.userEdits : "(No custom candidate edit applied. Using AI suggestion directly.)"}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Stage 4: Approved Version Status */}
                                            {item.status === "approved" && (
                                                <div className="text-xs bg-emerald-950/60 p-3 rounded-xl border border-emerald-700 text-emerald-100 flex items-center justify-between">
                                                    <div>
                                                        <span className="text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                                                            <RiCheckLine className="text-emerald-400" /> 4. Candidate Approved Version
                                                        </span>
                                                        <p className="font-mono text-[11px] font-bold text-white mt-1">
                                                            {item.userEdits || item.suggestedText}
                                                        </p>
                                                    </div>
                                                    <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-2.5 py-1 rounded-md uppercase">
                                                        APPROVED &amp; APPLIED
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Buttons: Approve, Edit, Reject, Reset */}
                                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                                            {item.status !== "pending" ? (
                                                <button
                                                    onClick={() => handleUpdateStatus(item.id, "pending")}
                                                    disabled={isUpdating}
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors"
                                                >
                                                    <RiHistoryLine size={14} />
                                                    Reset to Pending
                                                </button>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleUpdateStatus(item.id, "rejected")}
                                                        disabled={isUpdating}
                                                        className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-lg border border-rose-900/50 hover:bg-rose-950/40 transition-colors"
                                                    >
                                                        <RiCloseCircleLine size={14} />
                                                        Reject
                                                    </button>
                                                    <button
                                                        onClick={() => startEditing(item)}
                                                        disabled={isUpdating}
                                                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-lg border border-blue-900/50 hover:bg-blue-950/40 transition-colors"
                                                    >
                                                        <RiEdit2Line size={14} />
                                                        Custom Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(item.id, "approved")}
                                                        disabled={isUpdating}
                                                        className="inline-flex items-center gap-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-4 py-1.5 rounded-lg transition-colors shadow-xs"
                                                    >
                                                        <RiCheckLine size={14} />
                                                        Approve
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-neutral-200 bg-[#FAF9F6] flex justify-end shrink-0">
                        <button
                            onClick={onCloseAction}
                            className="bg-[#0A0A0A] text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-neutral-800 transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </m.div>
            </div>
        </AnimatePresence>
    );
}
