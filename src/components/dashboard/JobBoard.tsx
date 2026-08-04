"use client";

import React, { useState } from "react";
import { m } from "framer-motion";
import { 
    RiAddLine, 
    RiBriefcase4Line, 
    RiDeleteBin6Line, 
    RiCheckboxCircleLine, 
    RiMoneyDollarCircleLine, 
    RiExternalLinkLine, 
    RiInboxArchiveLine, 
    RiChat3Line, 
    RiCloseCircleLine, 
    RiFileTextLine,
    RiArrowDropDownLine,
    RiMore2Fill,
    RiMapPin2Line,
    RiArrowRightSLine,
    RiCalendarEventLine,
    RiMagicLine,
    RiLoader4Line,
    RiArrowRightLine
} from "react-icons/ri";
import { formatRelativeTime } from "@/lib/utils";
import { type ApplicationStatus } from "@/lib/application-state-machine";

import { ApplicationSuggestionsModal } from "@/components/dashboard/ApplicationSuggestionsModal";

export const BOARD_STATUSES = [
    "Draft",
    "Preparing",
    "Tailoring",
    "Applied",
    "Interviewing",
    "Offer",
    "Rejected",
    "Withdrawn"
] as const;

export type BoardStatus = (typeof BOARD_STATUSES)[number];

export type Job = {
    id: string;
    company: string;
    position: string;
    status: BoardStatus | ApplicationStatus | "Offers";
    salary?: string | null;
    url?: string | null;
    location?: string | null;
    jobType?: string | null;
    description?: string | null;
    resumeId?: string | null;
    resumeVersionId?: string | null;
    updatedAt: string;
};

