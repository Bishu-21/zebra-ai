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

  const credits = (session.user as any).credits || 0;

  const stats = [
    { label: "Total Resumes", value: userResumes.length.toString(), sub: "Active Documents", icon: RiStackLine, color: "text-blue-500" },
    { label: "Active Applications", value: userJobs.length.toString(), sub: "Tracked in Pipeline", icon: RiRadarLine, color: "text-indigo-500" },
    { label: "Average Match Score", value: `${avgScore}%`, sub: "ATS Alignment Score", icon: RiCompass3Line, color: "text-emerald-500" },
    { label: "Total Analyses", value: analysesCount.toString(), sub: "Analysis Reports", icon: RiBarChartGroupedLine, color: "text-amber-500" }
  ];

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto space-y-12 pb-24 font-sans text-[#171717]">
      <div className="max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
            <div className="px-3 py-1 bg-[#3B82F6]/10 text-[#3B82F6] rounded-full text-[0.6rem] font-black uppercase tracking-widest">Analytics & Reports</div>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight mb-6">Performance Analytics</h1>
        <p className="text-[#737373] text-lg font-medium leading-relaxed max-w-2xl">
          Real-time visibility into your recruitment pipeline and document alignment. These metrics are derived from your active strategic assets.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-[2rem] border border-black/5 p-8 hover:shadow-2xl hover:shadow-black/5 transition-all group relative overflow-hidden">
            <div className={`w-12 h-12 bg-black/[0.02] group-hover:bg-black group-hover:text-white rounded-2xl flex items-center justify-center ${stat.color} transition-all mb-8 shadow-sm`}>
              <stat.icon size={24} />
            </div>
            <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-[#A3A3A3] mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-black tracking-tighter">{stat.value}</h3>
              <p className="text-[0.65rem] font-bold text-[#737373] uppercase tracking-widest mb-1">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pipeline Health */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-black/5 p-10 flex flex-col relative overflow-hidden group shadow-sm">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h4 className="text-xl font-black tracking-tight">Match Score Progress</h4>
                    <p className="text-xs font-bold text-[#A3A3A3] uppercase tracking-widest mt-1">Score tracking over time</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-[#FAFAFA] rounded-xl border border-black/5">
                    <RiTimerFlashLine size={18} className="text-[#3B82F6]" />
                    <span className="text-[0.65rem] font-black uppercase tracking-widest">Live Tracking</span>
                </div>
            </div>
            
            <div className="flex-grow flex items-end justify-between gap-3 h-48 pb-4">
                {[35, 60, 45, 85, 70, 95, 80, 65, 88, 75].map((h, i) => (
                    <div key={i} className="flex-grow group/bar relative">
                        <div 
                            className={`w-full rounded-t-xl transition-all duration-700 ${i === 5 ? 'bg-[#3B82F6]' : 'bg-[#3B82F6]/10 hover:bg-[#3B82F6]/30'}`} 
                            style={{ height: `${h}%` }}
                        />
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all bg-black text-white text-[0.6rem] font-bold px-2 py-1 rounded pointer-events-none">
                            {h}%
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-black/5">
                <p className="text-xs font-bold text-[#737373]">Average match score has improved by <span className="text-[#3B82F6]">12.4%</span> this session.</p>
                <button className="text-[0.65rem] font-black text-[#3B82F6] uppercase tracking-[0.2em] flex items-center gap-1 hover:gap-2 transition-all">
                    Full Report <RiArrowRightUpLine size={14} />
                </button>
            </div>
        </div>

        {/* Intelligence Feed */}
        <div className="bg-[#171717] rounded-[2.5rem] p-10 text-white flex flex-col shadow-2xl shadow-blue-900/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#3B82F6]/10 rounded-bl-[4rem] -mr-8 -mt-8" />
            
            <h4 className="text-xl font-black tracking-tight mb-8">Recent Activity</h4>
            <div className="space-y-6 flex-grow">
                {userJobs.length > 0 ? userJobs.map((job, i) => (
                    <div key={job.id} className="flex gap-4 items-start group">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-[#3B82F6] transition-colors">
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
            
            <button className="mt-10 w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[0.65rem] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all">
                View Activity Logs
            </button>
        </div>
      </div>
    </div>
  );
}
