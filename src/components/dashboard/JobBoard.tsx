"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  RiArrowDownSLine,
  RiArrowRightLine,
  RiDeleteBin6Line,
  RiExternalLinkLine,
  RiFileTextLine,
  RiSearchLine,
} from "react-icons/ri";
import { formatRelativeTime } from "@/lib/utils";
import type { ApplicationStatus } from "@/lib/application-state-machine";

export const BOARD_STATUSES = [
  "Draft", "Preparing", "Ready", "Applied", "Interviewing", "Offer", "Rejected", "Withdrawn",
] as const;

export type BoardStatus = (typeof BOARD_STATUSES)[number];
export type Job = {
  id: string;
  recordType?: "application" | "job";
  company: string;
  position: string;
  status: BoardStatus | ApplicationStatus | "Offers";
  salary?: string | null;
  url?: string | null;
  location?: string | null;
  description?: string | null;
  resumeId?: string | null;
  resumeVersionId?: string | null;
  deadline?: string | null;
  updatedAt: string;
};

type Filter = "All" | "Active" | "Applied" | "Interviewing" | "Closed";
const FILTERS: Filter[] = ["All", "Active", "Applied", "Interviewing", "Closed"];

function matchesFilter(status: string, filter: Filter) {
  if (filter === "All") return true;
  if (filter === "Active") return ["Draft", "Preparing", "Ready"].includes(status);
  if (filter === "Closed") return ["Offer", "Offers", "Rejected", "Withdrawn"].includes(status);
  return status === filter;
}

function statusClasses(status: string) {
  if (["Offer", "Offers"].includes(status)) return "bg-emerald-50 text-emerald-700";
  if (status === "Interviewing") return "bg-amber-50 text-amber-700";
  if (["Rejected", "Withdrawn"].includes(status)) return "bg-rose-50 text-rose-700";
  if (status === "Applied") return "bg-blue-50 text-blue-700";
  return "bg-neutral-100 text-neutral-700";
}

export function JobBoard({ initialJobs, resumes = [], versions = [] }: {
  initialJobs: Job[];
  resumes?: { id: string; title: string }[];
  versions?: { id: string; title: string; company: string | null; targetRole: string | null }[];
}) {
  const [jobs, setJobs] = useState(initialJobs);
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const visibleJobs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return jobs.filter((job) => matchesFilter(String(job.status), filter) && (!normalized || `${job.company} ${job.position}`.toLowerCase().includes(normalized)));
  }, [filter, jobs, query]);

  const linkedResume = (job: Job) => {
    if (job.resumeVersionId) return versions.find((item) => item.id === job.resumeVersionId)?.title || "Tailored version";
    if (job.resumeId) return resumes.find((item) => item.id === job.resumeId)?.title || "Linked resume";
    return "Not selected";
  };

  const updateStatus = async (id: string, status: Job["status"]) => {
    const previous = jobs;
    const job = jobs.find((item) => item.id === id);
    if (!job) return;
    setJobs((items) => items.map((job) => job.id === id ? { ...job, status } : job));
    try {
      const endpoint = job.recordType === "job" ? "/api/jobs" : "/api/applications";
      const response = await fetch(endpoint, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
      if (!response.ok) setJobs(previous);
    } catch {
      setJobs(previous);
    }
  };

  const removeJob = async (id: string) => {
    if (!window.confirm("Delete this application? This cannot be undone.")) return;
    const job = jobs.find((item) => item.id === id);
    if (!job) return;
    setBusyId(id);
    try {
      const response = job.recordType === "job"
        ? await fetch("/api/jobs", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
        : await fetch(`/api/applications?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (response.ok) setJobs((items) => items.filter((job) => job.id !== id));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="overflow-hidden rounded-[var(--radius-xl)] border border-border-subtle bg-white shadow-[var(--shadow-sm)]">
      <div className="flex flex-col gap-4 border-b border-border-subtle p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
          {FILTERS.map((item) => (
            <button key={item} onClick={() => setFilter(item)} className={`whitespace-nowrap rounded-[var(--radius-md)] px-3 py-2 text-xs font-semibold transition-colors ${filter === item ? "bg-foreground text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              {item}
            </button>
          ))}
        </div>
        <label className="relative block w-full sm:w-64">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search company or role" className="w-full rounded-[var(--radius-md)] border border-border-subtle bg-muted/60 py-2.5 pl-9 pr-3 text-xs font-medium outline-none transition focus:border-neutral-300 focus:bg-white" />
        </label>
      </div>

      {visibleJobs.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <p className="text-sm font-bold text-foreground">No applications found</p>
          <p className="mt-1 text-xs text-muted-foreground">Change the filter or add a new opportunity.</p>
        </div>
      ) : (
        <>
          <div className="hidden grid-cols-[minmax(240px,2fr)_150px_minmax(180px,1fr)_120px_80px] gap-4 border-b border-border-subtle bg-muted/40 px-5 py-3 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground md:grid">
            <span>Company & role</span><span>Status</span><span>Resume</span><span>Updated</span><span className="text-right">Actions</span>
          </div>
          <div className="divide-y divide-border-subtle">
            {visibleJobs.map((job) => {
              const detailHref = job.recordType === "job" ? null : `/dashboard/applications/${job.id}`;
              return (
              <article key={job.id} className="group relative p-5 transition-colors hover:bg-muted/30 md:grid md:grid-cols-[minmax(240px,2fr)_150px_minmax(180px,1fr)_120px_80px] md:items-center md:gap-4">
                {detailHref ? <Link href={detailHref} className="absolute inset-0" aria-label={`Open ${job.position} at ${job.company}`} /> : null}
                <div className="relative pointer-events-none min-w-0">
                  <div className="flex items-center gap-2"><span className="h-2 w-2 shrink-0 rounded-full bg-foreground" /><p className="truncate text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{job.company}</p></div>
                  <h2 className="mt-1 truncate text-sm font-bold text-foreground">{job.position}</h2>
                  {job.deadline ? <p className="mt-1 text-xs text-muted-foreground">Deadline {new Date(job.deadline).toLocaleDateString()}</p> : null}
                </div>
                <div className="relative z-10 mt-4 md:mt-0">
                  <div className="relative inline-block">
                    <select value={job.status} onChange={(event) => updateStatus(job.id, event.target.value as Job["status"])} className={`appearance-none rounded-full py-1.5 pl-3 pr-8 text-xs font-semibold outline-none ${statusClasses(String(job.status))}`}>
                      {BOARD_STATUSES.map((status) => <option key={status}>{status}</option>)}
                    </select>
                    <RiArrowDownSLine className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" size={14} />
                  </div>
                </div>
                <div className="relative pointer-events-none mt-3 flex min-w-0 items-center gap-2 text-xs text-muted-foreground md:mt-0"><RiFileTextLine className="shrink-0" size={15} /><span className="truncate">{linkedResume(job)}</span></div>
                <p className="relative pointer-events-none mt-3 text-xs text-muted-foreground md:mt-0">{formatRelativeTime(job.updatedAt)}</p>
                <div className="relative z-10 mt-4 flex items-center justify-end gap-1 md:mt-0">
                  {detailHref ? (
                    <Link href={detailHref} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Open application"><RiArrowRightLine size={16} /></Link>
                  ) : job.url ? (
                    <a href={job.url} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Open job listing"><RiExternalLinkLine size={16} /></a>
                  ) : null}
                  <button disabled={busyId === job.id} onClick={() => removeJob(job.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40" aria-label="Delete application"><RiDeleteBin6Line size={16} /></button>
                </div>
              </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
