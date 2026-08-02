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
        if (isOpen && applicationId) {
            fetchChanges();
        }
    }, [isOpen, applicationId, fetchChanges]);

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

                                        {/* Original Text */}
                                        {item.originalText && (
                                            <div className="text-xs text-neutral-500 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Original</p>
                                                <p className="line-through">{item.originalText}</p>
                                            </div>
                                        )}

                                        {/* Suggested / Edited Text */}
                                        <div className="text-xs text-[#0A0A0A] bg-white p-3 rounded-xl border border-neutral-200/80 shadow-2xs space-y-2">
                                            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Suggested Improvement</p>
                                            {isEditing ? (
                                                <div className="space-y-2">
                                                    <textarea 
                                                        value={editText}
                                                        onChange={(e) => setEditText(e.target.value)}
                                                        className="w-full text-xs font-medium p-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
                                                        rows={3}
                                                    />
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => setEditingId(null)}
                                                            className="px-3 py-1 text-xs font-semibold text-neutral-500 hover:text-[#0A0A0A]"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => saveEdit(item.id)}
                                                            className="px-3 py-1 bg-[#0A0A0A] text-white text-xs font-bold rounded-md hover:bg-neutral-800"
                                                        >
                                                            Save &amp; Apply
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="font-semibold leading-relaxed">
                                                    {item.userEdits || item.suggestedText}
                                                    {item.userEdits && <span className="ml-2 text-[10px] text-indigo-600 font-bold">(Edited by you)</span>}
                                                </p>
                                            )}
                                        </div>

                                        {/* Action Buttons: Apply, Edit, Reject, Undo */}
                                        <div className="flex items-center justify-end gap-2 pt-1">
                                            {item.status !== "pending" ? (
                                                <button
                                                    onClick={() => handleUpdateStatus(item.id, "pending")}
                                                    disabled={isUpdating}
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-neutral-500 hover:text-[#0A0A0A] px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 transition-colors"
                                                >
                                                    <RiHistoryLine size={14} />
                                                    Undo
                                                </button>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleUpdateStatus(item.id, "rejected")}
                                                        disabled={isUpdating}
                                                        className="inline-flex items-center gap-1 text-xs font-bold text-neutral-500 hover:text-red-600 px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-red-50 transition-colors"
                                                    >
                                                        <RiCloseCircleLine size={14} />
                                                        Reject
                                                    </button>
                                                    <button
                                                        onClick={() => startEditing(item)}
                                                        disabled={isUpdating}
                                                        className="inline-flex items-center gap-1 text-xs font-bold text-neutral-700 hover:text-[#0A0A0A] px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 transition-colors"
                                                    >
                                                        <RiEdit2Line size={14} />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(item.id, "approved")}
                                                        disabled={isUpdating}
                                                        className="inline-flex items-center gap-1 text-xs font-bold bg-[#0A0A0A] text-white px-4 py-1.5 rounded-lg hover:bg-neutral-800 transition-all shadow-xs"
                                                    >
                                                        <RiCheckLine size={14} />
                                                        Apply
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
