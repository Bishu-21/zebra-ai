import React from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { resumes as resumesTable, resumeVersions as resumeVersionsTable, applications as applicationsTable, jobs as jobsTable } from "@/lib/schema";
import { and, count, eq, desc, lt, or, sql } from "drizzle-orm";
import { JobBoard } from "@/components/dashboard/JobBoard";
import { DashboardPage, DashboardPageHeader, DashboardStat } from "@/components/dashboard/DashboardPage";
import { AddApplicationDrawer } from "@/components/dashboard/AddApplicationDrawer";
import { normalizeApplicationStatus } from "@/lib/application-state-machine";
import { decodeCursor, paginateRows } from "@/lib/pagination";
import Link from "next/link";

export default async function JobTrackerPage({ searchParams }: { searchParams: Promise<{ cursor?: string }> }) {
  let session = null;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch (e) {
    console.error("Session fetch failed in job-tracker:", e);
  }

  if (!session) return null;
  const cursor = decodeCursor((await searchParams).cursor);
  const pageLimit = 50;
  const applicationKey = sql<string>`'application:' || ${applicationsTable.id}`;
  const jobKey = sql<string>`'job:' || ${jobsTable.id}`;

  // Read both stores for backwards compatibility. Legacy jobs stay untouched and
  // retain their own API behavior; new records continue to use applications.
  const [userApplications, legacyJobs, userResumes, userVersions, [applicationStats], [jobStats]] = await Promise.all([
    db.select().from(applicationsTable).where(and(
      eq(applicationsTable.userId, session.user.id),
      cursor ? or(
        lt(applicationsTable.updatedAt, cursor.timestamp),
        and(eq(applicationsTable.updatedAt, cursor.timestamp), lt(applicationKey, cursor.id)),
      ) : undefined,
    )).orderBy(desc(applicationsTable.updatedAt), desc(applicationKey)).limit(pageLimit + 1),
    db.select().from(jobsTable).where(and(
      eq(jobsTable.userId, session.user.id),
      cursor ? or(
        lt(jobsTable.updatedAt, cursor.timestamp),
        and(eq(jobsTable.updatedAt, cursor.timestamp), lt(jobKey, cursor.id)),
      ) : undefined,
    )).orderBy(desc(jobsTable.updatedAt), desc(jobKey)).limit(pageLimit + 1),
    db.query.resumes.findMany({
      columns: { id: true, title: true },
      where: eq(resumesTable.userId, session.user.id),
      orderBy: [desc(resumesTable.updatedAt)],
      limit: 50,
    }),
    db.query.resumeVersions.findMany({
      columns: { id: true, title: true, company: true, targetRole: true },
      where: eq(resumeVersionsTable.userId, session.user.id),
      orderBy: [desc(resumeVersionsTable.createdAt)],
      limit: 50,
    }),
    db.select({
      total: count(),
      interviews: sql<number>`count(*) filter (where ${applicationsTable.status} in ('Interviewing', 'Offer'))`,
    }).from(applicationsTable).where(eq(applicationsTable.userId, session.user.id)),
    db.select({
      total: count(),
      interviews: sql<number>`count(*) filter (where ${jobsTable.status} in ('Interviewing', 'Offer', 'Offers'))`,
    }).from(jobsTable).where(eq(jobsTable.userId, session.user.id)),
  ]);

  const currentApplications = userApplications.map(app => ({
          id: app.id,
          recordType: "application" as const,
          company: app.company,
          position: app.position,
          status: normalizeApplicationStatus(app.status),
          description: app.jobDescription,
          url: app.url,
          resumeId: app.selectedResumeId,
          resumeVersionId: app.resumeVersionId,
          deadline: app.deadline?.toISOString() || null,
          updatedAt: app.updatedAt,
      }));
  const previousApplications = legacyJobs.map(job => ({
    id: job.id,
    recordType: "job" as const,
    company: job.company,
    position: job.position,
    status: normalizeApplicationStatus(job.status),
    salary: job.salary,
    location: job.location,
    description: job.description,
    url: job.url,
    resumeId: job.resumeId,
    resumeVersionId: job.resumeVersionId,
    deadline: null,
    updatedAt: job.updatedAt,
  }));
  const mergedRows = [...currentApplications, ...previousApplications]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime() || `${b.recordType}:${b.id}`.localeCompare(`${a.recordType}:${a.id}`));
  const trackerPage = paginateRows(mergedRows, pageLimit, item => ({ id: `${item.recordType}:${item.id}`, timestamp: item.updatedAt }));
  const formattedJobs = trackerPage.items.map(item => ({ ...item, updatedAt: item.updatedAt.toISOString() }));
  const totalApplications = Number(applicationStats?.total ?? 0) + Number(jobStats?.total ?? 0);
  const totalInterviews = Number(applicationStats?.interviews ?? 0) + Number(jobStats?.interviews ?? 0);
  const interviewRate = totalApplications > 0
    ? Math.round((totalInterviews / totalApplications) * 100)
    : 0;

  return (
    <DashboardPage className="space-y-6">
      <DashboardPageHeader
        title="Applications"
        description="Track each opportunity, its documents, and the next stage from one workspace."
        actions={<div className="flex flex-col gap-2 sm:flex-row sm:items-center"><div className="grid grid-cols-2 gap-2"><DashboardStat label="Applications" value={totalApplications} /><DashboardStat label="Interview rate" value={`${interviewRate}%`} /></div><AddApplicationDrawer resumes={userResumes.map(({ id, title }) => ({ id, title }))} /></div>}
      />

      <JobBoard
        initialJobs={formattedJobs}
        resumes={userResumes}
        versions={userVersions}
      />
      {trackerPage.page.nextCursor && (
        <Link href={`/dashboard/job-tracker?cursor=${encodeURIComponent(trackerPage.page.nextCursor)}`} className="inline-flex rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50">
          View older applications
        </Link>
      )}
    </DashboardPage>
  );
}
