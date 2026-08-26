import React from "react";
import { getSafeSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { resumes as resumesTable, resumeVersions as resumeVersionsTable } from "@/lib/schema";
import { and, eq, desc, lt, or } from "drizzle-orm";
import Link from "next/link";
import {
    RiFileTextLine,
    RiAddLine,
    RiTimeLine,
    RiArrowRightLine,
    RiMagicLine,
    RiShieldCheckLine,
    RiDownloadLine
} from "react-icons/ri";
import { ImportResume } from "@/components/dashboard/ImportResume";
import { TailorResume } from "@/components/dashboard/TailorResume";
import { decodeCursor, paginateRows } from "@/lib/pagination";

function formatTimeAgo(date: Date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

export default async function ResumesPage({ searchParams }: { searchParams: Promise<{ masterCursor?: string; versionCursor?: string }> }) {
    const session = await getSafeSession();
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
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 pb-32">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#0A0A0A] mb-1">
                        Resumes
                    </h1>
                    <p className="text-xs font-normal text-neutral-500 leading-relaxed">
                        Manage your master base resumes and compiled tailored versions.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/resumes/new"
                        className="px-4 py-2 bg-[#0A0A0A] text-white text-xs font-bold rounded-full hover:bg-neutral-800 transition-all flex items-center gap-2 shadow-2xs"
                    >
                        <RiAddLine size={16} /> Create Master Resume
                    </Link>
                </div>
            </div>

            {/* Quick Action Tools */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ImportResume />
                <TailorResume resumes={formattedResumes} />
            </div>

            {/* Section 1: Master Base Resumes */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-200/70 pb-3">
                    <h2 className="text-sm font-bold text-[#0A0A0A] flex items-center gap-2">
                        <RiShieldCheckLine className="w-4 h-4 text-emerald-600" /> Master Base Resumes
                    </h2>
                </div>

                {masterResumes.length === 0 ? (
                    <div className="bg-white border border-neutral-200/70 rounded-2xl p-10 text-center space-y-3 shadow-2xs">
                        <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-400 mx-auto">
                            <RiFileTextLine size={24} />
                        </div>
                        <h3 className="text-sm font-bold text-[#0A0A0A]">No Master Resumes Found</h3>
                        <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                            Create or import your master resume source to start generating tailored versions for job applications.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {masterResumes.map((resume) => (
                            <div
                                key={resume.id}
                                className="bg-white border border-neutral-200/80 rounded-3xl p-6 flex flex-col justify-between hover:border-neutral-300 hover:shadow-lg transition-all space-y-4"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="px-2.5 py-1 text-[10px] font-bold bg-neutral-100 text-neutral-600 rounded-full">
                                            Master Base
                                        </span>
                                        <span className="text-[10px] text-neutral-400 font-semibold flex items-center gap-1">
                                            <RiTimeLine size={12} /> {formatTimeAgo(resume.updatedAt)}
                                        </span>
                                    </div>
                                    <h3 className="font-extrabold text-base text-[#0A0A0A] line-clamp-1">
                                        {resume.title}
                                    </h3>
                                    <p className="text-xs text-neutral-500 line-clamp-3 leading-relaxed">
                                        Open this resume to review or edit its structured content.
                                    </p>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                                    <Link
                                        href={`/dashboard/resumes/${resume.id}`}
                                        className="text-xs font-bold text-[#0A0A0A] hover:underline flex items-center gap-1"
                                    >
                                        Edit Resume <RiArrowRightLine size={14} />
                                    </Link>
                                    <Link
                                        href={`/api/export/pdf?id=${resume.id}`}
                                        target="_blank"
                                        className="p-2 text-neutral-500 hover:text-black rounded-lg hover:bg-neutral-100 transition-colors"
                                        title="Export PDF"
                                    >
                                        <RiDownloadLine size={16} />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {masterPage.page.nextCursor && (
                    <Link href={`/dashboard/resumes?masterCursor=${encodeURIComponent(masterPage.page.nextCursor)}${params.versionCursor ? `&versionCursor=${encodeURIComponent(params.versionCursor)}` : ""}`} className="inline-flex rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50">
                        View older resumes
                    </Link>
                )}
            </div>

            {/* Section 2: Compiled Tailored Versions */}
            {tailoredVersions.length > 0 && (
                <div className="space-y-6 pt-6">
                    <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
                        <h2 className="text-lg font-extrabold text-[#0A0A0A] flex items-center gap-2">
                            <RiMagicLine className="w-5 h-5 text-indigo-600" /> Tailored Versions
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tailoredVersions.map((ver) => (
                            <div
                                key={ver.id}
                                className="bg-white border border-neutral-200/80 rounded-3xl p-6 flex flex-col justify-between hover:border-neutral-300 hover:shadow-lg transition-all space-y-4"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="px-2.5 py-1 text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full">
                                            Tailored Version
                                        </span>
                                        <span className="text-[10px] text-neutral-400 font-semibold flex items-center gap-1">
                                            <RiTimeLine size={12} /> {formatTimeAgo(ver.createdAt)}
                                        </span>
                                    </div>
                                    <h3 className="font-extrabold text-base text-[#0A0A0A] line-clamp-1">
                                        {ver.title}
                                    </h3>
                                    {ver.company && (
                                        <p className="text-xs font-semibold text-neutral-600">
                                            Role: {ver.targetRole || "Target Position"} @ {ver.company}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                                    <Link
                                        href={`/dashboard/resumes/${ver.resumeId}?version=${ver.id}`}
                                        className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                                    >
                                        View Tailored Version <RiArrowRightLine size={14} />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                    {versionPage.page.nextCursor && (
                        <Link href={`/dashboard/resumes?versionCursor=${encodeURIComponent(versionPage.page.nextCursor)}${params.masterCursor ? `&masterCursor=${encodeURIComponent(params.masterCursor)}` : ""}`} className="inline-flex rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50">
                            View older tailored versions
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
