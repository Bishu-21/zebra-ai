"use client";

import Link from "next/link";
import React from "react";
import {
RiCheckLine,RiDownloadLine
} from "react-icons/ri";
import type { ApplicationData } from "../ApplicationWorkspace";

interface Props {
    company: string;
    app: ApplicationData;
    selectedResumeId: string;
    setStatus: React.Dispatch<React.SetStateAction<string>>;
    handleSave: (updatedFields?: Partial<ApplicationData>) => Promise<void>;
    notes: string;
    setNotes: React.Dispatch<React.SetStateAction<string>>;
    outcome: string;
    setOutcome: React.Dispatch<React.SetStateAction<string>>;
}

export function ExportTab({ company, app, selectedResumeId, setStatus, handleSave, notes, setNotes, outcome, setOutcome }: Props) {
    return (
                <div className="space-y-6 bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-extrabold flex items-center gap-2 border-b border-neutral-100 pb-3">
                        <RiDownloadLine className="w-5 h-5 text-neutral-700" /> Section 7: Export & Application Status
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Step 1: Export PDF */}
                        <div className="p-5 border border-neutral-200 rounded-2xl space-y-3">
                            <h3 className="font-extrabold text-sm text-[#0A0A0A] flex items-center gap-2">
                                <RiDownloadLine className="w-4 h-4 text-neutral-700" /> Export Resume PDF
                            </h3>
                            <p className="text-xs text-neutral-600 leading-relaxed">
                                Download your final resume version ready for submission to {company}.
                            </p>
                            {app.resumeVersionId ? (
                                <Link
                                    href={`/dashboard/resumes/${selectedResumeId}?version=${app.resumeVersionId}`}
                                    className="w-full py-2.5 bg-[#0A0A0A] text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-colors inline-flex items-center justify-center gap-2"
                                >
                                    <RiDownloadLine className="w-4 h-4" /> Export Tailored Resume PDF
                                </Link>
                            ) : selectedResumeId ? (
                                <Link
                                    href={`/dashboard/resumes/${selectedResumeId}`}
                                    className="w-full py-2.5 bg-[#0A0A0A] text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-colors inline-flex items-center justify-center gap-2"
                                >
                                    <RiDownloadLine className="w-4 h-4" /> Export Base Resume PDF
                                </Link>
                            ) : (
                                <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
                                    Please select a resume in Step 2 first.
                                </p>
                            )}
                        </div>

                        {/* Step 2: Mark Status */}
                        <div className="p-5 border border-neutral-200 rounded-2xl space-y-3">
                            <h3 className="font-extrabold text-sm text-[#0A0A0A] flex items-center gap-2">
                                <RiCheckLine className="w-4 h-4 text-emerald-600" /> Mark Application Status
                            </h3>
                            <p className="text-xs text-neutral-600 leading-relaxed">
                                Record when you submit your application so your Dashboard displays the correct next step.
                            </p>
                            <button
                                onClick={() => {
                                    setStatus("Applied");
                                    handleSave({ status: "Applied" });
                                }}
                                className="w-full py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors inline-flex items-center justify-center gap-2 shadow-sm"
                            >
                                <RiCheckLine className="w-4 h-4" /> Mark as applied
                            </button>
                        </div>
                    </div>

                    {/* Follow-up Notes & Outcome */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-neutral-100">
                        <div>
                            <label className="block text-xs font-bold text-neutral-700 mb-1">Set follow-up</label>
                            <textarea
                                rows={4}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add recruiter contact, referral notes, or follow-up dates..."
                                className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#0A0A0A] outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-neutral-700 mb-1">Application Outcome</label>
                            <select
                                value={outcome}
                                onChange={(e) => {
                                    setOutcome(e.target.value);
                                    handleSave({ outcome: e.target.value });
                                }}
                                className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#0A0A0A] outline-none cursor-pointer bg-white"
                            >
                                <option value="">In Progress</option>
                                <option value="Interview Scheduled">Interview Scheduled</option>
                                <option value="Offer Received">Offer Received</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Withdrawn">Withdrawn</option>
                            </select>
                        </div>
                    </div>
                </div>
            );
}
