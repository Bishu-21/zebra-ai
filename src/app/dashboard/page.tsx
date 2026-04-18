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
      title: r.title || "Untitled Strategic Asset",
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
        <div className="flex items-center gap-3 mb-4">
            <span className="text-[0.55rem] font-bold uppercase tracking-[0.3em] text-[#737373]/40">System Terminal</span>
            <div className="h-px w-8 bg-black/5" />
            <span className="text-[0.55rem] font-bold uppercase tracking-[0.3em] text-[#737373]/60">Zebra AI / Node_01</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-[-0.04em] leading-[0.95] mb-4 text-[#0A0A0A]">
            Welcome back{session.user.name ? `, ${session.user.name.split(' ')[0]}` : ''}.
        </h1>
        <p className="text-black/35 text-[0.65rem] max-w-lg leading-relaxed font-bold uppercase tracking-widest">
          High-Fidelity Document Intelligence <span className="mx-2 text-black/10">|</span> 
          Precision Layer
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
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-10">
        <div className="col-span-12 md:col-span-6 h-full">
          <AnalyzeResume />
        </div>
        <div className="col-span-12 md:col-span-6 h-full">
          <TailorResume resumes={userResumes} />
        </div>
        <Link 
          href="/dashboard/resumes/new"
          className="col-span-12 md:col-span-6 group/card relative overflow-hidden flex flex-col justify-between h-full cursor-pointer transition-all p-8 bg-white border border-black/[0.04] rounded-2xl hover:shadow-xl hover:shadow-black/[0.03] active:scale-[0.99]"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-black/[0.01] rounded-bl-[3rem] group-hover/card:scale-110 transition-transform" />
          <div className="flex items-start justify-between mb-6">
            <div className="w-12 h-12 bg-black/[0.03] rounded-xl flex items-center justify-center text-[#737373]/40 group-hover/card:bg-[#3B82F6] group-hover/card:text-white transition-all duration-300">
              <RiAddLine size={28} />
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                <span className="text-[0.55rem] font-bold uppercase tracking-widest text-[#737373]">Initialize</span>
                <RiArrowRightSLine size={14} className="text-[#3B82F6]" />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-xl mb-1.5 text-[#0A0A0A] tracking-tight">Build New Resume</h3>
            <p className="text-[0.6rem] text-[#737373] font-bold uppercase tracking-[0.1em] leading-relaxed">
              Start from a blank canvas with guided AI prompts.
            </p>
          </div>
        </Link>
        <div className="col-span-12 md:col-span-6 h-full">
          <ImportResume />
        </div>
      </div>

      {/* Strategic Document Vault */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-black/5">
           <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-[#3B82F6] rounded-full opacity-40"></div>
              <p className="text-[0.65rem] font-bold tracking-[0.2em] uppercase text-black/60">Strategic Document Vault</p>
           </div>
           <span className="text-[0.55rem] font-black text-black/10 uppercase tracking-widest">{vaultItems.length} OBJECTS</span>
        </div>
        
        {vaultItems.length === 0 ? (
            <Link href="/dashboard/resumes/new" className="block py-16 bg-white rounded-2xl border-2 border-dashed border-black/[0.06] flex flex-col items-center justify-center text-center hover:border-[#3B82F6]/30 hover:bg-blue-50/30 transition-all group cursor-pointer">
                 <div className="w-14 h-14 rounded-2xl bg-black/[0.03] flex items-center justify-center mb-4 group-hover:bg-[#3B82F6]/10 transition-colors">
                    <RiAddLine size={24} className="text-black/15 group-hover:text-[#3B82F6] transition-colors" />
                 </div>
                 <p className="text-black/50 text-sm font-bold mb-1">No resumes yet</p>
                 <p className="text-black/30 text-[0.6rem] font-bold uppercase tracking-widest">Click to create your first strategic asset</p>
            </Link>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {vaultItems.slice(0, 4).map((item) => (
                    <Link 
                        key={item.id}
                        href={`/dashboard/resumes/${item.id}`}
                        className="bg-white border border-black/[0.04] p-6 rounded-2xl hover:shadow-lg transition-all cursor-pointer group"
                    >
                        <div className="w-10 h-10 bg-black/[0.03] rounded-xl flex items-center justify-center text-[#737373]/40 group-hover:bg-[#3B82F6] group-hover:text-white transition-all mb-4">
                            <RiFileTextLine size={20} />
                        </div>
                        <h4 className="font-bold text-[#0A0A0A] tracking-tight mb-1.5 truncate group-hover:text-[#3B82F6] transition-colors text-sm">{item.title}</h4>
                        <div className="flex items-center justify-between">
                            <p className="text-[0.55rem] font-bold text-[#737373]/40 uppercase tracking-widest">{formatTimeAgo(item.date)}</p>
                            {item.hasAnalysis && (
                                <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        )}
      </div>

      {/* Intelligence Insights Section */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-black/5">
           <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-black rounded-full opacity-10"></div>
              <p className="text-[0.65rem] font-bold tracking-[0.2em] uppercase text-black/60">Intelligence Diagnostic Reports</p>
           </div>
        </div>
        
        {intelligenceReports.length === 0 ? (
            <div className="py-16 bg-white/50 rounded-2xl border-2 border-dashed border-black/[0.06] flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 bg-black/[0.03] rounded-2xl flex items-center justify-center text-black/10 mb-4">
                    <RiArticleLine size={24} />
                </div>
                <p className="text-black/50 text-sm font-bold mb-1">Clean Slate</p>
                <p className="text-black/30 text-[0.6rem] font-bold uppercase tracking-widest max-w-xs">Analyze a resume to see AI diagnostic reports here</p>
            </div>
        ) : (
            <InsightsFeed data={intelligenceReports} />
        )}
      </div>
    </div>
  );
}
