"use client";

import React, { useState } from "react";
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
    RiFileAddLine,
    RiInformationLine,
    RiMagicLine,
    RiBookOpenLine,
    RiFileTextLine
} from "react-icons/ri";
import { useRouter } from "next/navigation";
import { formatRelativeTime } from "@/lib/utils";

type Job = {
    id: string;
    company: string;
    position: string;
    status: "Applied" | "Interviewing" | "Offers" | "Rejected";
    salary?: string | null;
    url?: string | null;
    resumeId?: string | null;
    updatedAt: string;
};

const STATUSES = ["Applied", "Interviewing", "Offers", "Rejected"] as const;

export function JobBoard({ initialJobs, resumes = [] }: { initialJobs: Job[], resumes?: any[] }) {
    const [jobs, setJobs] = useState<Job[]>(initialJobs);
    const [isAdding, setIsAdding] = useState(false);
    const [newJob, setNewJob] = useState({ 
        company: "", 
        position: "", 
        status: "Applied" as Job["status"],
        salary: "",
        url: "",
        resumeId: ""
    });
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleAddJob = async () => {
        if (!newJob.company || !newJob.position) return;
        setLoading(true);
        try {
            const res = await fetch("/api/jobs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newJob),
            });
            const data = await res.json();
            if (data.success) {
                const addedJob: Job = { 
                    ...newJob, 
                    id: data.id, 
                    updatedAt: new Date().toISOString() 
                };
                setJobs([addedJob, ...jobs]);
                setNewJob({ company: "", position: "", status: "Applied", salary: "", url: "", resumeId: "" });
                setIsAdding(false);
            }
        } catch (error) {
            console.error("Add Job Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: Job["status"]) => {
        try {
            const res = await fetch("/api/jobs", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status }),
            });
            if (res.ok) {
                setJobs(jobs.map(j => j.id === id ? { ...j, status } : j));
            }
        } catch (error) {
            console.error("Update Status Error:", error);
        }
    };

    const handleDeleteJob = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            const res = await fetch("/api/jobs", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            if (res.ok) {
                setJobs(jobs.filter(j => j.id !== id));
            }
        } catch (error) {
            console.error("Delete Job Error:", error);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {STATUSES.map((status) => (
                <div key={status} className="bg-white/30 backdrop-blur-md rounded-2xl border border-white/50 p-5 shadow-sm min-h-[500px] flex flex-col group/column transition-all hover:bg-white/40">
                    <div className="flex items-center justify-between mb-6 pb-3 border-b border-black/5">
                        <h3 className="font-bold text-[0.7rem] uppercase tracking-widest text-black/60 flex items-center gap-2">
                            {status === 'Applied' && <RiInboxArchiveLine size={16} className="text-black/40" />}
                            {status === 'Interviewing' && <RiChat3Line size={16} className="text-black/40" />}
                            {status === 'Offers' && <RiCheckboxCircleLine size={16} className="text-black/40" />}
                            {status === 'Rejected' && <RiCloseCircleLine size={16} className="text-black/40" />}
                            {status}
                        </h3>
                        <span className="text-[0.65rem] font-bold text-black/40 bg-black/5 px-2 py-0.5 rounded-full">
                            {jobs.filter(j => j.status === status).length}
                        </span>
                    </div>

                    <div className="space-y-4 flex-grow overflow-y-auto pb-4 max-h-[600px] no-scrollbar">
                        {jobs.filter(j => j.status === status).map((job) => (
                            <div key={job.id} className="bg-white/60 backdrop-blur-sm p-5 rounded-xl border border-white/80 hover:border-black/10 hover:shadow-lg transition-all group relative">
                                <div className="flex items-start justify-between mb-3">
                                    <h4 className="font-black text-sm text-black/80 leading-tight tracking-tight">{job.position}</h4>
                                    <button onClick={() => handleDeleteJob(job.id)} className="text-black/10 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                        <RiDeleteBin6Line size={16} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 mb-4">
                                    <RiBriefcase4Line size={12} className="text-black/30" />
                                    <p className="text-xs text-black/50 font-bold tracking-tight">{job.company}</p>
                                </div>

                                 {(job.salary || job.url) && (
                                    <div className="flex flex-col gap-1.5 mb-4 px-3 py-3 bg-black/5 rounded-xl border border-white/20">
                                        {job.salary && (
                                            <div className="flex items-center gap-2 text-black/60">
                                                <RiMoneyDollarCircleLine size={14} className="text-black/30" />
                                                <span className="text-[0.7rem] font-black">{job.salary}</span>
                                            </div>
                                        )}
                                        {job.url && (
                                            <a 
                                                href={job.url.startsWith('http') ? job.url : `https://${job.url}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="flex items-center gap-2 text-black/60 hover:text-black transition-colors group/link"
                                            >
                                                <RiExternalLinkLine size={14} className="text-black/30 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                                                <span className="text-[0.7rem] font-black underline decoration-black/10 underline-offset-4">View Listing</span>
                                            </a>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center justify-between mt-auto pt-3 border-t border-black/5">
                                    <select 
                                        value={job.status} 
                                        onChange={(e) => handleUpdateStatus(job.id, e.target.value as Job["status"])}
                                        className="text-[0.6rem] font-black uppercase tracking-wider bg-black/5 px-2 py-1.5 rounded-lg text-black/40 focus:outline-none cursor-pointer border-none hover:bg-black/10 transition-colors"
                                    >
                                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <p className="text-[0.6rem] text-black/30 font-black uppercase tracking-tighter">
                                        {formatRelativeTime(job.updatedAt)}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {status === 'Applied' && (
                            <div className="mt-2">
                                {isAdding ? (
                                    <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-white shadow-xl animate-in fade-in zoom-in-95">
                                        <input 
                                            autoFocus
                                            type="text" 
                                            placeholder="Company name..."
                                            className="w-full text-xs font-black mb-2 p-3 bg-black/5 rounded-xl border-none focus:ring-0 placeholder:text-black/20"
                                            value={newJob.company}
                                            onChange={(e) => setNewJob({...newJob, company: e.target.value})}
                                        />
                                        <input 
                                            type="text" 
                                            placeholder="Position / Role..."
                                            className="w-full text-xs mb-2 p-3 bg-black/5 rounded-xl border-none focus:ring-0 text-black font-black placeholder:text-black/20"
                                            value={newJob.position}
                                            onChange={(e) => setNewJob({...newJob, position: e.target.value})}
                                        />
                                         <div className="grid grid-cols-2 gap-2 mb-3">
                                            <div className="relative flex items-center">
                                                <RiMoneyDollarCircleLine size={16} className="absolute left-3 text-black/20" />
                                                <input 
                                                    type="text" 
                                                    placeholder="Salary..."
                                                    className="w-full text-[0.7rem] pl-10 p-2.5 bg-black/5 rounded-xl border-none focus:ring-0 text-black font-black placeholder:text-black/20"
                                                    value={newJob.salary}
                                                    onChange={(e) => setNewJob({...newJob, salary: e.target.value})}
                                                />
                                            </div>
                                            <div className="relative flex items-center">
                                                <RiExternalLinkLine size={16} className="absolute left-3 text-black/20" />
                                                <input 
                                                    type="text" 
                                                    placeholder="URL..."
                                                    className="w-full text-[0.7rem] pl-10 p-2.5 bg-black/5 rounded-xl border-none focus:ring-0 text-black font-black placeholder:text-black/20"
                                                    value={newJob.url}
                                                    onChange={(e) => setNewJob({...newJob, url: e.target.value})}
                                                />
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <label className="text-[0.6rem] font-black uppercase tracking-widest text-black/30 mb-2 block ml-1">
                                                Linked Resume
                                            </label>
                                            <div className="relative">
                                                <select 
                                                    className="w-full bg-black/5 border-none rounded-xl px-4 py-3 pl-10 text-[0.7rem] font-black outline-none appearance-none cursor-pointer hover:bg-black/10 transition-colors"
                                                    value={newJob.resumeId || ""}
                                                    onChange={(e) => setNewJob({...newJob, resumeId: e.target.value})}
                                                >
                                                    <option value="">No Resume Linked</option>
                                                    {resumes.map((r: any) => (
                                                        <option key={r.id} value={r.id}>{r.title}</option>
                                                    ))}
                                                </select>
                                                <RiFileTextLine size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-black/20" />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={handleAddJob}
                                                disabled={loading}
                                                className="flex-grow bg-black text-white py-3 rounded-xl text-[0.75rem] font-black hover:bg-black/80 transition-all shadow-lg active:scale-[0.98]"
                                            >
                                                {loading ? "..." : "Create Job"}
                                            </button>
                                            <button 
                                                onClick={() => setIsAdding(false)}
                                                className="px-4 py-3 bg-black/5 rounded-xl text-[0.75rem] font-black text-black/40 hover:bg-black/10 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setIsAdding(true)}
                                        className="w-full border-2 border-dashed border-black/5 rounded-2xl py-6 text-[0.7rem] font-black uppercase tracking-widest text-black/20 hover:bg-white/40 hover:border-black/10 hover:text-black/40 transition-all flex flex-col items-center justify-center gap-2 group/add"
                                    >
                                        <RiAddLine size={24} className="group-hover/add:rotate-90 transition-transform text-black/10 group-hover/add:text-black/20" />
                                        <span>Add Job Entry</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
