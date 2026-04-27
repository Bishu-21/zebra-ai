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
    <div className="p-10 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="max-w-2xl">
          <h1 className="text-[2.5rem] font-black tracking-[-0.04em] leading-tight mb-3 text-[#0A0A0A]">Job Tracker</h1>
          <p className="text-[#737373] text-[1.05rem] font-medium leading-relaxed">
            Manage your applications and interview stages in one place. Focus on the hunt, not the spreadsheet.
          </p>
        </div>
        
        {/* Quick Stats */}
        <div className="flex items-center gap-4">
            <div className="bg-white border border-black/[0.04] p-4 pr-10 rounded-[2rem] shadow-sm">
                <p className="text-[0.6rem] font-black text-[#A3A3A3] uppercase tracking-widest mb-1">Applications</p>
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-[#0A0A0A]">{userJobs.length}</span>
                    <span className="text-[0.65rem] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">+2 this week</span>
                </div>
            </div>
            <div className="bg-white border border-black/[0.04] p-4 pr-10 rounded-[2rem] shadow-sm">
                <p className="text-[0.6rem] font-black text-[#A3A3A3] uppercase tracking-widest mb-1">Interview Rate</p>
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-[#0A0A0A]">
                        {userJobs.length > 0 
                            ? Math.round((userJobs.filter(j => j.status !== 'Applied').length / userJobs.length) * 100) 
                            : 0}%
                    </span>
                    <span className="text-[0.65rem] font-bold text-[#3B82F6] bg-blue-50 px-2 py-0.5 rounded-full">Top 10%</span>
                </div>
            </div>
        </div>
      </div>

      <JobBoard initialJobs={formattedJobs} resumes={userResumes} />
    </div>
  );
}
