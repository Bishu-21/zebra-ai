"use client";

import Link from "next/link";
import React from "react";
import {
RiAddLine,
RiArrowRightLine,
RiFileTextLine
} from "react-icons/ri";
import type { ApplicationData,UserResume,WorkspaceTab } from "../ApplicationWorkspace";

interface Props {
    resumes: UserResume[];
    selectedResumeId: string;
    setSelectedResumeId: React.Dispatch<React.SetStateAction<string>>;
    handleSave: (updatedFields?: Partial<ApplicationData>) => Promise<void>;
    setActiveTab: React.Dispatch<React.SetStateAction<WorkspaceTab>>;
}

export function ResumeTab({ resumes, selectedResumeId, setSelectedResumeId, handleSave, setActiveTab }: Props) {
    return (
                <div className="space-y-6 bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-extrabold flex items-center gap-2 border-b border-neutral-100 pb-3">
                        <RiFileTextLine className="w-5 h-5 text-neutral-700" /> Section 2: Selected Master Resume
                    </h2>

                    {resumes.length === 0 ? (
                        <div className="text-center py-8 space-y-3">
                            <p className="text-xs text-neutral-600 font-semibold">No master resume found in your library.</p>
                            <Link
                                href="/dashboard/resumes"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A0A0A] text-white text-xs font-bold rounded-xl hover:bg-neutral-800"
                            >
                                <RiAddLine className="w-4 h-4" /> Create or Import Master Resume
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {resumes.map((r) => {
                                const isSelected = selectedResumeId === r.id;
                                return (
                                    <div
                                        key={r.id}
                                        onClick={() => {
                                            setSelectedResumeId(r.id);
                                            handleSave({ selectedResumeId: r.id });
                                        }}
                                        className={`p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                                            isSelected
                                                ? "border-[#0A0A0A] bg-neutral-50 shadow-sm"
                                                : "border-neutral-200 hover:border-neutral-400 bg-white"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-extrabold text-sm text-[#0A0A0A]">{r.title}</h3>
                                            {isSelected && (
                                                <span className="px-2 py-0.5 bg-[#0A0A0A] text-white text-[10px] font-bold rounded-full">
                                                    Selected
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-neutral-500 mt-1">
                                            Updated {new Date(r.updatedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="flex justify-between items-center border-t border-neutral-100 pt-4">
                        <button
                            onClick={() => setActiveTab("overview")}
                            className="px-4 py-2 border border-neutral-300 text-neutral-700 text-xs font-bold rounded-xl hover:bg-neutral-100"
                        >
                            ← Back to Job Details
                        </button>
                        <button
                            onClick={() => setActiveTab("work")}
                            className="px-5 py-2.5 bg-[#0A0A0A] text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-colors inline-flex items-center gap-1"
                        >
                            Next: Attach Matching Work <RiArrowRightLine className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            );
}
