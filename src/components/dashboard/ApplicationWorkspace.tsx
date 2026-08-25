"use client";

import React, { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    RiArrowLeftLine, RiBriefcaseLine, RiFileTextLine, RiMagicLine,
    RiCheckLine, RiDownloadLine, RiExternalLinkLine,
    RiSave3Line, RiStackLine, RiAddLine, RiRefreshLine,
    RiAlertLine, RiEyeLine, RiSearchLine,
    RiArrowRightLine
} from "react-icons/ri";
import { useToast } from "@/components/ui/Toast";
import { ApplicationSuggestionsModal } from "@/components/dashboard/ApplicationSuggestionsModal";
import { analyzeEvidenceCoverage } from "@/lib/requirement-extractor";
import { RequirementEvidenceMatrixView } from "@/components/compiler/RequirementEvidenceMatrixView";

export interface ApplicationData {
    id: string;
    company: string;
    position: string;
    jobDescription: string | null;
    url: string | null;
    status: string; // "Draft" | "Preparing" | "Tailoring" | "Applied" | "Interviewing" | "Offer" | "Rejected" | "Withdrawn"
    selectedResumeId: string | null;
    selectedWorkIds: string[] | null;
    selectedCertIds: string[] | null;
    resumeVersionId: string | null;
    deadline: string | Date | null;
    notes: string | null;
    outcome: string | null;
    selectedResume?: { id: string; title: string; updatedAt: string; content?: string | null } | null;
    resumeVersion?: { id: string; title: string; updatedAt: string; content?: string | null } | null;
    changes?: Array<{ id: string; section: string; changeType: string; originalText: string | null; suggestedText: string; userEdits: string | null; status: string }>;
}

export interface UserResume {
    id: string;
    title: string;
    updatedAt: string;
}

export interface UserWorkItem {
    id: string;
    title: string;
    category: string;
    description?: string | null;
}

export interface UserCertification {
    id: string;
    title: string;
    issuer: string;
    issueDate?: string | Date | null;
    credentialUrl?: string | null;
}

interface ApplicationWorkspaceProps {
    initialApplication: ApplicationData;
    resumes: UserResume[];
    workItems: UserWorkItem[];
    certifications?: UserCertification[];
}

const STATUS_OPTIONS = [
    { value: "Draft", label: "Draft" },
    { value: "Preparing", label: "Preparing" },
    { value: "Tailoring", label: "Tailoring" },
    { value: "Applied", label: "Applied" },
    { value: "Interviewing", label: "Interviewing" },
    { value: "Offer", label: "Offer" },
    { value: "Rejected", label: "Rejected" },
    { value: "Withdrawn", label: "Withdrawn" },
];

type WorkspaceTab = "overview" | "resume" | "work" | "evidence" | "suggestions" | "review" | "export";

