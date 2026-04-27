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
    RiCalendarEventLine
} from "react-icons/ri";
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

export function JobBoard({ initialJobs, resumes = [] }: { initialJobs: Job[], resumes?: { id: string; title: string }[] }) {
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

    const getStatusColor = (status: Job["status"]) => {
        switch (status) {
            case "Applied": return { bg: "bg-blue-500", text: "text-blue-500", border: "border-blue-500/20", light: "bg-blue-50" };
            case "Interviewing": return { bg: "bg-amber-500", text: "text-amber-500", border: "border-amber-500/20", light: "bg-amber-50" };
            case "Offers": return { bg: "bg-emerald-500", text: "text-emerald-500", border: "border-emerald-500/20", light: "bg-emerald-50" };
            case "Rejected": return { bg: "bg-rose-500", text: "text-rose-500", border: "border-rose-500/20", light: "bg-rose-50" };
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
            {STATUSES.map((status) => {
                const colors = getStatusColor(status);
                const columnJobs = jobs.filter(j => j.status === status);
                
                return (
                    <div key={status} className="flex flex-col h-full min-h-[600px] group/column">
                        {/* Column Header */}
                        <div className="flex items-center justify-between mb-6 px-2">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-xl ${colors.bg} flex items-center justify-center text-white shadow-lg shadow-black/5`}>
                                    {status === 'Applied' && <RiInboxArchiveLine size={16} />}
                                    {status === 'Interviewing' && <RiChat3Line size={16} />}
                                    {status === 'Offers' && <RiCheckboxCircleLine size={16} />}
                                    {status === 'Rejected' && <RiCloseCircleLine size={16} />}
                                </div>
                                <div>
                                    <h3 className="font-black text-[0.65rem] uppercase tracking-widest text-[#171717] leading-none mb-1">{status}</h3>
                                    <p className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-tighter">{columnJobs.length} {columnJobs.length === 1 ? 'Entry' : 'Entries'}</p>
                                </div>
                            </div>
                            <button className="p-1.5 rounded-lg text-[#A3A3A3] hover:bg-black/5 transition-all opacity-0 group-hover/column:opacity-100"><RiMore2Fill size={16} /></button>
                        </div>

                        {/* Column Content */}
                        <div className={`flex-grow p-3 rounded-[2rem] bg-[#F5F5F5]/50 border-2 border-dashed border-black/[0.03] transition-all hover:bg-white/40 hover:border-black/5 group/board min-h-[400px]`}>
                            <div className="space-y-4 h-full">
                                {columnJobs.map((job) => (
                                    <div key={job.id} className="bg-white p-5 rounded-3xl border border-black/[0.04] shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all group relative cursor-grab active:cursor-grabbing">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-grow">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className={`w-2 h-2 rounded-full ${colors.bg}`} />
                                                    <p className="text-[0.65rem] font-bold text-[#A3A3A3] uppercase tracking-widest leading-none">
                                                        {job.company}
                                                    </p>
                                                </div>
                                                <h4 className="font-black text-sm text-[#0A0A0A] leading-tight tracking-tight max-w-[80%]">{job.position}</h4>
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteJob(job.id)} 
                                                className="w-8 h-8 rounded-xl bg-rose-50 text-rose-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white flex items-center justify-center -mr-1"
                                            >
                                                <RiDeleteBin6Line size={14} />
                                            </button>
                                        </div>

                                        {(job.salary || job.url || job.resumeId) && (
                                            <div className="space-y-3 mb-5 p-3.5 bg-[#FAFAFA] rounded-2xl border border-black/[0.02]">
                                                {job.salary && (
                                                    <div className="flex items-center gap-2.5 text-[#171717]">
                                                        <div className="w-5 h-5 rounded-md bg-white border border-black/5 flex items-center justify-center shadow-sm">
                                                            <RiMoneyDollarCircleLine size={12} className="text-[#3B82F6]" />
                                                        </div>
                                                        <span className="text-[0.65rem] font-black tracking-tight">{job.salary}</span>
                                                    </div>
                                                )}
                                                {job.resumeId && (
                                                    <div className="flex items-center gap-2.5 text-[#171717]">
                                                        <div className="w-5 h-5 rounded-md bg-white border border-black/5 flex items-center justify-center shadow-sm">
                                                            <RiFileTextLine size={12} className="text-emerald-500" />
                                                        </div>
                                                        <span className="text-[0.65rem] font-black tracking-tight truncate max-w-[150px]">
                                                            {resumes.find(r => r.id === job.resumeId)?.title || "Linked Resume"}
                                                        </span>
                                                    </div>
                                                )}
                                                {job.url && (
                                                    <a href={job.url.startsWith('http') ? job.url : `https://${job.url}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between w-full p-2 bg-white rounded-xl border border-black/5 hover:border-[#3B82F6] transition-all group/link">
                                                        <div className="flex items-center gap-2">
                                                            <RiExternalLinkLine size={12} className="text-[#A3A3A3]" />
                                                            <span className="text-[0.6rem] font-black text-[#737373] uppercase tracking-widest">Listing</span>
                                                        </div>
                                                        <RiArrowRightSLine size={14} className="text-[#A3A3A3] group-hover/link:text-[#3B82F6] group-hover/link:translate-x-0.5 transition-all" />
                                                    </a>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between pt-4 border-t border-black/[0.04]">
                                            <div className="relative">
                                                <select 
                                                    value={job.status} 
                                                    onChange={(e) => handleUpdateStatus(job.id, e.target.value as Job["status"])}
                                                    className={`text-[0.6rem] font-black uppercase tracking-widest pl-2 pr-8 py-1.5 rounded-lg ${colors.light} ${colors.text} border border-transparent hover:border-current transition-all appearance-none outline-none cursor-pointer`}
                                                >
                                                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                                <RiArrowDropDownLine size={16} className={`absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none ${colors.text}`} />
                                            </div>
                                            <div className="flex items-center gap-1 text-[#A3A3A3]">
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
                                            <m.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="bg-white p-5 rounded-[2rem] border border-[#3B82F6]/20 shadow-2xl shadow-blue-500/10 space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-[0.6rem] font-black text-[#A3A3A3] uppercase tracking-widest ml-1">Company & Role</label>
                                                    <input autoFocus type="text" placeholder="Company..." className="w-full text-xs font-black p-3.5 bg-[#F5F5F5] rounded-2xl border-none focus:ring-2 focus:ring-[#3B82F6]/20 transition-all placeholder:text-[#A3A3A3]" value={newJob.company} onChange={(e) => setNewJob({...newJob, company: e.target.value})} />
                                                    <input type="text" placeholder="Position..." className="w-full text-xs font-black p-3.5 bg-[#F5F5F5] rounded-2xl border-none focus:ring-2 focus:ring-[#3B82F6]/20 transition-all placeholder:text-[#A3A3A3]" value={newJob.position} onChange={(e) => setNewJob({...newJob, position: e.target.value})} />
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-2">
                                                        <label className="text-[0.6rem] font-black text-[#A3A3A3] uppercase tracking-widest ml-1">Salary</label>
                                                        <input type="text" placeholder="$120k..." className="w-full text-xs font-black p-3.5 bg-[#F5F5F5] rounded-2xl border-none focus:ring-2 focus:ring-[#3B82F6]/20 transition-all placeholder:text-[#A3A3A3]" value={newJob.salary} onChange={(e) => setNewJob({...newJob, salary: e.target.value})} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[0.6rem] font-black text-[#A3A3A3] uppercase tracking-widest ml-1">URL</label>
                                                        <input type="text" placeholder="Listing..." className="w-full text-xs font-black p-3.5 bg-[#F5F5F5] rounded-2xl border-none focus:ring-2 focus:ring-[#3B82F6]/20 transition-all placeholder:text-[#A3A3A3]" value={newJob.url} onChange={(e) => setNewJob({...newJob, url: e.target.value})} />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[0.6rem] font-black text-[#A3A3A3] uppercase tracking-widest ml-1">Attach Resume</label>
                                                    <div className="relative">
                                                        <select className="w-full bg-[#F5F5F5] border-none rounded-2xl p-3.5 pl-10 text-xs font-black appearance-none cursor-pointer hover:bg-black/5 transition-all" value={newJob.resumeId || ""} onChange={(e) => setNewJob({...newJob, resumeId: e.target.value})}>
                                                            <option value="">No Resume Linked</option>
                                                            {resumes.map((r: any) => (<option key={r.id} value={r.id}>{r.title}</option>))}
                                                        </select>
                                                        <RiFileTextLine size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 pt-2">
                                                    <button onClick={handleAddJob} disabled={loading} className="flex-grow h-12 bg-[#0A0A0A] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#262626] transition-all disabled:opacity-50">
                                                        {loading ? "..." : "Create Entry"}
                                                    </button>
                                                    <button onClick={() => setIsAdding(false)} className="h-12 px-5 bg-[#F5F5F5] text-[#A3A3A3] rounded-2xl text-xs font-black uppercase tracking-widest hover:text-[#0A0A0A] hover:bg-[#E5E5E5] transition-all">
                                                        <RiCloseCircleLine size={20} />
                                                    </button>
                                                </div>
                                            </m.div>
                                        ) : (
                                            <button 
                                                onClick={() => setIsAdding(true)}
                                                className="w-full py-10 border-2 border-dashed border-black/[0.06] rounded-[2rem] text-[0.65rem] font-black uppercase tracking-[0.2em] text-[#A3A3A3] hover:bg-white hover:border-[#3B82F6]/20 hover:text-[#3B82F6] transition-all flex flex-col items-center justify-center gap-4 group/add"
                                            >
                                                <div className="w-12 h-12 rounded-2xl bg-black/[0.02] group-hover/add:bg-[#3B82F6]/10 flex items-center justify-center transition-colors">
                                                    <RiAddLine size={24} className="group-hover/add:rotate-90 transition-transform" />
                                                </div>
                                                <span>New Job Entry</span>
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
    );
}
