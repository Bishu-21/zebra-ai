import React from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { jobs as jobsTable, resumes as resumesTable, resumeVersions as resumeVersionsTable, applications as applicationsTable } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { JobBoard } from "@/components/dashboard/JobBoard";
import { DashboardPage, DashboardPageHeader, DashboardStat } from "@/components/dashboard/DashboardPage";
import { AddApplicationDrawer } from "@/components/dashboard/AddApplicationDrawer";

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
          recordType: "application" as const,
          company: app.company,
          position: app.position,
          status: app.status as "Draft" | "Applied" | "Preparing" | "Tailoring" | "Interviewing" | "Offer" | "Rejected" | "Withdrawn",
          description: app.jobDescription,
          url: app.url,
          resumeId: app.selectedResumeId,
          resumeVersionId: app.resumeVersionId,
          deadline: app.deadline?.toISOString() || null,
          updatedAt: app.updatedAt.toISOString(),
      })),
      ...userJobs
          .filter(j => !appIds.has(j.id))
          .map(job => ({
              id: job.id,
              recordType: "job" as const,
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
  const interviewRate = formattedJobs.length > 0
    ? Math.round((formattedJobs.filter((job) => ["Interviewing", "Offer", "Offers"].includes(String(job.status))).length / formattedJobs.length) * 100)
    : 0;

  return (
    <DashboardPage className="space-y-6">
      <DashboardPageHeader
        title="Applications"
        description="Track each opportunity, its documents, and the next stage from one workspace."
        actions={<div className="flex flex-col gap-2 sm:flex-row sm:items-center"><div className="grid grid-cols-2 gap-2"><DashboardStat label="Applications" value={formattedJobs.length} /><DashboardStat label="Interview rate" value={`${interviewRate}%`} /></div><AddApplicationDrawer resumes={userResumes.map(({ id, title }) => ({ id, title }))} /></div>}
      />

      <JobBoard
        initialJobs={formattedJobs}
        resumes={userResumes}
        versions={userVersions}
      />
    </DashboardPage>
  );
}