export function ApplicationWorkspace({ initialApplication, resumes, workItems, certifications: initialCertifications }: ApplicationWorkspaceProps) {
    const searchParams = useSearchParams();
    const { showToast } = useToast();

    const [app, setApp] = useState<ApplicationData>(initialApplication);

    const initialTabParam = searchParams.get("step") as WorkspaceTab | null;
    const [activeTab, setActiveTab] = useState<WorkspaceTab>(
        initialTabParam || "overview"
    );

    const [company, setCompany] = useState(app.company);
    const [position, setPosition] = useState(app.position);
    const [jobDescription, setJobDescription] = useState(app.jobDescription || "");
    const [url, setUrl] = useState(app.url || "");
    const [deadline, setDeadline] = useState(
        app.deadline ? new Date(app.deadline).toISOString().substring(0, 10) : ""
    );
    const [status, setStatus] = useState(app.status);
    const [selectedResumeId, setSelectedResumeId] = useState(app.selectedResumeId || "");
    const [selectedWorkIds, setSelectedWorkIds] = useState<string[]>(app.selectedWorkIds || []);
    const [selectedCertIds, setSelectedCertIds] = useState<string[]>(app.selectedCertIds || []);
    const [certificationsList, setCertificationsList] = useState<UserCertification[]>(initialCertifications || []);
    const [isLoadingCerts, setIsLoadingCerts] = useState(false);
    const [certsError, setCertsError] = useState<string | null>(null);
    const [notes, setNotes] = useState(app.notes || "");
    const [outcome, setOutcome] = useState(app.outcome || "");

    const [isSaving, setIsSaving] = useState(false);
    const [isTailoring, setIsTailoring] = useState(false);
    const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);

    const fetchCertifications = async () => {
        setIsLoadingCerts(true);
        setCertsError(null);
        try {
            const res = await fetch("/api/certifications");
            const data = await res.json();
            if (res.ok && data.certifications) {
                setCertificationsList(data.certifications);
            } else {
                setCertsError(data.error || "Failed to load certifications");
            }
        } catch (err: unknown) {
            console.error("Fetch Certifications Error:", err);
            setCertsError("Failed to fetch certifications.");
        } finally {
            setIsLoadingCerts(false);
        }
    };

    const refreshApplication = async () => {
        try {
            const res = await fetch(`/api/applications?id=${app.id}`);
            const data = await res.json();
            if (res.ok && data.application) {
                setApp(data.application);
                setStatus(data.application.status);
                setSelectedResumeId(data.application.selectedResumeId || "");
                setSelectedWorkIds(data.application.selectedWorkIds || []);
                setSelectedCertIds(data.application.selectedCertIds || []);
                if (data.application.outcome) setOutcome(data.application.outcome);
            }
        } catch (err) {
            console.error("Failed to refresh application:", err);
        }
    };

    const handleSave = async (updatedFields?: Partial<ApplicationData>) => {
        try {
            setIsSaving(true);
            const payload = {
                id: app.id,
                company: updatedFields?.company ?? company,
                position: updatedFields?.position ?? position,
                jobDescription: updatedFields?.jobDescription ?? jobDescription,
                url: updatedFields?.url ?? url,
                status: updatedFields?.status ?? status,
                selectedResumeId: updatedFields?.selectedResumeId ?? (selectedResumeId || null),
                selectedWorkIds: updatedFields?.selectedWorkIds ?? selectedWorkIds,
                selectedCertIds: updatedFields?.selectedCertIds ?? selectedCertIds,
                deadline: updatedFields?.deadline ?? (deadline ? new Date(deadline).toISOString() : null),
                notes: updatedFields?.notes ?? notes,
                outcome: updatedFields?.outcome ?? outcome,
            };

            const res = await fetch("/api/applications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (res.ok) {
                showToast("Application saved successfully", "success");
                setApp(data.application);
            } else {
                showToast(data.error || "Failed to update application", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("Error saving application", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleRunTailor = async () => {
        if (!selectedResumeId) {
            showToast("Please choose a resume first", "error");
            setActiveTab("resume");
            return;
        }
        if (!jobDescription.trim()) {
            showToast("Please paste the job description first", "error");
            setActiveTab("overview");
            return;
        }

        try {
            setIsTailoring(true);
            const res = await fetch("/api/ai/tailor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    resumeId: selectedResumeId,
                    jobDescription: jobDescription,
                    company: company,
                    targetRole: position,
                    applicationId: app.id,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                showToast("AI suggestions generated!", "success");
                await refreshApplication();
                setShowSuggestionsModal(true);
            } else {
                showToast(data.error || "AI tailoring failed", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("Error running AI tailoring", "error");
        } finally {
            setIsTailoring(false);
        }
    };

    const toggleWorkSelection = (workId: string) => {
        const updated = selectedWorkIds.includes(workId)
            ? selectedWorkIds.filter(id => id !== workId)
            : [...selectedWorkIds, workId];
        setSelectedWorkIds(updated);
        handleSave({ selectedWorkIds: updated });
    };

    const toggleCertSelection = (certId: string) => {
        const updated = selectedCertIds.includes(certId)
            ? selectedCertIds.filter(id => id !== certId)
            : [...selectedCertIds, certId];
        setSelectedCertIds(updated);
        handleSave({ selectedCertIds: updated });
    };

    const pendingSuggestionsCount = app.changes?.filter(c => c.status === "pending").length || 0;
    const approvedSuggestionsCount = app.changes?.filter(c => c.status === "approved").length || 0;

    // Missing Evidence Analysis computation using maintainable requirement extractor
    const evidenceAnalysis = useMemo(() => {
        return analyzeEvidenceCoverage(
            jobDescription,
            selectedWorkIds,
            workItems,
            app.selectedResume
        );
    }, [jobDescription, selectedWorkIds, workItems, app.selectedResume]);

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6 text-[#0A0A0A]">
            {/* Header / Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
                <div>
                    <Link
                        href="/dashboard/job-tracker"
                        className="inline-flex items-center text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors mb-2 gap-1"
                    >
                        <RiArrowLeftLine className="w-4 h-4" /> Back to Applications
                    </Link>
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                            {position}
                        </h1>
                        <span className="text-lg text-neutral-500 font-medium">@ {company}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {/* Status Dropdown */}
                    <div className="relative">
                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                handleSave({ status: e.target.value });
                            }}
                            className="px-3.5 py-2 border rounded-xl font-semibold text-xs transition-colors focus:ring-2 focus:ring-[#0A0A0A] outline-none cursor-pointer"
                        >
                            {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    Status: {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => handleSave()}
                        disabled={isSaving}
                        className="px-4 py-2 bg-[#0A0A0A] text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-colors inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                        <RiSave3Line className="w-4 h-4" />
                        {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>

            <div className="grid items-start gap-6 md:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="md:sticky md:top-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="grid grid-cols-3 gap-2 border-b border-neutral-100 pb-4 md:grid-cols-1">
                <label className="block"><span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Status</span><select value={status} onChange={(e) => { setStatus(e.target.value); handleSave({ status: e.target.value }); }} className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold outline-none">{STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                <div><span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Deadline</span><p className="mt-2 text-xs font-semibold">{deadline ? new Date(`${deadline}T00:00:00`).toLocaleDateString() : "Not set"}</p></div>
                <div><span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Attached</span><p className="mt-2 text-xs font-semibold">{selectedResumeId ? "Resume selected" : "No resume"} · {selectedWorkIds.length} work</p></div>
              </div>
              <p className="mt-4 px-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">Sections</p>
              <nav className="mt-2 flex gap-2 overflow-x-auto md:flex-col">
                <button
                    onClick={() => setActiveTab("overview")}
                    className={`px-3 py-2 rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                        activeTab === "overview" ? "bg-[#0A0A0A] text-white" : "text-neutral-600 hover:bg-neutral-100"
                    }`}
                >
                    <span className={`h-2 w-2 rounded-full ${company && position ? "bg-emerald-500" : "border border-neutral-400"}`} /> Job details
                </button>

                <button
                    onClick={() => setActiveTab("resume")}
                    className={`px-3 py-2 rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                        activeTab === "resume" ? "bg-[#0A0A0A] text-white" : "text-neutral-600 hover:bg-neutral-100"
                    }`}
                >
                    <span className={`h-2 w-2 rounded-full ${selectedResumeId ? "bg-emerald-500" : "border border-neutral-400"}`} /> Resume
                </button>

                <button
                    onClick={() => setActiveTab("work")}
                    className={`px-3 py-2 rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                        activeTab === "work" ? "bg-[#0A0A0A] text-white" : "text-neutral-600 hover:bg-neutral-100"
                    }`}
                >
                    <span className={`h-2 w-2 rounded-full ${selectedWorkIds.length ? "bg-emerald-500" : "border border-neutral-400"}`} /> Work ({selectedWorkIds.length})
                </button>

                <button
                    onClick={() => setActiveTab("evidence")}
                    className={`px-3 py-2 rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                        activeTab === "evidence" ? "bg-[#0A0A0A] text-white" : "text-neutral-600 hover:bg-neutral-100"
                    }`}
                >
                    <span className={`h-2 w-2 rounded-full ${jobDescription ? "bg-emerald-500" : "border border-neutral-400"}`} /> Evidence
                    {evidenceAnalysis.missing.length > 0 && (
                        <span className="px-1.5 py-0.5 text-[9px] bg-rose-500 text-white rounded-full font-bold">
                            {evidenceAnalysis.missing.length}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => setActiveTab("suggestions")}
                    className={`px-3 py-2 rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                        activeTab === "suggestions" ? "bg-[#0A0A0A] text-white" : "text-neutral-600 hover:bg-neutral-100"
                    }`}
                >
                    <span className={`h-2 w-2 rounded-full ${(app.changes?.length || 0) > 0 ? "bg-emerald-500" : "border border-neutral-400"}`} /> AI suggestions
                    {pendingSuggestionsCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[9px] bg-amber-500 text-white rounded-full font-bold">
                            {pendingSuggestionsCount}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => setActiveTab("review")}
                    className={`px-3 py-2 rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                        activeTab === "review" ? "bg-[#0A0A0A] text-white" : "text-neutral-600 hover:bg-neutral-100"
                    }`}
                >
                    <span className={`h-2 w-2 rounded-full ${app.resumeVersionId ? "bg-emerald-500" : "border border-neutral-400"}`} /> Final review
                </button>

                <button
                    onClick={() => setActiveTab("export")}
                    className={`px-3 py-2 rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                        activeTab === "export" ? "bg-[#0A0A0A] text-white" : "text-neutral-600 hover:bg-neutral-100"
                    }`}
                >
                    <span className={`h-2 w-2 rounded-full ${selectedResumeId ? "bg-emerald-500" : "border border-neutral-400"}`} /> Export
                </button>
              </nav>
              <div className="mt-5 space-y-4 border-t border-neutral-100 pt-4">
                <label className="block"><span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Notes</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => handleSave({ notes })} rows={3} placeholder="Recruiter, referral, follow-up…" className="mt-2 w-full resize-none rounded-xl border border-neutral-200 px-3 py-2 text-xs outline-none" /></label>
                <label className="block"><span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Outcome</span><select value={outcome} onChange={(e) => { setOutcome(e.target.value); handleSave({ outcome: e.target.value }); }} className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold"><option value="">In progress</option><option value="Interview Scheduled">Interview scheduled</option><option value="Offer Received">Offer received</option><option value="Rejected">Rejected</option><option value="Withdrawn">Withdrawn</option></select></label>
              </div>
            </aside>
            <main className="min-w-0">

            {/* TAB CONTENT */}

            {/* 1. JOB DETAILS */}
            {activeTab === "overview" && (
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
            )}

            {/* 2. SELECTED RESUME */}
            {activeTab === "resume" && (
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
            )}

            {/* 3. MATCHING WORK / PROJECTS */}
            {activeTab === "work" && (
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
                                    Select verified certifications from your library to attach to this application.
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
                                <button onClick={fetchCertifications} className="font-bold underline ml-2">Retry</button>
                            </div>
                        ) : certificationsList.length === 0 ? (
                            <div className="p-4 border border-dashed border-neutral-200 rounded-2xl text-center text-xs text-neutral-500 font-semibold space-y-2">
                                <p>No certifications found in your library yet.</p>
                                <button
                                    onClick={fetchCertifications}
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
            )}

            {/* 4. MISSING EVIDENCE OR IMPROVEMENT AREAS */}
            {activeTab === "evidence" && (
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
            )}

            {/* 5. AI SUGGESTIONS */}
            {activeTab === "suggestions" && (
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
            )}

            {/* 6. FINAL REVIEW */}
            {activeTab === "review" && (
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
            )}

            {/* 7. EXPORT AND APPLICATION STATUS */}
            {activeTab === "export" && (
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
                                    href={`/dashboard/resumes/${app.resumeVersionId}`}
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
            )}

            </main>
            </div>

            {/* Application Suggestions Modal */}
            {showSuggestionsModal && (
                <ApplicationSuggestionsModal
                    applicationId={app.id}
                    company={company}
                    position={position}
                    isOpen={showSuggestionsModal}
                    onCloseAction={() => setShowSuggestionsModal(false)}
                    onStatusChangeAction={refreshApplication}
                />
            )}
        </div>
    );
}
