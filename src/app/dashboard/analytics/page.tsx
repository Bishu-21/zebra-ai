import React from "react";
import { getDashboardSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { resumes as resumesTable, analysis as analysisTable, applications as applicationsTable } from "@/lib/schema";
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
  const session = await getDashboardSession();

  if (!session) return null;

  // Fetch real metrics
  const userResumes = await db.query.resumes.findMany({
    where: eq(resumesTable.userId, session.user.id),
  });

  const userApplications = await db.query.applications.findMany({
    where: eq(applicationsTable.userId, session.user.id),
    orderBy: [desc(applicationsTable.updatedAt)],
  });
  const activeApplications = userApplications.filter((application) =>
    !["Rejected", "Withdrawn", "Offer"].includes(application.status)
  );
  const recentApplications = userApplications.slice(0, 5);

  let avgScore: number | null = null;
  let analysesCount = 0;
  if (userResumes.length > 0) {
    const resumeIds = userResumes.map(r => r.id);
    const analyses = await db.query.analysis.findMany({
        where: inArray(analysisTable.resumeId, resumeIds)
    });
    analysesCount = analyses.length;
    const scoredAnalyses = analyses.filter((curr): curr is typeof curr & { score: number } => typeof curr.score === "number");
    if (scoredAnalyses.length > 0) {
        avgScore = Math.round(scoredAnalyses.reduce((acc, curr) => acc + curr.score, 0) / scoredAnalyses.length);
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
    chartScores = recentAnalyses.map(a => a.score).filter((score): score is number => typeof score === "number").reverse();
  }

  const displayScores = chartScores;

  const stats = [
    { label: "Saved resumes", value: userResumes.length.toString(), sub: "Documents in your workspace", icon: RiStackLine, color: "text-[#0A0A0A]" },
    { label: "Open applications", value: activeApplications.length.toString(), sub: "Not rejected, withdrawn, or offer", icon: RiRadarLine, color: "text-[#0A0A0A]" },
    { label: "Average resume review", value: avgScore == null ? "No reviews yet" : `${avgScore}%`, sub: avgScore == null ? "Review a resume to see your progress." : "Based on your saved resume reviews.", icon: RiCompass3Line, color: "text-[#0A0A0A]" },
    { label: "Saved analyses", value: analysesCount.toString(), sub: "Resume review reports", icon: RiBarChartGroupedLine, color: "text-[#0A0A0A]" }
  ];

  return (
    <DashboardPage>
      <DashboardPageHeader
        title="Analytics"
        description="Review resume scores and application activity using data already saved in your workspace."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="relative rounded-2xl border border-neutral-200/70 bg-white p-5">
            <div className={`w-10 h-10 bg-muted group-hover:bg-foreground group-hover:text-white rounded-[var(--radius-md)] flex items-center justify-center ${stat.color} transition-all mb-6`}>
              <stat.icon size={20} />
            </div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">{stat.label}</p>
            <div className="min-w-0 space-y-2">
              <h3 className={`${stat.value === "No reviews yet" ? "text-lg" : "text-2xl"} break-words font-semibold tracking-tight`}>{stat.value}</h3>
              <p className="text-xs leading-5 text-muted-foreground">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pipeline Health */}
        <div className="relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200/70 bg-white p-5 md:p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h2 className="text-base font-semibold tracking-tight">Resume score progress</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Your latest saved analyses</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-[#FAFAFA] rounded-xl border border-black/5">
                    <RiTimerFlashLine size={18} className="text-[#0A0A0A]" />
                    <span className="text-xs font-semibold">Saved data</span>
                </div>
            </div>

            <div className="flex-grow flex items-end justify-between gap-3 h-48 pb-4">
                {displayScores.length === 0 ? (
                    <p className="self-center text-sm text-muted-foreground">No saved analyses to chart yet.</p>
                ) : displayScores.map((h, i) => (
                    <div key={i} className="flex-grow group/bar relative">
                        <div
                            className={`w-full rounded-t-xl transition-all duration-700 ${i === displayScores.length - 1 && h > 0 ? 'bg-black' : 'bg-black/10 hover:bg-black/30'}`}
                            style={{ height: `${Math.max(h, 2)}%` }}
                        />
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all bg-black text-white text-[0.6rem] font-bold px-2 py-1 rounded pointer-events-none">
                            {h}%
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-black/5">
                <p className="text-sm text-muted-foreground">
                    {chartScores.length > 0
                        ? `Last ${chartScores.length} saved analyses.`
                        : "No saved analyses yet."}
                </p>
            </div>
        </div>

        {/* Intelligence Feed */}
        <div className="relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200/70 bg-white p-5 md:p-6">
            <h2 className="mb-6 text-base font-semibold tracking-tight">Recent activity</h2>
            <div className="space-y-6 flex-grow">
                {recentApplications.length > 0 ? recentApplications.map((application) => (
                    <div key={application.id} className="flex gap-4 items-start group">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <RiFlashlightLine size={14} />
                        </div>
                        <div>
                            <p className="line-clamp-1 text-sm font-semibold tracking-tight">{application.position}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{application.company} · {application.status}</p>
                        </div>
                    </div>
                )) : (
                    <div className="flex h-full flex-col items-center justify-center text-sm text-muted-foreground">
                        No applications saved yet.
                    </div>
                )}
            </div>

            <Link
                href="/dashboard/job-tracker"
                className="mt-8 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-foreground hover:bg-muted"
            >
                View all applications <RiArrowRightUpLine size={14} />
            </Link>
        </div>
      </div>
    </DashboardPage>
  );
}
