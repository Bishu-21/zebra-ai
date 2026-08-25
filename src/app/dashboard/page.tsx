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
import { db, sanitizeSecretText } from "@/lib/db";
import { 
    user as userTable,
    resumes as resumesTable, 
    analysis as analysisTable, 
    atsOptimisations as atsOptimisationsTable,
    resumeVersions as resumeVersionsTable,
    projectAnalyses as projectAnalysesTable,
    applications as applicationsTable
} from "@/lib/schema";
import { eq, desc, count, inArray } from "drizzle-orm";
import { ResumeAnalysisData } from "@/components/compiler/types";
import { ProjectAnalysisData } from "@/components/dashboard/ProjectAnalysisResults";

export default async function DashboardPage() {
  let session;
  try {
      session = await getSafeSession();
  } catch (error) {
      const msg = sanitizeSecretText(error instanceof Error ? error.message : String(error));
      console.error("Dashboard Session Check Failed:", msg);
      return (
        <div className="p-12 text-center">
            <h1 className="text-2xl font-bold mb-4">Connection Issue</h1>
            <p className="text-sm text-[#737373]">Unable to connect to the session server. Please try refreshing.</p>
        </div>
      );
  }

  if (!session) return null;

  try {
    return await renderDashboardContent(session);
  } catch (error) {
    const msg = sanitizeSecretText(error instanceof Error ? error.message : String(error));
    console.error("[Dashboard Page] DB connectivity error:", msg);
    return (
      <div className="p-10 max-w-4xl mx-auto my-12 bg-amber-50 border border-amber-200 rounded-3xl text-center space-y-4 shadow-sm">
        <h2 className="text-2xl font-bold text-amber-900">Database Service Temporarily Unavailable</h2>
        <p className="text-sm text-amber-800 max-w-md mx-auto leading-relaxed">
          We are currently experiencing transient connectivity issues with our database service. Your data is safe. Please refresh the page in a few moments.
        </p>
        <a 
          href="/dashboard"
          className="inline-block px-5 py-2.5 bg-amber-900 text-white font-semibold text-xs rounded-xl hover:bg-amber-950 transition-colors shadow-xs"
        >
          Refresh Page
        </a>
      </div>
    );
  }
}

