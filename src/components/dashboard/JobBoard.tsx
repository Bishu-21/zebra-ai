"use client";

import { useMemo, useState } from "react";
import { useDemoWorkspace } from "@/context/DemoWorkspaceContext";
import { DashboardHref } from "@/components/dashboard/DashboardLink";
import {
  RiArrowDownSLine,
  RiArrowRightLine,
  RiDeleteBinLine,
  RiLink,
  RiFileTextLine,
  RiSearchLine,
} from "react-icons/ri";
import { AppIcon } from "@/components/ui/AppIcon";
import { featureChrome } from "@/components/dashboard/feature-chrome";
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
  const demo = useDemoWorkspace();
  const [jobs, setJobs] = useState(initialJobs);
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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
    setActionError(null);
    if (demo) return;
    try {
      const endpoint = job.recordType === "job" ? "/api/jobs" : "/api/applications";
      const response = await fetch(endpoint, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
      if (!response.ok) {
        setJobs(previous);
        const payload = await response.json().catch(() => ({}));
        setActionError(typeof payload.error === "string" ? payload.error : "Could not update application status.");
      }
    } catch {
      setJobs(previous);
      setActionError("Could not update application status. Check your connection and try again.");
    }
  };

  const removeJob = async (id: string) => {
    if (!window.confirm("Delete this application? This cannot be undone.")) return;
    const job = jobs.find((item) => item.id === id);
    if (!job) return;
    if (demo) {
      setJobs((items) => items.filter((item) => item.id !== id));
      return;
    }
    setBusyId(id);
    setActionError(null);
    try {
      const response = job.recordType === "job"
        ? await fetch("/api/jobs", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
        : await fetch(`/api/applications?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (response.ok) {
        setJobs((items) => items.filter((job) => job.id !== id));
      } else {
        const payload = await response.json().catch(() => ({}));
        setActionError(typeof payload.error === "string" ? payload.error : "Could not delete this application.");
      }
    } catch {
      setActionError("Could not delete this application. Check your connection and try again.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white font-sans">
      <div className="flex flex-col gap-4 border-b border-neutral-200/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
          {FILTERS.map((item) => (
            <button type="button" key={item} onClick={() => setFilter(item)} className={`min-h-11 whitespace-nowrap rounded-xl px-3 text-sm font-medium transition-colors ${filter === item ? "bg-foreground text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              {item}
            </button>
          ))}
        </div>
        <label className="relative block w-full sm:w-64">
          <RiSearchLine aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search company or role" aria-label="Search company or role" className={`${featureChrome.input} pl-10`} />
        </label>
      </div>

      {actionError ? (
        <p role="alert" className="mx-4 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {actionError}
        </p>
      ) : null}

      {visibleJobs.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <p className="text-sm font-semibold text-foreground">No applications found</p>
          <p className="mt-1 text-sm text-muted-foreground">Change the filter or add a new opportunity.</p>
        </div>
      ) : (
        <>
          <div className="hidden grid-cols-[minmax(240px,2fr)_150px_minmax(180px,1fr)_120px_7.5rem] gap-4 border-b border-neutral-200/70 bg-muted/40 px-5 py-3 text-xs font-medium text-muted-foreground md:grid">
            <span>Company and role</span><span>Status</span><span>Resume</span><span>Updated</span><span className="text-right">Actions</span>
          </div>
          <div className="divide-y divide-neutral-200/70">
            {visibleJobs.map((job) => {
              const detailHref = job.recordType === "job" ? null : `/dashboard/applications/${job.id}`;
              return (
              <article key={job.id} className="group relative p-5 transition-colors hover:bg-muted/30 md:grid md:grid-cols-[minmax(240px,2fr)_150px_minmax(180px,1fr)_120px_7.5rem] md:items-center md:gap-4">
                {detailHref ? <DashboardHref href={detailHref} className="absolute inset-0" aria-label={`Open ${job.position} at ${job.company}`} /> : null}
                <div className="relative pointer-events-none min-w-0">
                  <p className="truncate text-xs font-medium text-muted-foreground">{job.company}</p>
                  <h2 className="mt-1 truncate text-sm font-semibold text-foreground">{job.position}</h2>
                  {job.deadline ? <p className="mt-1 text-sm text-muted-foreground">Deadline {new Date(job.deadline).toLocaleDateString()}</p> : null}
                </div>
                <div className="relative z-10 mt-4 md:mt-0">
                  <div className="relative inline-block">
                    <select aria-label={`Status for ${job.position} at ${job.company}`} value={job.status} onChange={(event) => updateStatus(job.id, event.target.value as Job["status"])} className={`h-11 appearance-none rounded-xl py-1.5 pl-3 pr-8 text-sm font-medium outline-none ${statusClasses(String(job.status))}`}>
                      {BOARD_STATUSES.map((status) => <option key={status}>{status}</option>)}
                    </select>
                    <AppIcon icon={RiArrowDownSLine} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" size={14} />
                  </div>
                </div>
                <div className="relative pointer-events-none mt-3 flex min-w-0 items-center gap-2 text-sm text-muted-foreground md:mt-0"><AppIcon icon={RiFileTextLine} size={15} /><span className="truncate">{linkedResume(job)}</span></div>
                <p className="relative pointer-events-none mt-3 text-sm text-muted-foreground md:mt-0">{formatRelativeTime(job.updatedAt)}</p>
                <div className="relative z-10 mt-4 flex items-center justify-end gap-1 md:mt-0">
                  {detailHref ? (
                    <DashboardHref href={detailHref} className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Open application"><AppIcon icon={RiArrowRightLine} size={16} /></DashboardHref>
                  ) : job.url ? (
                    <a href={job.url} target="_blank" rel="noreferrer" className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Open job listing"><AppIcon icon={RiLink} size={16} /></a>
                  ) : null}
                  <button disabled={busyId === job.id} onClick={() => removeJob(job.id)} className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40" aria-label="Delete application"><AppIcon icon={RiDeleteBinLine} size={16} /></button>
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
