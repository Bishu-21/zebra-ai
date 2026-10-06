"use client";

import React from "react";
import {
RiArrowRightLine,
RiEyeLine
} from "react-icons/ri";
import type { ApplicationData,WorkspaceTab } from "../ApplicationWorkspace";

interface Props {
    app: ApplicationData;
    approvedSuggestionsCount: number;
    company: string;
    setActiveTab: React.Dispatch<React.SetStateAction<WorkspaceTab>>;
}

export function ReviewTab({ app, approvedSuggestionsCount, company, setActiveTab }: Props) {
    return (
                <div className="space-y-6 bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-extrabold flex items-center gap-2 border-b border-neutral-100 pb-3">
                        <RiEyeLine className="w-5 h-5 text-neutral-700" /> Section 6: Final Resume Review
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Master Resume Side */}
                        <div className="p-5 border border-neutral-200 rounded-2xl space-y-3 bg-neutral-50/50">
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Master Base Resume</span>
                            <h3 className="font-extrabold text-sm text-[#0A0A0A]">
                                {app.selectedResume?.title || "No Master Resume Selected"}
                            </h3>
                            <p className="text-xs text-neutral-600">
                                Untouched base master resume record.
                            </p>
                        </div>

                        {/* Tailored Resume Version Side */}
                        <div className="p-5 border border-emerald-200 bg-emerald-50/40 rounded-2xl space-y-3">
                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Compiled Tailored Version</span>
                            <h3 className="font-extrabold text-sm text-emerald-950">
                                {app.resumeVersion?.title || "Pending Suggestions Approval"}
                            </h3>
                            <p className="text-xs text-emerald-800">
                                Contains {approvedSuggestionsCount} approved section improvements tailored specifically for {company}.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-neutral-100 pt-4">
                        <button
                            onClick={() => setActiveTab("suggestions")}
                            className="px-4 py-2 border border-neutral-300 text-neutral-700 text-xs font-bold rounded-xl hover:bg-neutral-100"
                        >
                            ← Back to Suggestions
                        </button>
                        <button
                            onClick={() => setActiveTab("export")}
                            className="px-5 py-2.5 bg-[#0A0A0A] text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-colors inline-flex items-center gap-1"
                        >
                            Proceed to Export & Status <RiArrowRightLine className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            );
}
