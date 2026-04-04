import React from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { jobs as jobsTable, resumes as resumesTable } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { JobBoard } from "@/components/dashboard/JobBoard";

export default async function JobTrackerPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;

  // 1. Fetch real jobs from database
  const userJobs = await db.query.jobs.findMany({
    where: eq(jobsTable.userId, session.user.id),
    orderBy: [desc(jobsTable.updatedAt)],
  });

  // 2. Fetch user's resumes for the selection dropdown
  const userResumes = await db.query.resumes.findMany({
      where: eq(resumesTable.userId, session.user.id),
      orderBy: [desc(resumesTable.updatedAt)],
  });

  // Convert to type expected by JobBoard
  const formattedJobs = userJobs.map(job => ({
      id: job.id,
      company: job.company,
      position: job.position,
      status: job.status as "Applied" | "Interviewing" | "Offers" | "Rejected",
      salary: job.salary,
      url: job.url,
      resumeId: job.resumeId,
      updatedAt: job.updatedAt.toISOString(),
  }));

  return (
    <div className="p-10 max-w-[1400px]">
      <div className="mb-12 max-w-2xl">
        <h1 className="text-[2.5rem] font-bold tracking-[-0.03em] leading-tight mb-4">Job Tracker</h1>
        <p className="text-[#6B6B6B] text-[1.05rem] leading-relaxed">
          Manage your applications and interview stages in one place. Focus on the hunt, not the spreadsheet.
        </p>
      </div>

      <JobBoard initialJobs={formattedJobs} resumes={userResumes} />
    </div>
  );
}