export function JobBoard({ 
    initialJobs, 
    resumes = [], 
    versions = [] 
}: { 
    initialJobs: Job[], 
    resumes?: { id: string; title: string }[],
    versions?: { id: string; title: string; company: string | null; targetRole: string | null }[]
}) {
    const [jobs, setJobs] = useState<Job[]>(initialJobs);
    const [isAdding, setIsAdding] = useState(false);
    const [newJob, setNewJob] = useState({ 
        company: "", 
        position: "", 
        status: "Applied" as Job["status"],
        salary: "",
        url: "",
        location: "",
        jobType: "",
        description: "",
        resumeId: "",
        resumeVersionId: ""
    });
    const [loading, setLoading] = useState(false);
    const [isScraping, setIsScraping] = useState(false);
    const [scrapeUrl, setScrapeUrl] = useState("");
    const [selectedAppModal, setSelectedAppModal] = useState<{ id: string; company: string; position: string } | null>(null);

    const handleAddJob = async () => {
        if (!newJob.company || !newJob.position) return;
        setLoading(true);
        try {
            // Attempt posting to canonical /api/applications first
            let res = await fetch("/api/applications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    company: newJob.company,
                    position: newJob.position,
                    jobDescription: newJob.description,
                    url: newJob.url,
                    selectedResumeId: newJob.resumeId || undefined,
                }),
            });
            let data = await res.json();

            if (!res.ok) {
                // Fallback to legacy /api/jobs
                res = await fetch("/api/jobs", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newJob),
                });
                data = await res.json();
            }

            if (data.success || data.application) {
                const addedId = data.application?.id || data.id;
                const addedJob: Job = { 
                    ...newJob, 
                    id: addedId, 
                    updatedAt: new Date().toISOString() 
                };
                setJobs([addedJob, ...jobs]);
                setNewJob({ company: "", position: "", status: "Applied", salary: "", url: "", location: "", jobType: "", description: "", resumeId: "", resumeVersionId: "" });
                setIsAdding(false);
                setScrapeUrl("");
            }
        } catch (error) {
            console.error("Add Application Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleScrape = async () => {
        if (!scrapeUrl) return;
        setIsScraping(true);
        try {
            const res = await fetch("/api/jobs/scrape", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: scrapeUrl }),
            });
            const data = await res.json();
            if (data.success) {
                setNewJob({
                    ...newJob,
                    company: data.company,
                    position: data.position,
                    salary: data.salary,
                    location: data.location,
                    jobType: data.jobType,
                    description: data.description,
                    url: data.url
                });
                setScrapeUrl(""); // Clear URL after success
            }
        } catch (error) {
            console.error("Scrape Error:", error);
        } finally {
            setIsScraping(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: Job["status"]) => {
        try {
            let res = await fetch("/api/applications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status }),
            });
            if (!res.ok) {
                res = await fetch("/api/jobs", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id, status }),
                });
            }
            if (res.ok) {
                setJobs(jobs.map(j => j.id === id ? { ...j, status } : j));
            }
        } catch (error) {
            console.error("Update Status Error:", error);
        }
    };

    const handleDeleteJob = async (id: string) => {
        if (!confirm("Are you sure you want to delete this application?")) return;
        try {
            let res = await fetch(`/api/applications?id=${id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                res = await fetch("/api/jobs", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id }),
                });
            }
            if (res.ok) {
                setJobs(jobs.filter(j => j.id !== id));
            }
        } catch (error) {
            console.error("Delete Application Error:", error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Draft": return { bg: "bg-slate-500", text: "text-slate-600", border: "border-slate-500/20", light: "bg-slate-50" };
            case "Preparing": return { bg: "bg-sky-500", text: "text-sky-600", border: "border-sky-500/20", light: "bg-sky-50" };
            case "Tailoring": return { bg: "bg-indigo-500", text: "text-indigo-600", border: "border-indigo-500/20", light: "bg-indigo-50" };
            case "Applied": return { bg: "bg-blue-600", text: "text-blue-600", border: "border-blue-500/20", light: "bg-blue-50" };
            case "Interviewing": return { bg: "bg-amber-500", text: "text-amber-600", border: "border-amber-500/20", light: "bg-amber-50" };
            case "Offers":
            case "Offer": return { bg: "bg-emerald-500", text: "text-emerald-600", border: "border-emerald-500/20", light: "bg-emerald-50" };
            case "Rejected": return { bg: "bg-rose-500", text: "text-rose-600", border: "border-rose-500/20", light: "bg-rose-50" };
            case "Withdrawn": return { bg: "bg-zinc-500", text: "text-zinc-600", border: "border-zinc-500/20", light: "bg-zinc-50" };
            default: return { bg: "bg-primary", text: "text-primary", border: "border-primary/20", light: "bg-primary/5" };
        }
    };

    return (
        <>
        <div className="flex gap-6 overflow-x-auto pb-8 min-w-full">
            {BOARD_STATUSES.map((status) => {
                const colors = getStatusColor(status);
                const columnJobs = jobs.filter(j => {
                    if (status === "Offer") return j.status === "Offer" || j.status === "Offers";
                    return j.status === status;
                });
                
                return (
                    <div key={status} className="flex flex-col h-full min-w-[280px] max-w-[340px] flex-1 group/column">
                        {/* Column Header */}
                        <div className="flex items-center justify-between mb-6 px-2">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-[var(--radius-md)] ${colors.bg} flex items-center justify-center text-white shadow-lg shadow-black/5`}>
                                    {status === 'Draft' && <RiFileTextLine size={16} />}
                                    {status === 'Preparing' && <RiMagicLine size={16} />}
                                    {status === 'Tailoring' && <RiMagicLine size={16} />}
                                    {status === 'Applied' && <RiInboxArchiveLine size={16} />}
                                    {status === 'Interviewing' && <RiChat3Line size={16} />}
                                    {(status === 'Offer' || (status as string) === 'Offers') && <RiCheckboxCircleLine size={16} />}
                                    {status === 'Rejected' && <RiCloseCircleLine size={16} />}
                                    {status === 'Withdrawn' && <RiInboxArchiveLine size={16} />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-xs uppercase tracking-wider text-[#0A0A0A] leading-none mb-1">{status}</h3>
                                    <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">{columnJobs.length} {columnJobs.length === 1 ? 'Entry' : 'Entries'}</p>
                                </div>
                            </div>
                            <button className="p-1.5 rounded-[var(--radius-sm)] text-muted-foreground hover:bg-foreground/5 transition-all opacity-0 group-hover/column:opacity-100"><RiMore2Fill size={16} /></button>
                        </div>

                        {/* Column Content */}
                        <div className={`flex-grow p-3 rounded-[var(--radius-xl)] bg-muted/50 border-2 border-dashed border-border-subtle transition-all hover:bg-background/40 hover:border-foreground/5 group/board min-h-[400px]`}>
                            <div className="space-y-4 h-full">
                                {columnJobs.map((job) => (
                                    <div key={job.id} className="bg-white p-5 rounded-[var(--radius-xl)] border border-border-subtle shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all group relative cursor-grab active:cursor-grabbing">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-grow">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className={`w-2 h-2 rounded-full ${colors.bg}`} />
                                                    <p className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                                                        {job.company}
                                                    </p>
                                                </div>
                                                <h4 className="font-black text-sm text-foreground leading-tight tracking-tight max-w-[80%]">{job.position}</h4>
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteJob(job.id)} 
                                                className="w-8 h-8 rounded-[var(--radius-md)] bg-error/10 text-error opacity-0 group-hover:opacity-100 transition-all hover:bg-error hover:text-white flex items-center justify-center -mr-1"
                                            >
                                                <RiDeleteBin6Line size={14} />
                                            </button>
                                        </div>

                                        {(job.salary || job.url || job.resumeId || job.id) && (
                                            <div className="space-y-3 mb-5 p-3.5 bg-[#FAFAFA] rounded-2xl border border-black/[0.02]">
                                                {job.salary && (
                                                    <div className="flex items-center gap-2.5 text-[#171717]">
                                                        <div className="w-5 h-5 rounded-md bg-white border border-black/5 flex items-center justify-center shadow-sm">
                                                            <RiMoneyDollarCircleLine size={12} className="text-primary" />
                                                        </div>
                                                        <span className="text-[0.65rem] font-black tracking-tight">{job.salary}</span>
                                                    </div>
                                                )}
                                                {job.resumeId && (
                                                    <div className="flex items-center gap-2.5 text-[#171717]">
                                                        <div className="w-5 h-5 rounded-md bg-white border border-black/5 flex items-center justify-center shadow-sm">
                                                            <RiFileTextLine size={12} className="text-[#A3A3A3]" />
                                                        </div>
                                                        <span className="text-[0.65rem] font-black tracking-tight truncate max-w-[150px]">
                                                            {resumes.find(r => r.id === job.resumeId)?.title || "Linked Resume"}
                                                        </span>
                                                    </div>
                                                )}
                                                {job.resumeVersionId && (
                                                    <div className="flex items-center gap-2.5 text-[#171717]">
                                                        <div className="w-5 h-5 rounded-md bg-white border border-black/5 flex items-center justify-center shadow-sm">
                                                            <RiMagicLine size={12} className="text-primary" />
                                                        </div>
                                                        <span className="text-[0.65rem] font-black tracking-tight truncate max-w-[150px]">
                                                            {versions.find(v => v.id === job.resumeVersionId)?.title || "Tailored Version"}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Suggestions Review Action Button */}
                                                <button
                                                    onClick={() => setSelectedAppModal({ id: job.id, company: job.company, position: job.position })}
                                                    className="w-full flex items-center justify-between p-2.5 bg-white rounded-xl border border-neutral-200 hover:border-neutral-400 transition-all text-xs font-bold text-[#0A0A0A] shadow-2xs"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <RiMagicLine size={14} className="text-indigo-600" />
                                                        <span>Review suggestions</span>
                                                    </div>
                                                    <RiArrowRightSLine size={14} className="text-neutral-400" />
                                                </button>

                                                {job.url && (
                                                    <a href={job.url.startsWith('http') ? job.url : `https://${job.url}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between w-full p-2 bg-white rounded-[var(--radius-md)] border border-border-subtle hover:border-primary transition-all group/link">
                                                        <div className="flex items-center gap-2">
                                                            <RiExternalLinkLine size={12} className="text-muted-foreground/60" />
                                                            <span className="text-[0.6rem] font-black text-muted-foreground uppercase tracking-widest">Listing</span>
                                                        </div>
                                                        <RiArrowRightSLine size={14} className="text-[#A3A3A3] group-hover/link:text-primary group-hover/link:translate-x-0.5 transition-all" />
                                                    </a>
                                                )}
                                            </div>
                                        )}


                                        <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                                            <div className="relative">
                                                <select 
                                                    value={job.status} 
                                                    onChange={(e) => handleUpdateStatus(job.id, e.target.value as Job["status"])}
                                                    className={`text-[0.6rem] font-black uppercase tracking-widest pl-2 pr-8 py-1.5 rounded-[var(--radius-md)] ${colors.light} ${colors.text} border border-transparent hover:border-current transition-all appearance-none outline-none cursor-pointer`}
                                                >
                                                    {BOARD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                                <RiArrowDropDownLine size={16} className={`absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none ${colors.text}`} />
                                            </div>
                                            <div className="flex items-center gap-1 text-muted-foreground/60">
                                                <RiCalendarEventLine size={10} />
                                                <p className="text-[0.55rem] font-black uppercase tracking-tighter">
                                                    {formatRelativeTime(job.updatedAt)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {status === 'Applied' && (
                                    <div className="px-1 pt-2">
                                        {isAdding ? (
                                            <m.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="bg-white p-5 rounded-[2rem] border border-primary/20 shadow-2xl shadow-black/5 space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-[0.6rem] font-black text-[#A3A3A3] uppercase tracking-widest ml-1">Company & Role</label>
                                                    <input autoFocus type="text" placeholder="Company..." className="w-full text-xs font-black p-3.5 bg-[#F5F5F5] rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-[#A3A3A3]" value={newJob.company} onChange={(e) => setNewJob({...newJob, company: e.target.value})} />
                                                    <input type="text" placeholder="Position..." className="w-full text-xs font-black p-3.5 bg-[#F5F5F5] rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-[#A3A3A3]" value={newJob.position} onChange={(e) => setNewJob({...newJob, position: e.target.value})} />
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-2">
                                                        <label className="text-[0.6rem] font-black text-[#A3A3A3] uppercase tracking-widest ml-1">Salary</label>
                                                        <input type="text" placeholder="$120k..." className="w-full text-xs font-black p-3.5 bg-[#F5F5F5] rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-[#A3A3A3]" value={newJob.salary} onChange={(e) => setNewJob({...newJob, salary: e.target.value})} />
                                                    </div>
                                                    
                                                    <div className="flex items-center justify-between relative">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-[var(--radius-md)] bg-gradient-to-tr from-primary to-primary-dark flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                                                <RiMagicLine size={16} />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-[0.65rem] font-black text-foreground uppercase tracking-[0.2em] leading-none mb-1">Magic Scrape</h4>
                                                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">AI Auto-fill from URL</p>
                                                            </div>
                                                        </div>
                                                        {isScraping && (
                                                            <div className="flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-full border border-primary/10">
                                                                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                                                                <span className="text-[8px] font-black text-primary uppercase tracking-widest">Processing</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex gap-2.5 relative">
                                                        <div className="flex-grow relative group/input">
                                                            <input 
                                                                type="text" 
                                                                placeholder="Paste LinkedIn or Indeed URL..." 
                                                                className="w-full text-[11px] font-bold p-4 bg-white rounded-[var(--radius-lg)] border border-border-subtle focus:border-primary/30 focus:ring-8 focus:ring-primary/[0.02] transition-all outline-none shadow-sm placeholder:text-muted-foreground/60"
                                                                value={scrapeUrl}
                                                                onChange={(e) => setScrapeUrl(e.target.value)}
                                                            />
                                                            {scrapeUrl && !isScraping && (
                                                                <button 
                                                                    onClick={() => setScrapeUrl("")}
                                                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                                                                >
                                                                    <RiCloseCircleLine size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <button 
                                                            onClick={handleScrape}
                                                            disabled={isScraping || !scrapeUrl}
                                                            className={`h-12 px-6 rounded-[var(--radius-lg)] flex items-center justify-center transition-all shadow-xl ${
                                                                isScraping 
                                                                ? 'bg-foreground text-background cursor-wait' 
                                                                : scrapeUrl 
                                                                    ? 'bg-primary text-white hover:bg-primary-dark hover:-translate-y-0.5 shadow-primary/20' 
                                                                    : 'bg-white text-muted-foreground cursor-not-allowed border border-border-subtle opacity-50'
                                                            }`}
                                                        >
                                                            {isScraping ? <RiLoader4Line size={20} className="animate-spin" /> : <RiArrowRightLine size={20} />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[0.6rem] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Basic Info</label>
                                                        <div className="space-y-2">
                                                            <div className="relative">
                                                                <input type="text" placeholder="Company Name" className="w-full text-xs font-black p-4 pl-11 bg-muted rounded-[var(--radius-lg)] border-none focus:ring-2 focus:ring-primary/20 transition-all outline-none" value={newJob.company} onChange={(e) => setNewJob({...newJob, company: e.target.value})} />
                                                                <RiBriefcase4Line size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                                            </div>
                                                            <div className="relative">
                                                                <input type="text" placeholder="Job Position" className="w-full text-xs font-black p-4 pl-11 bg-muted rounded-[var(--radius-lg)] border-none focus:ring-2 focus:ring-primary/20 transition-all outline-none" value={newJob.position} onChange={(e) => setNewJob({...newJob, position: e.target.value})} />
                                                                <RiMagicLine size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-2">
                                                            <label className="text-[0.6rem] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Salary</label>
                                                            <div className="relative">
                                                                <input type="text" placeholder="$120k+" className="w-full text-xs font-black p-4 pl-11 bg-muted rounded-[var(--radius-lg)] border-none focus:ring-2 focus:ring-primary/20 transition-all outline-none" value={newJob.salary} onChange={(e) => setNewJob({...newJob, salary: e.target.value})} />
                                                                <RiMoneyDollarCircleLine size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[0.6rem] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Location</label>
                                                            <div className="relative">
                                                                <input type="text" placeholder="Remote / NY" className="w-full text-xs font-black p-4 pl-11 bg-muted rounded-[var(--radius-lg)] border-none focus:ring-2 focus:ring-primary/20 transition-all outline-none" value={newJob.location} onChange={(e) => setNewJob({...newJob, location: e.target.value})} />
                                                                <RiMapPin2Line size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-[0.6rem] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Additional Details</label>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <input type="text" placeholder="Job Type (Full-time)" className="w-full text-xs font-black p-4 bg-muted rounded-[var(--radius-lg)] border-none focus:ring-2 focus:ring-primary/20 transition-all outline-none" value={newJob.jobType} onChange={(e) => setNewJob({...newJob, jobType: e.target.value})} />
                                                            <input type="text" placeholder="URL (Optional)" className="w-full text-xs font-black p-4 bg-muted rounded-[var(--radius-lg)] border-none focus:ring-2 focus:ring-primary/20 transition-all outline-none" value={newJob.url} onChange={(e) => setNewJob({...newJob, url: e.target.value})} />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-[0.6rem] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Job Description</label>
                                                        <textarea 
                                                            placeholder="Brief summary of the role..." 
                                                            className="w-full text-xs font-black p-4 bg-muted rounded-[var(--radius-lg)] border-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[80px] resize-none outline-none" 
                                                            value={newJob.description} 
                                                            onChange={(e) => setNewJob({...newJob, description: e.target.value})} 
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[0.6rem] font-black text-[#A3A3A3] uppercase tracking-widest ml-1">Attach Resume or Version</label>
                                                    <div className="relative">
                                                        <select 
                                                            className="w-full bg-[#F5F5F5] border-none rounded-2xl p-3.5 pl-10 text-xs font-black appearance-none cursor-pointer hover:bg-black/5 transition-all" 
                                                            value={newJob.resumeVersionId ? `v:${newJob.resumeVersionId}` : (newJob.resumeId || "")} 
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                if (val.startsWith("v:")) {
                                                                    setNewJob({...newJob, resumeVersionId: val.replace("v:", ""), resumeId: ""});
                                                                } else {
                                                                    setNewJob({...newJob, resumeId: val, resumeVersionId: ""});
                                                                }
                                                            }}
                                                        >
                                                            <option value="">No Resume Linked</option>
                                                            <optgroup label="Base Resumes">
                                                                {resumes.map((r) => (<option key={r.id} value={r.id}>{r.title}</option>))}
                                                            </optgroup>
                                                            {versions.length > 0 && (
                                                                <optgroup label="Tailored Versions">
                                                                    {versions.map((v) => (
                                                                        <option key={v.id} value={`v:${v.id}`}>
                                                                            {v.title} {v.company ? `@ ${v.company}` : ""}
                                                                        </option>
                                                                    ))}
                                                                </optgroup>
                                                            )}
                                                        </select>
                                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A3A3A3]">
                                                            {newJob.resumeVersionId ? <RiMagicLine size={16} /> : <RiFileTextLine size={16} />}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 pt-2">
                                                    <button onClick={handleAddJob} disabled={loading} className="flex-grow h-12 bg-foreground text-background rounded-[var(--radius-lg)] text-xs font-black uppercase tracking-widest hover:bg-secondary transition-all disabled:opacity-50">
                                                        {loading ? "..." : "Add application"}
                                                    </button>
                                                    <button onClick={() => setIsAdding(false)} className="h-12 px-5 bg-muted text-muted-foreground rounded-[var(--radius-lg)] text-xs font-black uppercase tracking-widest hover:text-foreground hover:bg-border-subtle transition-all">
                                                        <RiCloseCircleLine size={20} />
                                                    </button>
                                                </div>
                                            </m.div>
                                        ) : (
                                            <button 
                                                onClick={() => setIsAdding(true)}
                                                className="w-full py-10 border-2 border-dashed border-black/[0.06] rounded-[2rem] text-[0.65rem] font-black uppercase tracking-[0.2em] text-[#A3A3A3] hover:bg-white hover:border-primary/20 hover:text-primary transition-all flex flex-col items-center justify-center gap-4 group/add"
                                            >
                                                <div className="w-12 h-12 rounded-2xl bg-black/[0.02] group-hover/add:bg-primary/10 flex items-center justify-center transition-colors">
                                                    <RiAddLine size={24} className="group-hover/add:rotate-90 transition-transform" />
                                                </div>
                                                <span>Add application</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>

        {selectedAppModal && (
            <ApplicationSuggestionsModal
                applicationId={selectedAppModal.id}
                company={selectedAppModal.company}
                position={selectedAppModal.position}
                isOpen={!!selectedAppModal}
                onCloseAction={() => setSelectedAppModal(null)}
            />
        )}
        </>
    );
}

