import React from "react";
import { 
    RiFileTextLine, 
    RiAddLine, 
    RiUploadCloud2Line, 
    RiBriefcase4Line, 
    RiBarChartGroupedLine, 
    RiFlashlightLine, 
    RiInformationLine,
    RiMagicLine,
    RiArrowDropDownLine,
    RiLoader4Line,
    RiArrowRightLine,
    RiFocus3Line,
    RiTimer2Line,
    RiArrowRightSLine,
    RiCheckboxCircleLine,
    RiRadarLine,
    RiArticleLine
} from "react-icons/ri";
import { AnalyzeResume } from "@/components/dashboard/AnalyzeResume";
import { TailorResume } from "@/components/dashboard/TailorResume";
import { InsightsFeed } from "@/components/dashboard/InsightsFeed";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { 
    user as userTable,
    resumes as resumesTable, 
    analysis as analysisTable, 
    atsOptimisations as atsOptimisationsTable 
} from "@/lib/schema";
import { eq, desc, count } from "drizzle-orm";

function formatTimeAgo(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;

  // Fetch real resumes
  const userResumes = await db.query.resumes.findMany({
    where: eq(resumesTable.userId, session.user.id),
    orderBy: [desc(resumesTable.updatedAt)],
    with: {
        analyses: {
            orderBy: [desc(analysisTable.createdAt)],
            limit: 1,
        }
    }
  });

  // Fetch all analyses for feed
  const allAnalyses = await db.query.analysis.findMany({
      where: (analysis, { inArray }) => 
        userResumes.length > 0 
          ? inArray(analysis.resumeId, userResumes.map(r => r.id))
          : eq(analysis.id, "none"),
      orderBy: [desc(analysisTable.createdAt)],
      limit: 10,
      with: {
          resume: true
      }
  });

  // Fetch ATS optimizations for feed
  const atsResults = await db.query.atsOptimisations.findMany({
      where: eq(atsOptimisationsTable.userId, session.user.id),
      orderBy: [desc(atsOptimisationsTable.createdAt)],
      limit: 10,
      with: {
          resume: true
      }
  });

  // Fetch counts for Quick Stats
  const [resumeCount] = await db.select({ value: count() }).from(resumesTable).where(eq(resumesTable.userId, session.user.id));
  const [analysisCount] = await db.select({ value: count() })
    .from(analysisTable)
    .innerJoin(resumesTable, eq(analysisTable.resumeId, resumesTable.id))
    .where(eq(resumesTable.userId, session.user.id));
  const [optimisationCount] = await db.select({ value: count() }).from(atsOptimisationsTable).where(eq(atsOptimisationsTable.userId, session.user.id));

  // Get credits from user table directly to ensure freshness
  const currentUser = await db.query.user.findFirst({
      where: eq(userTable.id, session.user.id)
  });
  const credits = currentUser?.credits ?? 5;

  type StatItem = {
    label: string;
    value?: number;
    icon: any;
    customValue?: any;
  };

  const stats: StatItem[] = [
    { label: "Total Resumes", value: resumeCount.value, icon: RiFileTextLine },
    { label: "AI Analyses", value: analysisCount.value, icon: RiCheckboxCircleLine },
    { label: "Role Matches", value: optimisationCount.value, icon: RiFlashlightLine },
    { label: "AI Credits", icon: RiRadarLine, customValue: credits },
  ];

  const unifiedInsights = [
      ...allAnalyses.map(a => ({
          id: a.id,
          type: "analysis" as const,
          title: `Analysis: ${a.resume.title}`,
          subtext: `${a.score > 80 ? 'Excellent' : 'Average'} Quality`,
          date: a.createdAt,
          score: a.score,
          fullData: a.feedback, // Pass full feedback for the modal
      })),
      ...atsResults.map(r => ({
          id: r.id,
          type: "tailoring" as const,
          title: `Match: ${r.resume.title}`,
          subtext: `Tailored for Job`,
          date: r.createdAt,
          score: r.matchScore,
          fullData: r.feedback, // Pass full feedback for the modal
      }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);

  return (
    <div className="p-6 md:p-10 pb-24 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-20 relative">
        <div className="absolute -left-6 top-2 w-1.5 h-16 bg-black rounded-full opacity-10 hidden md:block"></div>
        <h1 className="text-[2.5rem] md:text-[3.5rem] font-bold tracking-tighter leading-[1.1] mb-6 text-black">
            Command Center
        </h1>
        <p className="text-black/60 text-sm md:text-md max-w-2xl leading-relaxed font-bold uppercase tracking-wider">
          Precision editing powered by <span className="text-black">Zebra AI</span>. Refine your professional identity with <span className="text-black">stealth and accuracy</span>.
        </p>
      </div>

      {/* Quick Stats Ribbon */}
      <div className="flex md:grid md:grid-cols-4 gap-6 mb-16 overflow-x-auto pb-4 md:pb-0 scrollbar-hide no-scrollbar">
        {stats.map((stat, i) => (
          <div key={i} className="min-w-[180px] md:min-w-0 flex-shrink-0 bg-white/30 backdrop-blur-md border border-white/50 rounded-[2.5rem] p-8 flex flex-col hover:bg-white/50 transition-all group shadow-sm">
            <div className={`w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm border border-black/5`}>
              <stat.icon size={22} className="text-black/70" />
            </div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-black/60 mb-1">{stat.label}</p>
            <p className="text-3xl font-black text-black">{stat.customValue !== undefined ? stat.customValue : stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-16 px-1">
        {/* Row 1: The Two Main AI Tools */}
        <div className="col-span-12 md:col-span-6 h-full">
          <AnalyzeResume />
        </div>

        <div className="col-span-12 md:col-span-6 h-full">
          <TailorResume resumes={userResumes} />
        </div>

        {/* Row 2: Creation & Management */}
        <div className="col-span-12 md:col-span-6 bg-white border border-black/5 rounded-[2.5rem] p-10 flex flex-col justify-between hover:bg-white transition-all group cursor-pointer shadow-sm hover:shadow-xl hover:shadow-black/5 active:scale-[0.99] group/card">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-black/[0.02] border border-black/5 rounded-2xl flex items-center justify-center text-black/40 shadow-inner group-hover:scale-110 group-hover:bg-black group-hover:text-white transition-all duration-500">
              <RiAddLine size={32} />
            </div>
            <div>
              <h3 className="font-black text-xl mb-1 text-black tracking-tight group-hover:translate-x-1 transition-transform duration-300">Build New</h3>
              <p className="text-sm text-black/40 font-bold uppercase tracking-wider leading-relaxed">
                Start from a blank canvas with guided AI prompts.
              </p>
            </div>
          </div>
          <button className="px-6 py-3 bg-black text-white rounded-xl text-[0.7rem] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10 mt-10 w-fit">
            Create Now
          </button>
        </div>

        <div className="col-span-12 md:col-span-6 bg-white border border-black/5 rounded-[2.5rem] p-10 hover:bg-white transition-all group cursor-pointer shadow-sm hover:shadow-xl hover:shadow-black/5 active:scale-[0.99] flex flex-col justify-between group/card">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-black/[0.02] border border-black/5 rounded-2xl flex items-center justify-center text-black/40 shadow-inner group-hover:scale-110 group-hover:bg-black group-hover:text-white transition-all duration-500">
              <RiUploadCloud2Line size={28} />
            </div>
            <div>
              <h3 className="font-black text-xl mb-1 text-black tracking-tight group-hover:translate-x-1 transition-transform duration-300">Import Resume</h3>
              <p className="text-sm text-black/40 font-bold uppercase tracking-wider leading-relaxed">
                PDF, DOCX, or LinkedIn source.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-10">
             <button className="px-6 py-3 bg-black text-white rounded-xl text-[0.7rem] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10 w-fit">
                Import Source
             </button>
             <RiArrowRightSLine size={18} className="text-black/40 translate-x-0 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Unified Feed Section */}
      <div className="mt-24">
        <div className="flex items-center justify-between mb-12 pb-6 border-b border-black/5">
           <div className="flex items-center gap-4">
              <div className="w-2 h-8 bg-black rounded-full opacity-10"></div>
              <p className="text-[0.7rem] font-bold tracking-[0.2em] uppercase text-black/60">Intelligence Insights</p>
           </div>
        </div>
        
        {unifiedInsights.length === 0 ? (
            <div className="py-24 bg-white/10 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-black/5 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-black/5 rounded-3xl flex items-center justify-center text-black/10 mb-8">
                    <RiArticleLine size={40} />
                </div>
                <p className="text-black/60 font-bold text-xl mb-3 tracking-tight uppercase">Clean Slate</p>
                <p className="text-black/60 text-xs font-bold uppercase tracking-widest max-w-xs">Start optimizing to see AI insights.</p>
            </div>
        ) : (
            <InsightsFeed data={unifiedInsights} />
        )}
      </div>
    </div>
  );
}
