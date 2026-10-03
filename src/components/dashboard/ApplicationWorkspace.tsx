"use client";

import { EvidenceTab } from "./application-workspace/EvidenceTab";
import { ExportTab } from "./application-workspace/ExportTab";
import { OverviewTab } from "./application-workspace/OverviewTab";
import { ResumeTab } from "./application-workspace/ResumeTab";
import { ReviewTab } from "./application-workspace/ReviewTab";
import { SuggestionsTab } from "./application-workspace/SuggestionsTab";
import { WorkTab } from "./application-workspace/WorkTab";

import { ApplicationSuggestionsModal } from "@/components/dashboard/ApplicationSuggestionsModal";
import { useToast } from "@/components/ui/Toast";
import { analyzeEvidenceCoverage } from "@/lib/requirement-extractor";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo,useState } from "react";
import {
RiArrowLeftLine,
RiSave3Line
} from "react-icons/ri";

export interface ApplicationData {
    id: string;
    company: string;
    position: string;
    jobDescription: string | null;
    url: string | null;
    status: string; // canonical application lifecycle status
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
    { value: "Ready", label: "Ready" },
    { value: "Applied", label: "Applied" },
    { value: "Interviewing", label: "Interviewing" },
    { value: "Offer", label: "Offer" },
    { value: "Rejected", label: "Rejected" },
    { value: "Withdrawn", label: "Withdrawn" },
];

export type WorkspaceTab = "overview" | "resume" | "work" | "evidence" | "suggestions" | "review" | "export";

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
    const [isLoadingMoreCerts, setIsLoadingMoreCerts] = useState(false);
    const [certNextCursor, setCertNextCursor] = useState<string | null>(null);
    const [certsError, setCertsError] = useState<string | null>(null);
    const [notes, setNotes] = useState(app.notes || "");
    const [outcome, setOutcome] = useState(app.outcome || "");

    const [isSaving, setIsSaving] = useState(false);
    const [isTailoring, setIsTailoring] = useState(false);
    const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);

    const fetchCertifications = async (cursor?: string) => {
        if (cursor) setIsLoadingMoreCerts(true);
        else setIsLoadingCerts(true);
        setCertsError(null);
        try {
            const query = new URLSearchParams({ limit: "25" });
            if (cursor) query.set("cursor", cursor);
            const res = await fetch(`/api/certifications?${query.toString()}`);
            const data = await res.json();
            if (res.ok && data.certifications) {
                setCertificationsList(previous => cursor ? [...previous, ...data.certifications] : data.certifications);
                setCertNextCursor(data.page?.nextCursor ?? null);
            } else {
                setCertsError(data.error || "Failed to load certifications");
            }
        } catch (err: unknown) {
            console.error("Fetch Certifications Error:", err);
            setCertsError("Failed to fetch certifications.");
        } finally {
            setIsLoadingCerts(false);
            setIsLoadingMoreCerts(false);
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
                headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
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
            {activeTab === "overview" && <OverviewTab company={company} setCompany={setCompany} position={position} setPosition={setPosition} url={url} setUrl={setUrl} deadline={deadline} setDeadline={setDeadline} jobDescription={jobDescription} setJobDescription={setJobDescription} handleSave={handleSave} setActiveTab={setActiveTab} />}

            {/* 2. SELECTED RESUME */}
            {activeTab === "resume" && <ResumeTab resumes={resumes} selectedResumeId={selectedResumeId} setSelectedResumeId={setSelectedResumeId} handleSave={handleSave} setActiveTab={setActiveTab} />}

            {/* 3. MATCHING WORK / PROJECTS */}
            {activeTab === "work" && <WorkTab workItems={workItems} selectedWorkIds={selectedWorkIds} toggleWorkSelection={toggleWorkSelection} selectedCertIds={selectedCertIds} isLoadingCerts={isLoadingCerts} certsError={certsError} fetchCertifications={fetchCertifications} certificationsList={certificationsList} toggleCertSelection={toggleCertSelection} certNextCursor={certNextCursor} isLoadingMoreCerts={isLoadingMoreCerts} setActiveTab={setActiveTab} />}

            {/* 4. MISSING EVIDENCE OR IMPROVEMENT AREAS */}
            {activeTab === "evidence" && <EvidenceTab jobDescription={jobDescription} setActiveTab={setActiveTab} app={app} showToast={showToast} handleRunTailor={handleRunTailor} isTailoring={isTailoring} />}

            {/* 5. AI SUGGESTIONS */}
            {activeTab === "suggestions" && <SuggestionsTab handleRunTailor={handleRunTailor} isTailoring={isTailoring} app={app} approvedSuggestionsCount={approvedSuggestionsCount} pendingSuggestionsCount={pendingSuggestionsCount} setShowSuggestionsModal={setShowSuggestionsModal} setActiveTab={setActiveTab} />}

            {/* 6. FINAL REVIEW */}
            {activeTab === "review" && <ReviewTab app={app} approvedSuggestionsCount={approvedSuggestionsCount} company={company} setActiveTab={setActiveTab} />}

            {/* 7. EXPORT AND APPLICATION STATUS */}
            {activeTab === "export" && <ExportTab company={company} app={app} selectedResumeId={selectedResumeId} setStatus={setStatus} handleSave={handleSave} notes={notes} setNotes={setNotes} outcome={outcome} setOutcome={setOutcome} />}

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