async function renderDashboardContent(session: NonNullable<Awaited<ReturnType<typeof getSafeSession>>>) {
  // Fetch latest active application for primary user journey anchor
  const latestApp = await db.query.applications.findFirst({
      where: eq(applicationsTable.userId, session.user.id),
      orderBy: [desc(applicationsTable.updatedAt)],
      with: {
          selectedResume: true,
          changes: true,
      }
  });

  const pendingChangesCount = latestApp?.changes?.filter(c => c.status === "pending").length || 0;

  let nextAction = {
      title: "Add application",
      description: "Track a role you are applying for.",
      actionLabel: "Add application",
      actionHref: "/dashboard/job-tracker"
  };

  if (latestApp) {
      if (pendingChangesCount > 0) {
          nextAction = {
              title: `Continue application: ${latestApp.position} @ ${latestApp.company}`,
              description: `You have ${pendingChangesCount} suggestions ready for approval. Review before sending.`,
              actionLabel: "Review suggestions",
              actionHref: `/dashboard/applications/${latestApp.id}?step=suggestions`
          };
      } else if (!latestApp.selectedResumeId) {
          nextAction = {
              title: `Continue application: ${latestApp.position} @ ${latestApp.company}`,
              description: "Attach or import a resume to tailor for this position.",
              actionLabel: "Continue",
              actionHref: `/dashboard/applications/${latestApp.id}?step=resume`
          };
      } else if (latestApp.status === "Tailoring" || latestApp.status === "Draft" || latestApp.status === "Preparing") {
          nextAction = {
              title: `Continue application: ${latestApp.position} @ ${latestApp.company}`,
              description: "Your tailored profile is ready. Check final document and export.",
              actionLabel: "Export resume",
              actionHref: `/dashboard/applications/${latestApp.id}?step=export`
          };
      } else {
          nextAction = {
              title: `Application: ${latestApp.position} @ ${latestApp.company}`,
              description: `Status: ${latestApp.status}. Follow up or mark next interview stage.`,
              actionLabel: "Continue",
              actionHref: `/dashboard/applications/${latestApp.id}`
          };
      }
  }



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
    { label: "My Resumes", value: resumeCount.value, icon: RiFileTextLine },
    { label: "Resume Reviews", value: analysisCount.value, icon: RiCheckboxCircleLine },
    { label: "Role Matches", value: optimisationCount.value, icon: RiFlashlightLine },
    { label: "Credits", icon: RiRadarLine, customValue: credits },
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
      <div className="mb-8 flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-[#FAF9F6] p-6 md:p-8 rounded-3xl border border-neutral-200/70 shadow-xs">
        {/* Left: Greeting */}
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#0A0A0A]">
              Welcome back{session.user.name ? `, ${session.user.name.split(' ')[0]}` : ''}.
          </h1>
          <p className="text-sm font-medium text-neutral-500 max-w-md leading-relaxed">
            Manage your resumes, application proof, and AI optimizations from your workspace.
          </p>
        </div>

        {/* Right: Metrics Cards */}
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
              <span className="text-xs font-medium text-neutral-500 truncate">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Primary User Journey Hero Anchor: Continue Your Application */}
      <div className="mb-10 p-6 md:p-8 bg-[#0A0A0A] text-white rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            {nextAction.title}
          </h2>
          <p className="text-xs md:text-sm text-neutral-400 font-normal leading-relaxed">
            {nextAction.description}
          </p>
        </div>

        <Link
          href={nextAction.actionHref}
          className="inline-flex items-center gap-2 bg-white text-[#0A0A0A] px-6 py-3 rounded-xl font-bold text-xs hover:bg-neutral-100 transition-all shadow-md active:scale-95 shrink-0"
        >
          <span>{nextAction.actionLabel}</span>
          <RiArrowRightSLine size={16} />
        </Link>
      </div>

      {/* Two secondary destinations keep the home page focused. */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/dashboard/resumes" className="group flex min-h-24 items-center justify-between rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs transition hover:border-neutral-300 hover:shadow-md">
          <div className="flex items-center gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700"><RiFileTextLine size={19} /></span>
            <div><h2 className="text-sm font-bold">Manage resumes</h2><p className="mt-1 text-xs text-neutral-500">Open, create, or review a resume.</p></div>
          </div>
          <RiArrowRightSLine className="text-neutral-400 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link href="/dashboard/job-tracker" className="group flex min-h-24 items-center justify-between rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs transition hover:border-neutral-300 hover:shadow-md">
          <div className="flex items-center gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700"><RiFlashlightLine size={19} /></span>
            <div><h2 className="text-sm font-bold">View applications</h2><p className="mt-1 text-xs text-neutral-500">Track roles, deadlines, and progress.</p></div>
          </div>
          <RiArrowRightSLine className="text-neutral-400 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <details className="group rounded-3xl border border-neutral-200/70 bg-[#FAF9F6] shadow-xs [&>summary::-webkit-details-marker]:hidden">
        <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between rounded-3xl px-5 py-4 transition hover:bg-white md:px-6">
          <div><h2 className="text-sm font-bold">More tools</h2><p className="mt-1 text-xs text-neutral-500">Analysis, role matching, imports, projects, and recent work.</p></div>
          <RiArrowRightSLine className="text-neutral-500 transition-transform group-open:rotate-90" size={18} />
        </summary>
        <div className="border-t border-neutral-200/70 px-4 pb-8 pt-6 md:px-6">
      {/* Supporting tools stay available without competing with the primary task. */}
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
              <div className="w-11 h-11 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-600 group-hover/card:bg-[#0A0A0A] group-hover/card:text-white transition-colors duration-300">
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
      <div className="mt-16">
        <ResumeVault items={vaultItems} />
      </div>

      {/* Recent Activity Section */}
      <div className="mt-16">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-neutral-200/70">
            <h2 className="text-xl md:text-2xl font-bold text-[#0A0A0A] tracking-tight">Recent Activity</h2>
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
      </details>
    </div>
  );
}
