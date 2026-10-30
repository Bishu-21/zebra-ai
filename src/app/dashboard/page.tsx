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
import { FeatureIcon } from "@/components/dashboard/FeatureIcon";
import { DashboardPage as DashboardPageFrame } from "@/components/dashboard/DashboardPage";
import { featureChrome } from "@/components/dashboard/feature-chrome";
import { DashboardToolCard } from "@/components/dashboard/DashboardToolCard";
import Link from "next/link";
import { AnalyzeResume } from "@/components/dashboard/AnalyzeResume";
import { TailorResume } from "@/components/dashboard/TailorResume";
import { ImportResume } from "@/components/dashboard/ImportResume";
import { InsightsFeed, type TailoringData } from "@/components/dashboard/InsightsFeed";
import { ResumeVault } from "@/components/dashboard/ResumeVault";
import { ProjectAnalyzerCard } from "@/components/dashboard/ProjectAnalyzerCard";
import { AddApplicationDrawer } from "@/components/dashboard/AddApplicationDrawer";
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
            <p className="text-sm text-muted-foreground">Unable to connect to the session server. Please try refreshing.</p>
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
          We could not load your workspace. Refresh the page to try again.
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
      title: "Start an application",
      description: "Add a role and your resume, then review suggestions in your application workspace.",
      actionLabel: "Start an application",
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
      } else if (!latestApp.resumeVersionId) {
          nextAction = {
              title: `Continue application: ${latestApp.position} @ ${latestApp.company}`,
              description: "Generate and review role-specific suggestions before exporting.",
              actionLabel: "Prepare application",
              actionHref: `/dashboard/applications/${latestApp.id}?step=suggestions`
          };
      } else if (latestApp.status === "Draft" || latestApp.status === "Preparing" || latestApp.status === "Ready") {
          nextAction = {
              title: `Continue application: ${latestApp.position} @ ${latestApp.company}`,
              description: "A tailored version exists. Review the document before export and submission.",
              actionLabel: "Review and export",
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



  const [
    projectResults,
    userResumes,
    atsResults,
    [resumeCount],
    [analysisCount],
    [optimisationCount],
    currentUser,
  ] = await Promise.all([
    db.query.projectAnalyses.findMany({
      where: eq(projectAnalysesTable.userId, session.user.id),
      orderBy: [desc(projectAnalysesTable.createdAt)],
      limit: 10,
    }),
    db.query.resumes.findMany({
      where: eq(resumesTable.userId, session.user.id),
      orderBy: [desc(resumesTable.updatedAt)],
      limit: 25,
      columns: {
        id: true,
        title: true,
        updatedAt: true,
        parentResumeId: true,
        targetRole: true,
        targetCompany: true,
      },
      with: {
        versions: {
          orderBy: [desc(resumeVersionsTable.createdAt)],
          limit: 10,
        },
      },
    }),
    db.query.atsOptimisations.findMany({
      where: eq(atsOptimisationsTable.userId, session.user.id),
      orderBy: [desc(atsOptimisationsTable.createdAt)],
      limit: 10,
      with: { resume: { columns: { id: true, title: true } } },
    }),
    db.select({ value: count() }).from(resumesTable).where(eq(resumesTable.userId, session.user.id)),
    db.select({ value: count() })
      .from(analysisTable)
      .innerJoin(resumesTable, eq(analysisTable.resumeId, resumesTable.id))
      .where(eq(resumesTable.userId, session.user.id)),
    db.select({ value: count() }).from(atsOptimisationsTable).where(eq(atsOptimisationsTable.userId, session.user.id)),
    db.query.user.findFirst({
      where: eq(userTable.id, session.user.id),
      columns: { credits: true },
    }),
  ]);

  // Fetch all analyses for the user's resumes to retrieve the latest score & feedback in memory
  const userResumeIds = userResumes.map(r => r.id);
  const [resumeAnalyses, allAnalyses] = await Promise.all([
    userResumeIds.length > 0 ? db.selectDistinctOn([analysisTable.resumeId], {
        resumeId: analysisTable.resumeId,
        score: analysisTable.score,
        feedback: analysisTable.feedback,
      })
      .from(analysisTable)
      .where(inArray(analysisTable.resumeId, userResumeIds))
      .orderBy(analysisTable.resumeId, desc(analysisTable.createdAt)) : Promise.resolve([]),
    db.query.analysis.findMany({
      where: (analysis, { inArray: inArrayFn }) =>
        userResumes.length > 0
          ? inArrayFn(analysis.resumeId, userResumes.map(r => r.id))
          : eq(analysis.id, "none"),
      orderBy: [desc(analysisTable.createdAt)],
      limit: 10,
      with: { resume: { columns: { id: true, title: true } } },
    }),
  ]);
  
  const latestAnalysisMap: Record<string, { score: number | null; feedback: unknown }> = {};
  for (const a of resumeAnalyses) {
      latestAnalysisMap[a.resumeId] = { score: a.score, feedback: a.feedback };
  }

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


  const vaultItems = userResumes.map(r => ({
      id: r.id,
      title: r.title || "Untitled Resume",
      date: r.updatedAt,
      hasAnalysis: Boolean(latestAnalysisMap[r.id]),
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
          subtext: a.score == null ? "Review saved" : `${a.score > 80 ? "Excellent" : "Average"} Quality`,
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
    <DashboardPageFrame className="max-w-[90rem]">
      <div className="space-y-5">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              <FeatureIcon feature="Home" size={18} className="text-muted-foreground" />
              Welcome back{session.user.name ? `, ${session.user.name.split(' ')[0]}` : ''}.
          </h1>
          <p className="max-w-md text-sm font-normal leading-6 text-muted-foreground">
            Manage your resumes, reviews, and applications.
          </p>
        </div>

        {/* Right: Metrics Cards */}
        <div className="grid min-w-0 w-full grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((stat, i) => (
            <div key={i} className="flex min-w-0 flex-col p-4 rounded-xl bg-white border border-neutral-200/80">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="w-7 h-7 flex items-center justify-center text-neutral-600">
                  <stat.icon size={14} />
                </div>
                <span className="max-w-full break-all text-xl font-bold tabular-nums tracking-tight text-foreground">
                  {stat.customValue !== undefined ? stat.customValue : stat.value}
                </span>
              </div>
              <span className="break-words text-sm font-medium text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Next application step */}
      <div className={`${featureChrome.card} flex flex-col items-start justify-between gap-5 p-5 md:flex-row md:items-center`}>
        <div className="max-w-2xl space-y-2">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {nextAction.title}
          </h2>
          <p className="text-sm font-normal leading-6 text-muted-foreground">
            {nextAction.description}
          </p>
        </div>

        {latestApp ? <Link
          href={nextAction.actionHref}
          className={`${featureChrome.primaryButton} shrink-0`}
        >
          <span>{nextAction.actionLabel}</span>
          <RiArrowRightSLine size={16} />
        </Link> : <div className="w-full md:w-auto shrink-0"><AddApplicationDrawer onboarding resumes={userResumes.map(({ id, title }) => ({ id, title }))} /></div>}
      </div>

      {/* Two secondary destinations keep the home page focused. */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/dashboard/resumes" className="group flex min-h-24 items-center justify-between rounded-2xl border border-neutral-200/70 bg-white p-5">
          <div className="flex items-center gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-neutral-700"><FeatureIcon feature="Resumes" size={18} /></span>
            <div><h2 className="text-sm font-semibold">Manage resumes</h2><p className="mt-1 text-sm text-muted-foreground">Open, create, or review a resume.</p></div>
          </div>
          <RiArrowRightSLine className="text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link href="/dashboard/job-tracker" className="group flex min-h-24 items-center justify-between rounded-2xl border border-neutral-200/70 bg-white p-5">
          <div className="flex items-center gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-neutral-700"><FeatureIcon feature="Applications" size={18} /></span>
            <div><h2 className="text-sm font-semibold">View applications</h2><p className="mt-1 text-sm text-muted-foreground">Track roles, deadlines, and progress.</p></div>
          </div>
          <RiArrowRightSLine className="text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <details className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs">
        <summary className="cursor-pointer text-sm font-bold text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">More tools</summary>
      <section aria-labelledby="workspace-actions-title" className="mb-12 mt-8">
        <div className="mb-5">
          <h2 id="workspace-actions-title" className="text-xl font-bold tracking-tight text-foreground md:text-2xl">Create and improve</h2>
          <p className="mt-1 text-sm text-neutral-600">Review or import a resume, match it to a role, build a new one, or add project evidence.</p>
        </div>
        <div className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="min-w-0">
          <AnalyzeResume />
        </div>
        <div className="min-w-0">
          <TailorResume resumes={userResumes.map(({ id, title }) => ({ id, title }))} />
        </div>
        <div className="min-w-0">
          <DashboardToolCard
            href="/dashboard/resumes/new"
            icon={RiAddLine}
            title="Build new resume"
            description="Create a new resume with guided AI suggestions."
          />
        </div>
        <div className="min-w-0">
          <ImportResume />
        </div>
        <div className="min-w-0">
          <ProjectAnalyzerCard />
        </div>
        </div>
      </section>

      {/* Resume Vault Section */}
      <div className="mt-12">
        <ResumeVault items={vaultItems} />
      </div>

      {/* Recent Activity Section */}
      <div className="mt-12">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-neutral-200/70">
            <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">Recent Activity</h2>
        </div>

        
        {intelligenceReports.length === 0 ? (
            <div className="py-14 bg-white rounded-3xl border border-neutral-200/80 p-8 flex flex-col items-center justify-center text-center shadow-xs">
                <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center text-muted-foreground mb-3 shadow-2xs">
                    <RiArticleLine size={22} />
                </div>
                <p className="text-foreground text-sm font-semibold mb-1">No reports yet</p>
                <p className="text-muted-foreground text-xs font-normal max-w-sm leading-relaxed">
                  Analyze a resume to generate AI insights, score breakdowns, and recommendations here.
                </p>
            </div>
        ) : (
            <InsightsFeed data={intelligenceReports} />
        )}
      </div>
      </details>
    </DashboardPageFrame>
  );
}
