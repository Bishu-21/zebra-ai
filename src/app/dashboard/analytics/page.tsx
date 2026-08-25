import React from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { resumes as resumesTable, analysis as analysisTable, jobs as jobsTable } from "@/lib/schema";
import { eq, inArray, desc } from "drizzle-orm";
import {
    RiBarChartGroupedLine,
    RiRadarLine,
    RiCompass3Line,
    RiFlashlightLine,
    RiArrowRightUpLine,
    RiStackLine,
    RiTimerFlashLine
} from "react-icons/ri";

import Link from "next/link";
import { DashboardPage, DashboardPageHeader } from "@/components/dashboard/DashboardPage";

export default async function AnalyticsPage() {
  let session = null;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch (e) {
    console.error("Session fetch failed in analytics:", e);
  }

  if (!session) return null;

  // Fetch real metrics
  const userResumes = await db.query.resumes.findMany({
    where: eq(resumesTable.userId, session.user.id),
  });

  const userJobs = await db.query.jobs.findMany({
    where: eq(jobsTable.userId, session.user.id),
    orderBy: [desc(jobsTable.createdAt)],
    limit: 5
  });

  let avgScore = 0;
  let analysesCount = 0;
  if (userResumes.length > 0) {
    const resumeIds = userResumes.map(r => r.id);
    const analyses = await db.query.analysis.findMany({
        where: inArray(analysisTable.resumeId, resumeIds)
    });
    analysesCount = analyses.length;
    if (analyses.length > 0) {
        avgScore = Math.round(analyses.reduce((acc, curr) => acc + curr.score, 0) / analyses.length);
    }
  }

  // Fetch recent scores for chart
  let chartScores: number[] = [];
  if (userResumes.length > 0) {
    const resumeIds = userResumes.map(r => r.id);
    const recentAnalyses = await db.query.analysis.findMany({
        where: inArray(analysisTable.resumeId, resumeIds),
        orderBy: [desc(analysisTable.createdAt)],
        limit: 10
    });
    chartScores = recentAnalyses.map(a => a.score).reverse();
  }

  // Padding for chart if less than 10 entries
  const displayScores = chartScores.length > 0 ? chartScores : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  const stats = [
    { label: "Total Resumes", value: userResumes.length.toString(), sub: "Active Documents", icon: RiStackLine, color: "text-[#0A0A0A]" },
    { label: "Active Applications", value: userJobs.length.toString(), sub: "Tracked in Pipeline", icon: RiRadarLine, color: "text-[#0A0A0A]" },
    { label: "Average Match Score", value: `${avgScore}%`, sub: "ATS Alignment Score", icon: RiCompass3Line, color: "text-[#0A0A0A]" },
    { label: "Total Analyses", value: analysesCount.toString(), sub: "Analysis Reports", icon: RiBarChartGroupedLine, color: "text-[#0A0A0A]" }
  ];

  return (
    <DashboardPage>
      <DashboardPageHeader
        title="Analytics"
        description="Review resume scores and application activity using data already saved in your workspace."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-[var(--radius-xl)] border border-border-subtle p-6 hover:border-neutral-300 hover:shadow-[var(--shadow-md)] transition-all group relative overflow-hidden">
            <div className={`w-10 h-10 bg-muted group-hover:bg-foreground group-hover:text-white rounded-[var(--radius-md)] flex items-center justify-center ${stat.color} transition-all mb-6`}>
              <stat.icon size={20} />
            </div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1">{stat.label}</p>
            <div className="flex items-end gap-2">
              <h3 className="text-3xl font-bold tracking-tight">{stat.value}</h3>
              <p className="pb-1 text-[0.6875rem] font-medium text-muted-foreground">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pipeline Health */}
        <div className="lg:col-span-2 bg-white rounded-[var(--radius-xl)] border border-border-subtle p-6 md:p-8 flex flex-col relative overflow-hidden group shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h2 className="text-lg font-bold tracking-tight">Resume score progress</h2>
                    <p className="text-xs font-normal text-muted-foreground mt-1">Your latest saved analyses</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-[#FAFAFA] rounded-xl border border-black/5">
                    <RiTimerFlashLine size={18} className="text-[#0A0A0A]" />
                    <span className="text-xs font-semibold">Saved data</span>
                </div>
            </div>

            <div className="flex-grow flex items-end justify-between gap-3 h-48 pb-4">
                {displayScores.map((h, i) => (
                    <div key={i} className="flex-grow group/bar relative">
                        <div
                            className={`w-full rounded-t-xl transition-all duration-700 ${i === displayScores.length - 1 && h > 0 ? 'bg-black' : 'bg-black/10 hover:bg-black/30'}`}
                            style={{ height: `${h || 2}%` }}
                        />
                        {h > 0 && (
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all bg-black text-white text-[0.6rem] font-bold px-2 py-1 rounded pointer-events-none">
                                {h}%
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-black/5">
                <p className="text-xs font-bold text-[#737373]">
                    {chartScores.length > 0
                        ? `Tracking performance across your last ${chartScores.length} analyses.`
                        : "No analysis data available yet. Start by analyzing a resume."}
                </p>
            </div>
        </div>

        {/* Intelligence Feed */}
        <div className="bg-foreground rounded-[var(--radius-xl)] p-6 md:p-8 text-white flex flex-col shadow-[var(--shadow-lg)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[4rem] -mr-8 -mt-8" />

            <h2 className="text-lg font-bold tracking-tight mb-8">Recent activity</h2>
            <div className="space-y-6 flex-grow">
                {userJobs.length > 0 ? userJobs.map((job) => (
                    <div key={job.id} className="flex gap-4 items-start group">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-black transition-colors">
                            <RiFlashlightLine size={14} />
                        </div>
                        <div>
                            <p className="text-xs font-bold tracking-tight line-clamp-1">{job.position}</p>
                            <p className="text-[0.6rem] font-bold text-white/40 uppercase tracking-widest mt-1">{job.company}</p>
                        </div>
                    </div>
                )) : (
                    <div className="flex flex-col items-center justify-center h-full text-white/40 italic text-sm">
                        No recent activity logged.
                    </div>
                )}
            </div>

            <Link
                href="/dashboard/job-tracker"
                className="mt-10 w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[0.65rem] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all text-center flex items-center justify-center gap-1.5"
            >
                View all applications <RiArrowRightUpLine size={14} />
            </Link>
        </div>
      </div>
    </DashboardPage>
  );
}
