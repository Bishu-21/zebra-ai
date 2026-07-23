import React from "react";
import { 
    RiFileTextLine, 
    RiAddLine, 
    RiFlashlightLine, 
    RiArrowRightSLine, 
    RiCheckboxCircleLine, 
    RiRadarLine, 
    RiArticleLine
} from "react-icons/ri";
import Link from "next/link";
import { AnalyzeResume } from "@/components/dashboard/AnalyzeResume";
import { TailorResume, type Resume } from "@/components/dashboard/TailorResume";
import { ImportResume } from "@/components/dashboard/ImportResume";
import { InsightsFeed, type TailoringData } from "@/components/dashboard/InsightsFeed";
import { ResumeVault } from "@/components/dashboard/ResumeVault";
import { ProjectAnalyzerCard } from "@/components/dashboard/ProjectAnalyzerCard";
import { getSafeSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { 
    user as userTable,
    resumes as resumesTable, 
    analysis as analysisTable, 
    atsOptimisations as atsOptimisationsTable,
    resumeVersions as resumeVersionsTable,
    projectAnalyses as projectAnalysesTable
} from "@/lib/schema";
import { eq, desc, count, inArray } from "drizzle-orm";
import { ResumeAnalysisData } from "@/components/compiler/types";
import { ProjectAnalysisData } from "@/components/dashboard/ProjectAnalysisResults";

export default async function DashboardPage() {
  let session;
  try {
      session = await getSafeSession();
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

  // Fetch project analyses for feed
  const projectResults = await db.query.projectAnalyses.findMany({
      where: eq(projectAnalysesTable.userId, session.user.id),
      orderBy: [desc(projectAnalysesTable.createdAt)],
      limit: 10,
  });

  // Fetch real resumes
  const userResumes = await db.query.resumes.findMany({
    where: eq(resumesTable.userId, session.user.id),
    orderBy: [desc(resumesTable.updatedAt)],
    with: {
        analyses: {
            orderBy: [desc(analysisTable.createdAt)],
            limit: 1,
        },
        versions: {
            orderBy: [desc(resumeVersionsTable.createdAt)],
        }
    }
  });

  // Fetch all analyses for the user's resumes to retrieve the latest score & feedback in memory
  const userResumeIds = userResumes.map(r => r.id);
  const resumeAnalyses = userResumeIds.length > 0 
    ? await db.select({
        id: analysisTable.id,
        resumeId: analysisTable.resumeId,
        score: analysisTable.score,
        feedback: analysisTable.feedback,
        createdAt: analysisTable.createdAt
      })
      .from(analysisTable)
      .where(inArray(analysisTable.resumeId, userResumeIds))
      .orderBy(desc(analysisTable.createdAt))
    : [];
  
  const latestAnalysisMap: Record<string, { id: string; score: number; feedback: unknown }> = {};
  for (const a of resumeAnalyses) {
      if (!latestAnalysisMap[a.resumeId]) {
          latestAnalysisMap[a.resumeId] = {
              id: a.id,
              score: a.score,
              feedback: a.feedback
          };
      }
  }

  const resumesWithStatus = userResumes.map(r => ({
      ...r,
      analyses: latestAnalysisMap[r.id] ? [true] : []
  }));

  // Fetch all analyses for feed
  const allAnalyses = await db.query.analysis.findMany({
      where: (analysis, { inArray: inArrayFn }) => 
        userResumes.length > 0 
          ? inArrayFn(analysis.resumeId, userResumes.map(r => r.id))
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
    icon: React.ComponentType<{ size?: number; className?: string }>;
    customValue?: number;
  };

  const stats: StatItem[] = [
    { label: "Total Resumes", value: resumeCount.value, icon: RiFileTextLine },
    { label: "AI Analyses", value: analysisCount.value, icon: RiCheckboxCircleLine },
    { label: "Role Matches", value: optimisationCount.value, icon: RiFlashlightLine },
    { label: "AI Credits", icon: RiRadarLine, customValue: credits },
  ];

  const vaultItems = resumesWithStatus.map(r => ({
      id: r.id,
      title: r.title || "Untitled Resume",
      date: r.updatedAt,
      hasAnalysis: r.analyses.length > 0,
      parentResumeId: r.parentResumeId,
      targetRole: r.targetRole,
      targetCompany: r.targetCompany,
      latestAnalysis: latestAnalysisMap[r.id] ? {
          score: latestAnalysisMap[r.id].score,
          feedback: latestAnalysisMap[r.id].feedback as ResumeAnalysisData,
      } : undefined,
      versions: r.versions.map(v => ({
          id: v.id,
          title: v.title,
          company: v.company,
          targetRole: v.targetRole,
          matchScore: v.matchScore,
          createdAt: v.createdAt
      }))
  }));


  const intelligenceReports = [
      ...allAnalyses.map(a => ({
          id: a.id,
          type: "analysis" as const,
          title: `Analysis: ${a.resume?.title || "Deleted Resume"}`,
          subtext: `${a.score > 80 ? 'Excellent' : 'Average'} Quality`,
          date: a.createdAt,
          score: a.score,
          fullData: (a.feedback || {}) as ResumeAnalysisData,
      })),
      ...atsResults.map(r => ({
          id: r.id,
          type: "tailoring" as const,
          title: `Match: ${r.resume?.title || "Deleted Resume"}`,
          subtext: `Tailored for Job`,
          date: r.createdAt,
          score: r.matchScore,
          fullData: (r.feedback || {}) as TailoringData,
      })),
      ...projectResults.map(p => {
          let projectTitle = p.url;
          try {
              const urlObj = new URL(p.url);
              projectTitle = `${urlObj.hostname}${urlObj.pathname}`;
          } catch {
              // fallback to raw url
          }
          
          return {
              id: p.id,
              type: "project" as const,
              title: `Project: ${projectTitle}`,
              subtext: `Technical Proof Analysis`,
              date: p.createdAt,
              score: p.score,
              fullData: { ...(p.data as ProjectAnalysisData), url: p.url },
          };
      }),
  ].sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return timeB - timeA;
  }).slice(0, 15);

  return (
    <div className="p-6 md:p-10 pb-32 max-w-[90rem] mx-auto overflow-x-hidden">
      {/* Welcome Banner + Compact Cute Metrics Widget */}
      <div className="mb-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-[#FAF9F6] p-6 md:p-8 rounded-3xl border border-neutral-200/70 shadow-xs">
        {/* Left: Greeting */}
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#0A0A0A]">
              Welcome back{session.user.name ? `, ${session.user.name.split(' ')[0]}` : ''}.
          </h1>
          <p className="text-sm font-medium text-neutral-500 max-w-md leading-relaxed">
            Manage your resumes, application proof, and AI optimizations from your workspace.
          </p>
        </div>

        {/* Right: Cute Compact Metrics Cards (Inspired by Flow UI) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-2xl border border-neutral-200/80 shadow-xs shrink-0">
          {stats.map((stat, i) => (
            <div key={i} className="flex flex-col p-3 rounded-xl bg-[#FAF9F6] border border-neutral-200/60 hover:bg-neutral-100/80 transition-colors min-w-[110px]">
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-lg bg-white border border-neutral-200/70 flex items-center justify-center text-[#0A0A0A] shadow-2xs">
                  <stat.icon size={14} />
                </div>
                <span className="text-xl font-bold tracking-tight text-[#0A0A0A]">
                  {stat.customValue !== undefined ? stat.customValue : stat.value}
                </span>
              </div>
              <span className="text-[11px] font-medium text-neutral-500 truncate">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Cards Grid - 3-Top / 2-Bottom Olympic Rings Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-5 mb-12">
        <div className="lg:col-span-2 h-full">
          <AnalyzeResume />
        </div>
        <div className="lg:col-span-2 h-full">
          <TailorResume resumes={resumesWithStatus as Resume[]} />
        </div>
        <div className="lg:col-span-2 h-full">
          <Link 
            href="/dashboard/resumes/new"
            className="group/card relative overflow-hidden flex flex-col justify-between h-full cursor-pointer transition-all p-7 bg-white border border-neutral-200/80 rounded-3xl hover:border-neutral-300 hover:shadow-xl active:scale-[0.99] group shadow-xs min-h-[200px]"
          >
            <div className="flex items-start justify-between mb-8">
              <div className="w-11 h-11 bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-600 group-hover/card:bg-[#0A0A0A] group-hover/card:text-white transition-colors duration-300">
                <RiAddLine size={22} />
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                  <span className="text-xs font-semibold text-neutral-500">Build Resume</span>
                  <RiArrowRightSLine size={16} className="text-[#0A0A0A]" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-xl mb-1.5 text-[#0A0A0A] tracking-tight">Build New Resume</h3>
              <p className="text-xs text-neutral-500 font-normal leading-relaxed">
                Create a new resume with guided AI suggestions.
              </p>
            </div>
          </Link>
        </div>
        <div className="lg:col-span-3 h-full">
          <ImportResume />
        </div>
        <div className="lg:col-span-3 h-full">
          <ProjectAnalyzerCard />
        </div>
      </div>

      {/* Resume Vault Section */}
      {/* Resume Vault Section */}
      <div className="mt-16">
        <ResumeVault items={vaultItems} />
      </div>

      {/* Performance Insights Section */}
      <div className="mt-16">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-neutral-200/70">
            <h2 className="text-xl md:text-2xl font-bold text-[#0A0A0A] tracking-tight">Performance Insights</h2>
            <span className="text-xs font-medium text-neutral-400">(Recent Activity)</span>
        </div>
        
        {intelligenceReports.length === 0 ? (
            <div className="py-14 bg-white rounded-3xl border border-neutral-200/80 p-8 flex flex-col items-center justify-center text-center shadow-xs">
                <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center text-neutral-500 mb-3 shadow-2xs">
                    <RiArticleLine size={22} />
                </div>
                <p className="text-[#0A0A0A] text-sm font-semibold mb-1">No reports yet</p>
                <p className="text-neutral-500 text-xs font-normal max-w-sm leading-relaxed">
                  Analyze a resume to generate AI insights, score breakdowns, and recommendations here.
                </p>
            </div>
        ) : (
            <InsightsFeed data={intelligenceReports} />
        )}
      </div>
    </div>
  );
}
