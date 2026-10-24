"use client";

import React from "react";
import {
RiArrowRightLine,
RiBriefcaseLine,
RiExternalLinkLine
} from "react-icons/ri";
import type { ApplicationData,WorkspaceTab } from "../ApplicationWorkspace";

interface Props {
    company: string;
    setCompany: React.Dispatch<React.SetStateAction<string>>;
    position: string;
    setPosition: React.Dispatch<React.SetStateAction<string>>;
    url: string;
    setUrl: React.Dispatch<React.SetStateAction<string>>;
    deadline: string;
    setDeadline: React.Dispatch<React.SetStateAction<string>>;
    jobDescription: string;
    setJobDescription: React.Dispatch<React.SetStateAction<string>>;
    handleSave: (updatedFields?: Partial<ApplicationData>) => Promise<void>;
    setActiveTab: React.Dispatch<React.SetStateAction<WorkspaceTab>>;
}

export function OverviewTab({ company, setCompany, position, setPosition, url, setUrl, deadline, setDeadline, jobDescription, setJobDescription, handleSave, setActiveTab }: Props) {
    return (
                <div className="space-y-6 bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-extrabold flex items-center gap-2 border-b border-neutral-100 pb-3">
                        <RiBriefcaseLine className="w-5 h-5 text-neutral-700" /> Section 1: Job Details
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-neutral-700 mb-1">Company Name</label>
                            <input
                                type="text"
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                                className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl font-medium focus:ring-2 focus:ring-[#0A0A0A] outline-none text-xs"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-neutral-700 mb-1">Target Position / Role</label>
                            <input
                                type="text"
                                value={position}
                                onChange={(e) => setPosition(e.target.value)}
                                className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl font-medium focus:ring-2 focus:ring-[#0A0A0A] outline-none text-xs"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-neutral-700 mb-1">Job URL (optional)</label>
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    value={url}
                                    placeholder="https://company.com/careers/job-123"
                                    onChange={(e) => setUrl(e.target.value)}
                                    className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl font-medium focus:ring-2 focus:ring-[#0A0A0A] outline-none text-xs"
                                />
                                {url && (
                                    <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2.5 bg-neutral-100 text-neutral-700 rounded-xl hover:bg-neutral-200 transition-colors flex items-center justify-center"
                                    >
                                        <RiExternalLinkLine className="w-4 h-4" />
                                    </a>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-neutral-700 mb-1">Target Application Deadline</label>
                            <input
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl font-medium focus:ring-2 focus:ring-[#0A0A0A] outline-none text-xs"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">Full Job Description</label>
                        <textarea
                            rows={8}
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Paste the full job description here..."
                            className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-[#0A0A0A] outline-none"
                        />
                    </div>

                    <div className="flex justify-end gap-3 border-t border-neutral-100 pt-4">
                        <button
                            onClick={() => {
                                handleSave();
                                setActiveTab("resume");
                            }}
                            className="px-5 py-2.5 bg-[#0A0A0A] text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-colors inline-flex items-center gap-1"
                        >
                            Save & Choose Resume <RiArrowRightLine className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            );
}
