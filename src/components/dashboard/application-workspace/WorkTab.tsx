"use client";

import Link from "next/link";
import React from "react";
import {
RiAddLine,
RiArrowRightLine,
RiCheckLine,
RiExternalLinkLine,
RiStackLine
} from "react-icons/ri";
import type { UserCertification,UserWorkItem,WorkspaceTab } from "../ApplicationWorkspace";

interface Props {
    workItems: UserWorkItem[];
    selectedWorkIds: string[];
    toggleWorkSelection: (workId: string) => void;
    selectedCertIds: string[];
    isLoadingCerts: boolean;
    certsError: string | null;
    fetchCertifications: (cursor?: string) => Promise<void>;
    certificationsList: UserCertification[];
    toggleCertSelection: (certId: string) => void;
    certNextCursor: string | null;
    isLoadingMoreCerts: boolean;
    setActiveTab: React.Dispatch<React.SetStateAction<WorkspaceTab>>;
}

export function WorkTab({ workItems, selectedWorkIds, toggleWorkSelection, selectedCertIds, isLoadingCerts, certsError, fetchCertifications, certificationsList, toggleCertSelection, certNextCursor, isLoadingMoreCerts, setActiveTab }: Props) {
    return (
                <div className="space-y-6 bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                        <h2 className="text-lg font-extrabold flex items-center gap-2">
                            <RiStackLine className="w-5 h-5 text-neutral-700" /> Section 3: Matching Work & Projects
                        </h2>
                        <Link
                            href="/dashboard/work"
                            className="text-xs font-bold text-neutral-600 hover:text-black transition-colors flex items-center gap-1"
                        >
                            <RiAddLine className="w-4 h-4" /> Add to My Work
                        </Link>
                    </div>

                    <p className="text-xs text-neutral-600">
                        Select real projects, internships, or hackathons from your library that match the requirements of this role.
                    </p>

                    {workItems.length === 0 ? (
                        <div className="text-center py-8 space-y-3">
                            <p className="text-xs text-neutral-600 font-semibold">No work items in your library yet.</p>
                            <Link
                                href="/dashboard/work"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A0A0A] text-white text-xs font-bold rounded-xl hover:bg-neutral-800"
                            >
                                <RiAddLine className="w-4 h-4" /> + Add project
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {workItems.map((item) => {
                                const isChecked = selectedWorkIds.includes(item.id);
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => toggleWorkSelection(item.id)}
                                        className={`p-4 border rounded-2xl cursor-pointer transition-all flex items-start gap-3 ${
                                            isChecked
                                                ? "border-[#0A0A0A] bg-neutral-50"
                                                : "border-neutral-200 hover:border-neutral-300"
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => {}}
                                            className="mt-1 rounded text-black focus:ring-black"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-extrabold text-sm text-[#0A0A0A]">{item.title}</h4>
                                                <span className="px-2 py-0.5 text-[10px] font-bold bg-neutral-200 text-neutral-700 rounded-full">
                                                    {item.category}
                                                </span>
                                            </div>
                                            {item.description && (
                                                <p className="text-xs text-neutral-600 mt-1 line-clamp-2">{item.description}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Certifications & Credentials Selector Subsection */}
                    <div className="pt-6 border-t border-neutral-100 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-extrabold text-sm text-[#0A0A0A] flex items-center gap-2">
                                    <RiCheckLine className="w-4 h-4 text-emerald-600" /> Attached Certifications & Credentials
                                </h3>
                                <p className="text-xs text-neutral-500 mt-0.5">
                                    Select relevant certifications from your library to attach to this application.
                                </p>
                            </div>
                            <span className="px-2.5 py-1 text-xs font-bold bg-neutral-100 text-neutral-700 rounded-full">
                                {selectedCertIds.length} Selected
                            </span>
                        </div>

                        {isLoadingCerts ? (
                            <div className="p-4 text-xs font-semibold text-neutral-500 bg-neutral-50 rounded-2xl text-center">
                                Loading certifications...
                            </div>
                        ) : certsError ? (
                            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center justify-between">
                                <span>{certsError}</span>
                                <button onClick={() => void fetchCertifications()} className="font-bold underline ml-2">Retry</button>
                            </div>
                        ) : certificationsList.length === 0 ? (
                            <div className="p-4 border border-dashed border-neutral-200 rounded-2xl text-center text-xs text-neutral-500 font-semibold space-y-2">
                                <p>No certifications found in your library yet.</p>
                                <button
                                    onClick={() => void fetchCertifications()}
                                    className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold rounded-xl transition-colors text-xs"
                                >
                                    Refresh Certifications
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {certificationsList.map((cert) => {
                                    const isSelected = selectedCertIds.includes(cert.id);
                                    return (
                                        <div
                                            key={cert.id}
                                            onClick={() => toggleCertSelection(cert.id)}
                                            className={`p-3.5 border rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-3 ${
                                                isSelected
                                                    ? "border-[#0A0A0A] bg-neutral-50"
                                                    : "border-neutral-200 hover:border-neutral-300 bg-white"
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => {}}
                                                    className="rounded text-black focus:ring-black cursor-pointer"
                                                />
                                                <div>
                                                    <h4 className="font-bold text-xs text-[#0A0A0A]">{cert.title}</h4>
                                                    <p className="text-[11px] text-neutral-500">Issuer: {cert.issuer}</p>
                                                </div>
                                            </div>
                                            {cert.credentialUrl && (
                                                <a
                                                    href={cert.credentialUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="text-neutral-400 hover:text-black transition-colors p-1"
                                                >
                                                    <RiExternalLinkLine className="w-4 h-4" />
                                                </a>
                                            )}
                                        </div>
                                    );
                                })}
                                {certNextCursor && (
                                    <button
                                        type="button"
                                        disabled={isLoadingMoreCerts}
                                        onClick={() => void fetchCertifications(certNextCursor)}
                                        className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                                    >
                                        {isLoadingMoreCerts ? "Loading…" : "Load more certifications"}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center border-t border-neutral-100 pt-4">
                        <button
                            onClick={() => setActiveTab("resume")}
                            className="px-4 py-2 border border-neutral-300 text-neutral-700 text-xs font-bold rounded-xl hover:bg-neutral-100"
                        >
                            ← Back to Resume
                        </button>
                        <button
                            onClick={() => setActiveTab("evidence")}
                            className="px-5 py-2.5 bg-[#0A0A0A] text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-colors inline-flex items-center gap-1"
                        >
                            Next: Analyze Missing Evidence <RiArrowRightLine className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            );
}
