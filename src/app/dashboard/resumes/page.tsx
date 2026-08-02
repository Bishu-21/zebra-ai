import React from "react";
import { getSafeSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { resumes as resumesTable, resumeVersions as resumeVersionsTable } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
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

function formatTimeAgo(date: Date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

export default async function ResumesPage() {
    const session = await getSafeSession();
    if (!session) return null;

    const masterResumes = await db.query.resumes.findMany({
        where: eq(resumesTable.userId, session.user.id),
        orderBy: [desc(resumesTable.updatedAt)],
    });

    const tailoredVersions = await db.query.resumeVersions.findMany({
        where: eq(resumeVersionsTable.userId, session.user.id),
        orderBy: [desc(resumeVersionsTable.createdAt)],
    });

    const formattedResumes = masterResumes.map(r => ({
        id: r.id,
        title: r.title,
        updatedAt: r.updatedAt.toISOString(),
        content: r.content,
    }));

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 pb-32">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#0A0A0A] mb-1">
                        My Resumes
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
                        <RiShieldCheckLine className="w-4 h-4 text-emerald-600" /> Master Base Resumes ({masterResumes.length})
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
                                        {resume.content?.slice(0, 150) || "No resume content preview."}
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
            </div>

            {/* Section 2: Compiled Tailored Versions */}
            {tailoredVersions.length > 0 && (
                <div className="space-y-6 pt-6">
                    <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
                        <h2 className="text-lg font-extrabold text-[#0A0A0A] flex items-center gap-2">
                            <RiMagicLine className="w-5 h-5 text-indigo-600" /> Tailored Versions ({tailoredVersions.length})
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
                                        href={`/dashboard/resumes/${ver.id}`}
                                        className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                                    >
                                        View Tailored Version <RiArrowRightLine size={14} />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
