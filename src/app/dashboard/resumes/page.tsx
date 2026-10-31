import React from "react";
import { getDashboardSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { resumes as resumesTable, resumeVersions as resumeVersionsTable } from "@/lib/schema";
import { and, eq, desc, lt, or } from "drizzle-orm";
import Link from "next/link";
import {
    RiAddLine,
    RiTimeLine,
    RiDownload2Line,
} from "react-icons/ri";
import { ImportResume } from "@/components/dashboard/ImportResume";
import { TailorResume } from "@/components/dashboard/TailorResume";
import { decodeCursor, paginateRows } from "@/lib/pagination";
import { DashboardPage, DashboardPageHeader } from "@/components/dashboard/DashboardPage";
import { FeatureIcon } from "@/components/dashboard/FeatureIcon";
import { AppIcon } from "@/components/ui/AppIcon";
import { featureChrome } from "@/components/dashboard/feature-chrome";

function formatTimeAgo(date: Date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

export default async function ResumesPage({ searchParams }: { searchParams: Promise<{ masterCursor?: string; versionCursor?: string }> }) {
    const session = await getDashboardSession();
    if (!session) return null;
    const params = await searchParams;
    const masterCursor = decodeCursor(params.masterCursor);
    const versionCursor = decodeCursor(params.versionCursor);
    const pageLimit = 24;

    const masterRows = await db.select({
        id: resumesTable.id,
        title: resumesTable.title,
        updatedAt: resumesTable.updatedAt,
    }).from(resumesTable).where(and(
        eq(resumesTable.userId, session.user.id),
        masterCursor ? or(
            lt(resumesTable.updatedAt, masterCursor.timestamp),
            and(eq(resumesTable.updatedAt, masterCursor.timestamp), lt(resumesTable.id, masterCursor.id)),
        ) : undefined,
    )).orderBy(desc(resumesTable.updatedAt), desc(resumesTable.id)).limit(pageLimit + 1);
    const masterPage = paginateRows(masterRows, pageLimit, resume => ({ id: resume.id, timestamp: resume.updatedAt }));
    const masterResumes = masterPage.items;

    const versionRows = await db.select({
        id: resumeVersionsTable.id,
        resumeId: resumeVersionsTable.resumeId,
        title: resumeVersionsTable.title,
        company: resumeVersionsTable.company,
        targetRole: resumeVersionsTable.targetRole,
        matchScore: resumeVersionsTable.matchScore,
        createdAt: resumeVersionsTable.createdAt,
    }).from(resumeVersionsTable).where(and(
        eq(resumeVersionsTable.userId, session.user.id),
        versionCursor ? or(
            lt(resumeVersionsTable.createdAt, versionCursor.timestamp),
            and(eq(resumeVersionsTable.createdAt, versionCursor.timestamp), lt(resumeVersionsTable.id, versionCursor.id)),
        ) : undefined,
    )).orderBy(desc(resumeVersionsTable.createdAt), desc(resumeVersionsTable.id)).limit(pageLimit + 1);
    const versionPage = paginateRows(versionRows, pageLimit, version => ({ id: version.id, timestamp: version.createdAt }));
    const tailoredVersions = versionPage.items;

    const formattedResumes = masterResumes.map(r => ({
        id: r.id,
        title: r.title,
        updatedAt: r.updatedAt.toISOString(),
    }));

    return (
        <DashboardPage className="max-[640px]:pr-16">
            <DashboardPageHeader
                title="Resumes"
                description="Import or create a resume, review it, and save versions for specific roles."
                actions={
                    <Link href="/dashboard/resumes/new" className={featureChrome.primaryButton}>
                        <AppIcon icon={RiAddLine} size={16} />
                        Create resume
                    </Link>
                }
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <ImportResume />
                <TailorResume resumes={formattedResumes} />
            </div>

            <section className="space-y-4">
                <h2 className={`${featureChrome.sectionTitle} flex items-center gap-2`}>
                    <FeatureIcon feature="Resumes" size={16} className="text-muted-foreground" />
                    Your resumes
                </h2>

                {masterResumes.length === 0 ? (
                    <div className={featureChrome.emptyState}>
                        <FeatureIcon feature="Resumes" size={22} className="text-muted-foreground" />
                        <h3 className="mt-4 text-base font-semibold tracking-tight text-foreground">No resumes yet</h3>
                        <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
                            Import an existing resume above, or create one to start editing.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {masterResumes.map((resume) => (
                            <div key={resume.id} className={`${featureChrome.card} justify-between gap-4`}>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-medium text-muted-foreground">Base resume</span>
                                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                            <AppIcon icon={RiTimeLine} size={12} />
                                            {formatTimeAgo(resume.updatedAt)}
                                        </span>
                                    </div>
                                    <h3 className="line-clamp-1 text-sm font-semibold tracking-tight text-foreground">
                                        {resume.title}
                                    </h3>
                                    <p className="text-sm leading-6 text-muted-foreground">
                                        Open this resume to review or edit its structured content.
                                    </p>
                                </div>
                                <div className="flex items-center justify-between gap-2 border-t border-neutral-200/70 pt-3">
                                    <Link
                                        href={`/dashboard/resumes/${resume.id}`}
                                        className="text-sm font-medium text-foreground hover:underline"
                                    >
                                        Edit resume
                                    </Link>
                                    <Link
                                        href={`/api/export/pdf?id=${resume.id}`}
                                        target="_blank"
                                        className={featureChrome.iconButton}
                                        aria-label="Download PDF"
                                    >
                                        <AppIcon icon={RiDownload2Line} size={16} />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {masterPage.page.nextCursor && (
                    <Link
                        href={`/dashboard/resumes?masterCursor=${encodeURIComponent(masterPage.page.nextCursor)}${params.versionCursor ? `&versionCursor=${encodeURIComponent(params.versionCursor)}` : ""}`}
                        className={featureChrome.secondaryButton}
                    >
                        View older resumes
                    </Link>
                )}
            </section>

            {tailoredVersions.length > 0 && (
                <section className="space-y-4">
                    <h2 className={featureChrome.sectionTitle}>Tailored versions</h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {tailoredVersions.map((ver) => (
                            <div key={ver.id} className={`${featureChrome.card} justify-between gap-4`}>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-medium text-muted-foreground">Tailored version</span>
                                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                            <AppIcon icon={RiTimeLine} size={12} />
                                            {formatTimeAgo(ver.createdAt)}
                                        </span>
                                    </div>
                                    <h3 className="line-clamp-1 text-sm font-semibold tracking-tight text-foreground">
                                        {ver.title}
                                    </h3>
                                    {ver.company && (
                                        <p className="text-sm leading-6 text-muted-foreground">
                                            {ver.targetRole || "Target role"} at {ver.company}
                                        </p>
                                    )}
                                </div>
                                <div className="border-t border-neutral-200/70 pt-3">
                                    <Link
                                        href={`/dashboard/resumes/${ver.resumeId}?version=${ver.id}`}
                                        className="text-sm font-medium text-foreground hover:underline"
                                    >
                                        View version
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                    {versionPage.page.nextCursor && (
                        <Link
                            href={`/dashboard/resumes?versionCursor=${encodeURIComponent(versionPage.page.nextCursor)}${params.masterCursor ? `&masterCursor=${encodeURIComponent(params.masterCursor)}` : ""}`}
                            className={featureChrome.secondaryButton}
                        >
                            View older tailored versions
                        </Link>
                    )}
                </section>
            )}
        </DashboardPage>
    );
}
