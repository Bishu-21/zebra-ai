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
import Link from "next/link";
import { AnalyzeResume } from "@/components/dashboard/AnalyzeResume";
import { TailorResume } from "@/components/dashboard/TailorResume";
import { ImportResume } from "@/components/dashboard/ImportResume";
import { InsightsFeed } from "@/components/dashboard/InsightsFeed";
import { ResumeVault } from "@/components/dashboard/ResumeVault";
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
  let session;
  try {
      session = await auth.api.getSession({
          headers: await headers(),
      });
  } catch (error) {
      console.error("Dashboard Session Check Failed:", error);
      return (
        <div className="p-12 text-center">
            <h1 className="text-2xl font-bold mb-4">Connection Issue</h1>
            <p className="text-sm text-[#737373]">Connecting to the terminal. Please wait or refresh.</p>
        </div>
      );
  }

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

  const vaultItems = userResumes.map(r => ({
      id: r.id,
      title: r.title || "Untitled Resume",
      date: r.updatedAt,
      hasAnalysis: r.analyses.length > 0,
  }));

  const intelligenceReports = [
      ...allAnalyses.map(a => ({
          id: a.id,
          type: "analysis" as const,
          title: `Analysis: ${a.resume.title}`,
          subtext: `${a.score > 80 ? 'Excellent' : 'Average'} Quality`,
          date: a.createdAt,
          score: a.score,
          fullData: a.feedback,
      })),
      ...atsResults.map(r => ({
          id: r.id,
          type: "tailoring" as const,
          title: `Match: ${r.resume.title}`,
          subtext: `Tailored for Job`,
          date: r.createdAt,
          score: r.matchScore,
          fullData: r.feedback,
      })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);

  return (
    <div className="p-6 md:p-10 pb-32 max-w-[90rem] mx-auto overflow-x-hidden">
      {/* Welcome Section - Compact */}
      <div className="mb-10 relative">
        <h1 className="text-4xl md:text-5xl font-bold tracking-[-0.04em] leading-[0.95] mb-4 text-[#0A0A0A]">
            Welcome back{session.user.name ? `, ${session.user.name.split(' ')[0]}` : ''}.
        </h1>
        <p className="text-[#737373] text-xs font-medium max-w-lg leading-relaxed">
          Manage your resumes and AI-powered optimizations from your workspace.
        </p>
      </div>

      {/* Quick Stats Ribbon */}
      <div className="flex md:grid md:grid-cols-4 gap-4 mb-10 overflow-x-auto pb-2 md:pb-0 scrollbar-hide no-scrollbar">
        {stats.map((stat, i) => (
          <div key={i} className={`min-w-[160px] md:min-w-0 flex-shrink-0 bg-white border border-black/[0.04] rounded-2xl p-6 flex flex-col transition-all duration-300 hover:shadow-lg active:scale-[0.98] cursor-default ${
            stat.label === "AI Credits" 
              ? "hover:border-[#3B82F6]/40 hover:shadow-blue-500/5 group/stat" 
              : "hover:border-[#0A0A0A]/15 hover:shadow-black/5 group/stat"
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 ${
              stat.label === "AI Credits" 
                ? "bg-[#3B82F6]/10 text-[#3B82F6]" 
                : "bg-black/[0.03] text-[#737373]/50 group-hover/stat:bg-[#0A0A0A] group-hover/stat:text-white"
            }`}>
              <stat.icon size={18} />
            </div>
            <p className="text-[0.55rem] font-bold uppercase tracking-[0.2em] text-[#737373] mb-1">{stat.label}</p>
            <p className={`text-3xl font-bold tracking-tighter transition-colors ${
              stat.label === "AI Credits" ? "text-[#3B82F6]" : "text-[#0A0A0A]"
            }`}>{stat.customValue !== undefined ? stat.customValue : stat.value}</p>
          </div>
        ))}
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <AnalyzeResume />
        <TailorResume resumes={userResumes} />
        <Link 
          href="/dashboard/resumes/new"
          className="group/card relative overflow-hidden flex flex-col justify-between h-full min-h-[220px] cursor-pointer transition-all p-10 bg-white border border-black/[0.04] rounded-[2.5rem] hover:shadow-2xl hover:shadow-black/[0.03] active:scale-[0.99]"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-black/[0.01] rounded-bl-[4rem] group-hover/card:scale-110 transition-transform" />
          <div className="flex items-start justify-between mb-8">
            <div className="w-14 h-14 bg-black/[0.03] rounded-2xl flex items-center justify-center text-[#737373]/40 group-hover/card:bg-[#3B82F6] group-hover/card:text-white transition-all duration-500">
              <RiAddLine size={28} />
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                <span className="text-[0.6rem] font-bold uppercase tracking-widest text-[#737373]">Create</span>
                <RiArrowRightSLine size={14} className="text-[#3B82F6]" />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-2xl mb-2 text-[#0A0A0A] tracking-tighter">Build New Resume</h3>
            <p className="text-[0.65rem] text-[#737373] font-bold uppercase tracking-[0.1em] leading-relaxed">
              Start from a blank canvas <br/> with guided AI prompts.
            </p>
          </div>
        </Link>
        <ImportResume />
      </div>

      {/* Resume Vault Section */}
      <div className="mt-20">
        <ResumeVault items={vaultItems} />
      </div>

      {/* Recent Activity / Insights */}
      <div className="mt-20">
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-black/[0.04]">
            <div className="w-2 h-8 bg-[#3B82F6] rounded-full" />
            <h3 className="text-xl font-bold text-[#0A0A0A] tracking-tight">Performance Insights</h3>
            <span className="px-2 py-0.5 bg-[#3B82F6]/5 text-[#3B82F6] text-[0.6rem] font-black rounded-md uppercase tracking-widest border border-[#3B82F6]/10">
                Recent Feed
            </span>
        </div>
        
        {intelligenceReports.length === 0 ? (
            <div className="py-16 bg-white/50 rounded-2xl border-2 border-dashed border-black/[0.06] flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 bg-black/[0.03] rounded-2xl flex items-center justify-center text-black/10 mb-4">
                    <RiArticleLine size={24} />
                </div>
                <p className="text-black/50 text-sm font-bold mb-1">No reports yet</p>
                <p className="text-black/30 text-[0.6rem] font-bold uppercase tracking-widest max-w-xs">Analyze a resume to see AI reports here</p>
            </div>
        ) : (
            <InsightsFeed data={intelligenceReports} />
        )}
      </div>
    </div>
  );
}
