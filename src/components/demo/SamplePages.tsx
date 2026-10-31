"use client";

import { Suspense } from "react";
import {
    RiArrowRightSLine,
    RiBarChartGroupedLine,
    RiCheckboxCircleLine,
    RiCompass3Line,
    RiFileTextLine,
    RiFlashlightLine,
    RiRadarLine,
    RiStackLine,
    RiTimeLine,
    RiTimerFlashLine,
} from "react-icons/ri";
import { AnalyzeResume } from "@/components/dashboard/AnalyzeResume";
import { ImportResume } from "@/components/dashboard/ImportResume";
import { TailorResume } from "@/components/dashboard/TailorResume";
import { ProjectAnalyzerCard } from "@/components/dashboard/ProjectAnalyzerCard";
import { DashboardPage, DashboardPageHeader, DashboardStat } from "@/components/dashboard/DashboardPage";
import { FeatureIcon } from "@/components/dashboard/FeatureIcon";
import { featureChrome } from "@/components/dashboard/feature-chrome";
import { DashboardHref } from "@/components/dashboard/DashboardLink";
import { JobBoard } from "@/components/dashboard/JobBoard";
import { AddApplicationDrawer } from "@/components/dashboard/AddApplicationDrawer";
import { ApplicationWorkspace } from "@/components/dashboard/ApplicationWorkspace";
import { GenerateCoverLetter } from "@/components/dashboard/GenerateCoverLetter";
import { CoverLetterActions } from "@/components/dashboard/CoverLetterActions";
import { PortfolioStatusCard } from "@/components/dashboard/PortfolioStatusCard";
import { LinkedInOptimizer } from "@/components/dashboard/LinkedInOptimizer";
import { LinkedInDraftReview } from "@/components/dashboard/LinkedInDraftReview";
import { SettingsView } from "@/components/dashboard/SettingsView";
import { AppIcon } from "@/components/ui/AppIcon";
import { APPLICATION_WORKSPACE_FIXTURE } from "@/lib/application-workspace-fixture";
import {
    PRODUCT_DEMO_COVER_LETTER,
    PRODUCT_DEMO_RESUME,
    PRODUCT_DEMO_WORK_ITEMS,
} from "@/lib/product-demo-fixture";
import type { LinkedInDraft } from "@/lib/linkedin-workflow";
import WorkPage from "@/app/dashboard/work/page";

const resumeOption = { id: PRODUCT_DEMO_RESUME.id, title: PRODUCT_DEMO_RESUME.title };

const demoJobs = [
    {
        id: APPLICATION_WORKSPACE_FIXTURE.application.id,
        recordType: "application" as const,
        company: APPLICATION_WORKSPACE_FIXTURE.application.company,
        position: APPLICATION_WORKSPACE_FIXTURE.application.position,
        status: "Preparing" as const,
        url: APPLICATION_WORKSPACE_FIXTURE.application.url,
        description: APPLICATION_WORKSPACE_FIXTURE.application.jobDescription,
        resumeId: APPLICATION_WORKSPACE_FIXTURE.application.selectedResumeId,
        deadline: APPLICATION_WORKSPACE_FIXTURE.application.deadline,
        updatedAt: "2026-10-20T12:00:00.000Z",
    },
];

const linkedInDrafts: LinkedInDraft[] = [
    {
        id: "example-draft",
        field: "headline",
        sourceQuote: "I build accessible React interfaces for public services.",
        proposedText: "Frontend Engineer | React and TypeScript | Accessible public services",
        rationale: "Connects the target role with the work described in the source text.",
        status: "proposed",
        editedText: null,
    },
];

