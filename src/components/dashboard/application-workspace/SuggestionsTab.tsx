"use client";

import React from "react";
import {
RiArrowRightLine,
RiMagicLine,
RiRefreshLine
} from "react-icons/ri";
import type { ApplicationData,WorkspaceTab } from "../ApplicationWorkspace";

interface Props {
    handleRunTailor: () => Promise<void>;
    isTailoring: boolean;
    app: ApplicationData;
    approvedSuggestionsCount: number;
    pendingSuggestionsCount: number;
    setShowSuggestionsModal: React.Dispatch<React.SetStateAction<boolean>>;
    setActiveTab: React.Dispatch<React.SetStateAction<WorkspaceTab>>;
}

export function SuggestionsTab({ handleRunTailor, isTailoring, app, approvedSuggestionsCount, pendingSuggestionsCount, setShowSuggestionsModal, setActiveTab }: Props) {
    return (
                <div className="space-y-6 bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                        <div>
                            <h2 className="text-lg font-extrabold flex items-center gap-2">
                                <RiMagicLine className="w-5 h-5 text-neutral-700" /> Section 5: AI Suggestions & Review
                            </h2>
                            <p className="text-xs text-neutral-500 mt-0.5">
                                Review, edit, approve, or reject section suggestions. Approved changes compile automatically into a tailored resume version.
                            </p>
                        </div>
                        <button
                            onClick={handleRunTailor}
                            disabled={isTailoring}
                            className="px-3.5 py-1.5 border border-neutral-300 text-xs font-bold rounded-xl hover:bg-neutral-100 inline-flex items-center gap-1.5"
                        >
                            <RiRefreshLine className="w-4 h-4" /> Re-analyze
                        </button>
                    </div>

                    {(!app.changes || app.changes.length === 0) ? (
                        <div className="text-center py-10 space-y-3">
                            <p className="text-xs text-neutral-600 font-semibold">No AI suggestions generated yet for this application.</p>
                            <button
                                onClick={handleRunTailor}
                                disabled={isTailoring}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0A0A0A] text-white text-xs font-bold rounded-xl hover:bg-neutral-800"
                            >
                                <RiMagicLine className="w-4 h-4" /> Run AI Analysis Now
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between bg-neutral-50 p-3.5 rounded-xl border border-neutral-200 text-xs font-bold">
                                <span>Total Suggestions: {app.changes.length}</span>
                                <span>Approved: {approvedSuggestionsCount}</span>
                                <span>Pending: {pendingSuggestionsCount}</span>
                            </div>

                            <button
                                onClick={() => setShowSuggestionsModal(true)}
                                className="w-full py-3 bg-[#0A0A0A] text-white text-xs font-extrabold rounded-xl hover:bg-neutral-800 transition-colors"
                            >
                                Review & Approve Suggestions Modal
                            </button>
                        </div>
                    )}

                    <div className="flex justify-between items-center border-t border-neutral-100 pt-4">
                        <button
                            onClick={() => setActiveTab("evidence")}
                            className="px-4 py-2 border border-neutral-300 text-neutral-700 text-xs font-bold rounded-xl hover:bg-neutral-100"
                        >
                            ← Back to Evidence
                        </button>
                        <button
                            onClick={() => setActiveTab("review")}
                            className="px-5 py-2.5 bg-[#0A0A0A] text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-colors inline-flex items-center gap-1"
                        >
                            Proceed to Final Review <RiArrowRightLine className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            );
}
