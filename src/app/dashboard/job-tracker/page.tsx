import React from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { jobs as jobsTable, resumes as resumesTable, resumeVersions as resumeVersionsTable, applications as applicationsTable } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { JobBoard } from "@/components/dashboard/JobBoard";

export default async function JobTrackerPage() {
  let session = null;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch (e) {
    console.error("Session fetch failed in job-tracker:", e);
  }

  if (!session) return null;

  // 1. Fetch applications from database
  const userApplications = await db.query.applications.findMany({
    where: eq(applicationsTable.userId, session.user.id),
    orderBy: [desc(applicationsTable.createdAt)],
  });

  const userJobs = await db.query.jobs.findMany({
    where: eq(jobsTable.userId, session.user.id),
    orderBy: [desc(jobsTable.updatedAt)],
  });

  const userResumes = await db.query.resumes.findMany({
      where: eq(resumesTable.userId, session.user.id),
      orderBy: [desc(resumesTable.updatedAt)],
  });

  const userVersions = await db.query.resumeVersions.findMany({
      where: eq(resumeVersionsTable.userId, session.user.id),
      orderBy: [desc(resumeVersionsTable.createdAt)],
  });

  // Combine applications and jobs, preferring applications
  const appIds = new Set(userApplications.map(a => a.id));
  const formattedJobs = [
      ...userApplications.map(app => ({
          id: app.id,
          company: app.company,
          position: app.position,
          status: app.status as "Draft" | "Applied" | "Preparing" | "Tailoring" | "Interviewing" | "Offer" | "Rejected" | "Withdrawn",
          description: app.jobDescription,
          url: app.url,
          resumeId: app.selectedResumeId,
          resumeVersionId: app.resumeVersionId,
          updatedAt: app.updatedAt.toISOString(),
      })),
      ...userJobs
          .filter(j => !appIds.has(j.id))
          .map(job => ({
              id: job.id,
              company: job.company,
              position: job.position,
              status: job.status as "Draft" | "Applied" | "Preparing" | "Tailoring" | "Interviewing" | "Offer" | "Rejected" | "Withdrawn",
              salary: job.salary,
              url: job.url,
              resumeId: job.resumeId,
              resumeVersionId: job.resumeVersionId,
              updatedAt: job.updatedAt.toISOString(),
          }))
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight text-[#0A0A0A] mb-1">Applications</h1>
          <p className="text-xs font-normal text-neutral-500 leading-relaxed">
            Manage your applications and interview stages in one place. Focus on the hunt, not the spreadsheet.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4">
            <div className="bg-white border border-neutral-200/70 p-4 pr-8 rounded-2xl shadow-2xs">
                <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">Applications</p>
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-[#0A0A0A]">{formattedJobs.length}</span>
                </div>
            </div>
            <div className="bg-white border border-neutral-200/70 p-4 pr-8 rounded-2xl shadow-2xs">
                <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">Interview Rate</p>
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-[#0A0A0A]">
                        {formattedJobs.length > 0
                            ? Math.round((formattedJobs.filter(j => String(j.status) === 'Interviewing' || String(j.status) === 'Offer' || String(j.status) === 'Offers').length / formattedJobs.length) * 100)
                            : 0}%
                    </span>
                </div>
            </div>
        </div>
      </div>

      <JobBoard
        initialJobs={formattedJobs}
        resumes={userResumes}
        versions={userVersions}
      />
    </div>
  );
}
