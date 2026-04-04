import React from "react";
import { Chart, DirectRight, Eye, Radar } from "iconsax-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { resumes as resumesTable, analysis as analysisTable, jobs as jobsTable } from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";

export default async function AnalyticsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;

  // Fetch metrics data
  const userResumes = await db.query.resumes.findMany({
    where: eq(resumesTable.userId, session.user.id),
  });

  const userJobs = await db.query.jobs.findMany({
    where: eq(jobsTable.userId, session.user.id),
  });

  let avgScore = 0;
  if (userResumes.length > 0) {
    const resumeIds = userResumes.map(r => r.id);
    const analyses = await db.query.analysis.findMany({
        where: inArray(analysisTable.resumeId, resumeIds)
    });
    if (analyses.length > 0) {
        avgScore = Math.round(analyses.reduce((acc, curr) => acc + curr.score, 0) / analyses.length);
    }
  }

  const creditsUsed = 5 - (session.user as any).credits;

  const stats = [
    { label: "Resumes Created", value: userResumes.length.toString(), change: "Total", icon: <Eye size={20} /> },
    { label: "Job Applications", value: userJobs.length.toString(), change: "Tracking", icon: <Radar size={20} /> },
    { label: "Avg. AI Optimization", value: `${avgScore}%`, change: avgScore > 80 ? "Expert" : "Optimizing", icon: <DirectRight size={20} /> },
    { label: "Credits Used", value: creditsUsed.toString(), change: "Limit 5", icon: <Chart size={20} /> }
  ];

  return (
    <div className="p-10 max-w-6xl space-y-12 pb-24">
      <div className="max-w-2xl">
        <h1 className="text-[2.5rem] font-bold tracking-[-0.03em] leading-tight mb-4">Analytics</h1>
        <p className="text-[#6B6B6B] text-[1.05rem] leading-relaxed">
          Monitor your resume performance across job boards and ATS filters. Visibility leads to interviews.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#EAEAEA] p-8 hover:shadow-sm transition-all group">
            <div className="w-10 h-10 bg-[#F9F9F9] group-hover:bg-[#3B82F6]/5 rounded-xl flex items-center justify-center text-[#6B6B6B] group-hover:text-[#3B82F6] transition-all mb-6">
              {stat.icon}
            </div>
            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[#B5B5B5] mb-1">{stat.label}</p>
            <div className="flex items-end gap-3">
              <h3 className="text-3xl font-extrabold">{stat.value}</h3>
              <span className="text-xs font-bold text-[#3B82F6] mb-1">{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[24px] border border-[#EAEAEA] p-10 h-[400px] flex flex-col items-center justify-center text-[#6B6B6B] relative overflow-hidden group">
        <div className="absolute inset-0 bg-[#F9F9F9]/50 group-hover:bg-[#FAFAFA] transition-all opacity-20"></div>
        <div className="w-full flex justify-center items-end gap-2 h-48 relative z-10">
            {/* Visual Bar representation */}
            {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                <div key={i} className="w-12 bg-[#3B82F6]/10 group-hover:bg-[#3B82F6] transition-all duration-700 rounded-t-lg" style={{ height: `${h}%` }}></div>
            ))}
        </div>
        <p className="text-lg font-bold relative z-10 mt-8">Application Velocity Graph</p>
        <p className="text-sm relative z-10 mt-2 text-center max-w-sm">
            Predictive analysis is active. Your current trajectory suggests a 25% increase in recruiter reach this week.
        </p>
      </div>
    </div>
  );
}