function HomePage() {
    return (
        <DashboardPage className="max-w-[90rem]">
            <div className="space-y-5">
                <div className="space-y-1">
                    <h1 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                        <FeatureIcon feature="Home" size={18} className="text-muted-foreground" />
                        Welcome back, Jordan.
                    </h1>
                    <p className="max-w-md text-sm font-normal leading-6 text-muted-foreground">
                        Manage your resumes, reviews, and applications.
                    </p>
                </div>
                <div className="grid min-w-0 w-full grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                        { label: "My Resumes", value: 1, icon: RiFileTextLine },
                        { label: "Resume Reviews", value: 1, icon: RiCheckboxCircleLine },
                        { label: "Saved matches", value: 1, icon: RiFlashlightLine },
                        { label: "Credits", value: 3, icon: RiRadarLine },
                    ].map((stat) => (
                        <div key={stat.label} className="flex min-w-0 flex-col rounded-xl border border-neutral-200/80 bg-white p-4">
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex h-7 w-7 items-center justify-center text-neutral-600">
                                    <stat.icon size={14} />
                                </div>
                                <span className="text-xl font-bold tabular-nums tracking-tight text-foreground">{stat.value}</span>
                            </div>
                            <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className={`${featureChrome.card} flex flex-col items-start justify-between gap-5 p-5 md:flex-row md:items-center`}>
                <div className="max-w-2xl space-y-2">
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">Frontend Engineer at Riverbend Civic Lab</h2>
                    <p className="text-sm font-normal leading-6 text-muted-foreground">Preparing. Open the application to review suggestions before you export.</p>
                </div>
                <DashboardHref href={`/dashboard/applications/${APPLICATION_WORKSPACE_FIXTURE.application.id}`} className={`${featureChrome.primaryButton} shrink-0`}>
                    <span>Open application</span>
                    <RiArrowRightSLine size={16} />
                </DashboardHref>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DashboardHref href="/dashboard/resumes" className="group flex min-h-24 items-center justify-between rounded-2xl border border-neutral-200/70 bg-white p-5">
                    <div className="flex items-center gap-4">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-neutral-700"><FeatureIcon feature="Resumes" size={18} /></span>
                        <div><h2 className="text-sm font-semibold">Manage resumes</h2><p className="mt-1 text-sm text-muted-foreground">Open, create, or review a resume.</p></div>
                    </div>
                    <RiArrowRightSLine className="text-muted-foreground" />
                </DashboardHref>
                <DashboardHref href="/dashboard/job-tracker" className="group flex min-h-24 items-center justify-between rounded-2xl border border-neutral-200/70 bg-white p-5">
                    <div className="flex items-center gap-4">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-neutral-700"><FeatureIcon feature="Applications" size={18} /></span>
                        <div><h2 className="text-sm font-semibold">View applications</h2><p className="mt-1 text-sm text-muted-foreground">Track roles, deadlines, and progress.</p></div>
                    </div>
                    <RiArrowRightSLine className="text-muted-foreground" />
                </DashboardHref>
            </div>

            <section className="mb-12 mt-8">
                <div className="mb-5">
                    <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">Prepare your next application</h2>
                    <p className="mt-1 text-sm text-neutral-600">Import a resume (free), review it (1 credit), then attach it to a job and approve edits before you export a PDF.</p>
                </div>
                <div className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <ImportResume />
                    <AnalyzeResume />
                    <TailorResume resumes={[resumeOption]} />
                    <ProjectAnalyzerCard />
                </div>
            </section>
        </DashboardPage>
    );
}

function ResumesPage() {
    return (
        <DashboardPage className="max-[640px]:pr-16">
            <DashboardPageHeader
                title="Resumes"
                description="Import or create a resume, review it, and save versions for specific roles."
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <ImportResume />
                <TailorResume resumes={[resumeOption]} />
                <AnalyzeResume />
                <ProjectAnalyzerCard />
            </div>
            <section className="space-y-4">
                <h2 className={`${featureChrome.sectionTitle} flex items-center gap-2`}>
                    <FeatureIcon feature="Resumes" size={16} className="text-muted-foreground" />
                    Your resumes
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className={`${featureChrome.card} justify-between gap-4`}>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-medium text-muted-foreground">Base resume</span>
                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                    <AppIcon icon={RiTimeLine} size={12} /> 11d ago
                                </span>
                            </div>
                            <h3 className="line-clamp-1 text-sm font-semibold tracking-tight text-foreground">{PRODUCT_DEMO_RESUME.title}</h3>
                            <p className="text-sm leading-6 text-muted-foreground">Open this resume to review or edit its structured content.</p>
                        </div>
                    </div>
                </div>
            </section>
        </DashboardPage>
    );
}

function ApplicationsBoard() {
    return (
        <DashboardPage className="space-y-6">
            <DashboardPageHeader
                title="Applications"
                description="Track each opportunity, its documents, and the next stage from one workspace."
                actions={
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="grid grid-cols-2 gap-2">
                            <DashboardStat label="Applications" value={1} />
                            <DashboardStat label="Interview rate" value="Unknown" />
                        </div>
                        <AddApplicationDrawer resumes={[resumeOption]} />
                    </div>
                }
            />
            <JobBoard initialJobs={demoJobs} resumes={[resumeOption]} versions={[]} />
        </DashboardPage>
    );
}

function CoverLettersPage() {
    return (
        <DashboardPage>
            <div className="flex flex-col gap-4 font-sans md:flex-row md:items-center md:justify-between">
                <div className="max-w-2xl">
                    <div className="flex items-center gap-2.5">
                        <FeatureIcon feature="Cover Letters" size={18} className="text-muted-foreground" />
                        <h1 className="text-xl font-semibold tracking-tight text-foreground">Cover Letters</h1>
                    </div>
                    <p className="mt-1 font-sans text-sm font-normal leading-6 text-muted-foreground">
                        Create evidence-grounded drafts for a specific role, then review and edit every claim before use.
                    </p>
                </div>
                <GenerateCoverLetter resumes={[resumeOption]} />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className={`${featureChrome.card} group relative`}>
                    <div className="flex items-center justify-between gap-2">
                        <FeatureIcon feature="Cover Letters" size={18} className="text-muted-foreground" />
                        <div className="flex items-center gap-1 font-sans text-xs text-muted-foreground">
                            <AppIcon icon={RiTimeLine} size={12} /> 11d ago
                        </div>
                    </div>
                    <div className="mt-3 flex-grow">
                        <h3 className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-foreground">{PRODUCT_DEMO_COVER_LETTER.title}</h3>
                        <p className="mt-1 line-clamp-3 font-sans text-sm leading-6 text-muted-foreground">{PRODUCT_DEMO_COVER_LETTER.content}</p>
                    </div>
                    <CoverLetterActions letter={{ ...PRODUCT_DEMO_COVER_LETTER, candidateName: "Jordan Hale" }} />
                </div>
            </div>
        </DashboardPage>
    );
}

function PortfolioPage() {
    return (
        <DashboardPage>
            <DashboardPageHeader
                title="Portfolio"
                description="Choose which work and credentials appear on your public portfolio."
            />
            <PortfolioStatusCard
                slug="example-jordan-hale"
                title="Jordan Hale"
                selectedWorkIds={PRODUCT_DEMO_WORK_ITEMS.map((item) => item.id)}
                isPublished={false}
            />
            <div className="space-y-4">
                <h2 className={`${featureChrome.sectionTitle} flex items-center gap-2`}>
                    <FeatureIcon feature="Work" size={16} className="text-muted-foreground" /> Work items (1)
                </h2>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {PRODUCT_DEMO_WORK_ITEMS.map((item) => (
                        <div key={item.id} className={featureChrome.card}>
                            <p className="text-sm font-semibold">{item.title}</p>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardPage>
    );
}

function AnalyticsPage() {
    const stats = [
        { label: "Saved resumes", value: "1", sub: "Documents in your workspace", icon: RiStackLine },
        { label: "Open applications", value: "1", sub: "Not rejected, withdrawn, or offer", icon: RiRadarLine },
        { label: "Average resume review", value: "No reviews yet", sub: "Review a resume to see your progress.", icon: RiCompass3Line },
        { label: "Saved analyses", value: "1", sub: "Resume review reports", icon: RiBarChartGroupedLine },
    ];
    return (
        <DashboardPage>
            <DashboardPageHeader
                title="Analytics"
                description="Counts of resumes, applications, and reviews already saved in your workspace. This is not employer or ATS performance."
            />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <div key={stat.label} className="relative rounded-2xl border border-neutral-200/70 bg-white p-5">
                        <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-muted text-[#0A0A0A]">
                            <stat.icon size={20} />
                        </div>
                        <p className="mb-1 text-xs font-medium text-muted-foreground">{stat.label}</p>
                        <h3 className={`${stat.value === "No reviews yet" ? "text-lg" : "text-2xl"} font-semibold tracking-tight`}>{stat.value}</h3>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">{stat.sub}</p>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200/70 bg-white p-5 md:p-6 lg:col-span-2">
                    <div className="mb-10 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold tracking-tight">Resume score progress</h2>
                            <p className="mt-1 text-sm text-muted-foreground">Your latest saved analyses</p>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl border border-black/5 bg-[#FAFAFA] px-4 py-2">
                            <RiTimerFlashLine size={18} />
                            <span className="text-xs font-semibold">Saved data</span>
                        </div>
                    </div>
                    <p className="self-center text-sm text-muted-foreground">Sample workspace. Sign in to chart your own reviews.</p>
                </div>
                <div className="relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200/70 bg-white p-5 md:p-6">
                    <h2 className="mb-6 text-base font-semibold tracking-tight">Recent activity</h2>
                    <div className="flex gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <RiFlashlightLine size={14} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold tracking-tight">Frontend Engineer</p>
                            <p className="mt-1 text-xs text-muted-foreground">Riverbend Civic Lab · Preparing</p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardPage>
    );
}

export function SamplePage({ pathname }: { pathname: string }) {
    if (pathname.startsWith("/dashboard/applications/")) {
        return (
            <Suspense fallback={null}>
                <ApplicationWorkspace
                    initialApplication={APPLICATION_WORKSPACE_FIXTURE.application}
                    resumes={APPLICATION_WORKSPACE_FIXTURE.resumes}
                    workItems={APPLICATION_WORKSPACE_FIXTURE.workItems}
                    certifications={[]}
                />
            </Suspense>
        );
    }
    if (pathname.startsWith("/dashboard/resumes")) return <ResumesPage />;
    if (pathname.startsWith("/dashboard/job-tracker")) return <ApplicationsBoard />;
    if (pathname.startsWith("/dashboard/work")) return <WorkPage />;
    if (pathname.startsWith("/dashboard/cover-letters")) return <CoverLettersPage />;
    if (pathname.startsWith("/dashboard/portfolio")) return <PortfolioPage />;
    if (pathname.startsWith("/dashboard/linkedin")) {
        return (
            <LinkedInOptimizer
                initialDrafts={linkedInDrafts}
                initialUrl="https://www.linkedin.com/in/example-jordan-hale"
                initialTargetRole="Frontend Engineer"
            >
                <LinkedInDraftReview auditId="example-only" drafts={linkedInDrafts} onChange={() => undefined} />
            </LinkedInOptimizer>
        );
    }
    if (pathname.startsWith("/dashboard/analytics")) return <AnalyticsPage />;
    if (pathname.startsWith("/dashboard/settings")) {
        return (
            <Suspense fallback={null}>
                <SettingsView connectionProviders={{ linkedin: false, github: false }} githubAppConfigured={false} />
            </Suspense>
        );
    }
    return <HomePage />;
}
