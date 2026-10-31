"use client";

import { RequirementEvidenceMatrixView } from "@/components/compiler/RequirementEvidenceMatrixView";
import React from "react";
import {
RiAlertLine,
RiMagicLine,
RiSearchLine
} from "react-icons/ri";
import type { ApplicationData,WorkspaceTab } from "../ApplicationWorkspace";

interface Props {
    jobDescription: string;
    setActiveTab: React.Dispatch<React.SetStateAction<WorkspaceTab>>;
    app: ApplicationData;
    showToast: (message: string, type?: "success" | "info" | "error") => void;
    handleRunTailor: () => Promise<void>;
    isTailoring: boolean;
}

export function EvidenceTab({ jobDescription, setActiveTab, app, showToast, handleRunTailor, isTailoring }: Props) {
    return (
                <div className="space-y-6 bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
                    <div className="border-b border-neutral-100 pb-3">
                        <h2 className="text-lg font-extrabold flex items-center gap-2">
                            <RiSearchLine className="w-5 h-5 text-neutral-700" /> Section 4: Missing Evidence & Improvement Areas
                        </h2>
                        <p className="text-xs text-neutral-500 mt-1">
                            Analyzes requirements in the job description against your attached work and master resume.
                        </p>
                    </div>

                    {!jobDescription.trim() ? (
                        <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-3">
                            <RiAlertLine className="w-8 h-8 text-amber-600 mx-auto" />
                            <h3 className="font-extrabold text-sm text-amber-900">Job Description Required</h3>
                            <p className="text-xs text-amber-800 max-w-md mx-auto">
                                Paste the job description in Step 1 so Zebra can identify missing technical skills, proof gaps, and unbacked claims.
                            </p>
                            <button
                                onClick={() => setActiveTab("overview")}
                                className="px-4 py-2 bg-amber-900 text-white text-xs font-bold rounded-xl hover:bg-amber-950"
                            >
                                Go to Step 1: Job Details
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <RequirementEvidenceMatrixView
                                applicationId={app.id}
                                onCompileSuccess={() => {
                                    showToast("Compiled ATS Document successfully!", "success");
                                }}
                            />
                        </div>
                    )}

                    <div className="flex justify-between items-center border-t border-neutral-100 pt-4">
                        <button
                            onClick={() => setActiveTab("work")}
                            className="px-4 py-2 border border-neutral-300 text-neutral-700 text-xs font-bold rounded-xl hover:bg-neutral-100"
                        >
                            ← Back to Work
                        </button>
                        <button
                            onClick={handleRunTailor}
                            disabled={isTailoring}
                            className="px-5 py-2.5 bg-[#0A0A0A] text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-colors inline-flex items-center gap-2 shadow-sm disabled:opacity-50"
                        >
                            <RiMagicLine className="w-4 h-4" />
                            {isTailoring ? "Generating AI Suggestions..." : "Generate AI Suggestions →"}
                        </button>
                    </div>
                </div>
            );
}
