import React from "react";
import { getSafeSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import {
    workItems as workItemsTable,
    certifications as certificationsTable,
    user as userTable
} from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import {
    RiExternalLinkLine,
    RiAddLine,
    RiStackLine,
    RiAwardLine,
    RiShareBoxLine,
    RiCheckLine
} from "react-icons/ri";

import { getOrCreateUniquePortfolioSlug } from "@/lib/slug-generator";

export default async function PortfolioDashboardPage() {
    const session = await getSafeSession();
    if (!session) return null;

    const userData = await db.query.user.findFirst({
        where: eq(userTable.id, session.user.id),
    });

    const workItems = await db.query.workItems.findMany({
        where: eq(workItemsTable.userId, session.user.id),
        orderBy: [desc(workItemsTable.createdAt)],
    });

    const certifications = await db.query.certifications.findMany({
        where: eq(certificationsTable.userId, session.user.id),
        orderBy: [desc(certificationsTable.createdAt)],
    });

    const portfolioSlug = await getOrCreateUniquePortfolioSlug(session.user.id, userData?.name);
    const publicUrl = `/p/${portfolioSlug}`;

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 pb-32">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#0A0A0A] mb-1">
                        Portfolio
                    </h1>
                    <p className="text-xs font-normal text-neutral-500 leading-relaxed">
                        Manage public proof items, project evidence, and credentials showcased in your shareable portfolio.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href={publicUrl}
                        target="_blank"
                        className="px-4 py-2 bg-[#0A0A0A] text-white text-xs font-bold rounded-full hover:bg-neutral-800 transition-all flex items-center gap-2 shadow-2xs"
                    >
                        <RiExternalLinkLine size={14} /> View Public Portfolio
                    </Link>
                </div>
            </div>

            {/* Public Share Card */}
            <div className="p-6 bg-[#0A0A0A] text-white rounded-2xl space-y-4 shadow-sm border border-neutral-800">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                            Shareable Portfolio Link
                        </span>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                            <RiShareBoxLine size={18} /> zebra-ai.app{publicUrl}
                        </h3>
                    </div>
                    <Link
                        href={publicUrl}
                        target="_blank"
                        className="px-4 py-2 bg-white text-[#0A0A0A] text-xs font-bold rounded-full hover:bg-neutral-100 transition-colors inline-flex items-center gap-1.5 shrink-0"
                    >
                        Open Portfolio Page <RiExternalLinkLine size={14} />
                    </Link>
                </div>
            </div>

            {/* Grid 1: Projects & Work Items */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-200/70 pb-3">
                    <h2 className="text-sm font-bold text-[#0A0A0A] flex items-center gap-2">
                        <RiStackLine className="w-4 h-4 text-neutral-600" /> Work Items & Projects ({workItems.length})
                    </h2>
                    <Link
                        href="/dashboard/work"
                        className="text-xs font-semibold text-neutral-600 hover:text-[#0A0A0A] transition-colors flex items-center gap-1"
                    >
                        <RiAddLine size={14} /> Add Work Item
                    </Link>
                </div>

                {workItems.length === 0 ? (
                    <div className="bg-white border border-neutral-200/70 rounded-2xl p-10 text-center space-y-3 shadow-2xs">
                        <p className="text-xs text-neutral-500 font-medium">No work items found in your library.</p>
                        <Link
                            href="/dashboard/work"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A0A0A] text-white text-xs font-bold rounded-full hover:bg-neutral-800 transition-all"
                        >
                            <RiAddLine size={14} /> Add your first project
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {workItems.map((item) => (
                            <div
                                key={item.id}
                                className="bg-white border border-neutral-200/70 rounded-2xl p-5 flex flex-col justify-between hover:border-neutral-300 hover:shadow-xs transition-all space-y-3"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-neutral-100 text-[#0A0A0A] rounded-full border border-neutral-200/80">
                                            {item.category}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-sm text-[#0A0A0A]">{item.title}</h3>
                                    {item.description && (
                                        <p className="text-xs text-neutral-500 line-clamp-3 leading-relaxed">
                                            {item.description}
                                        </p>
                                    )}
                                </div>
                                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                                    <Link
                                        href="/dashboard/work"
                                        className="text-xs font-semibold text-neutral-600 hover:text-[#0A0A0A]"
                                    >
                                        Manage in Work Vault →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Grid 2: Certifications */}
            <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-neutral-200/70 pb-3">
                    <h2 className="text-sm font-bold text-[#0A0A0A] flex items-center gap-2">
                        <RiAwardLine className="w-4 h-4 text-emerald-600" /> Certifications & Credentials ({certifications.length})
                    </h2>
                </div>

                {certifications.length === 0 ? (
                    <div className="bg-white border border-neutral-200/70 rounded-2xl p-8 text-center text-xs text-neutral-500 font-medium shadow-2xs">
                        No certifications added yet. Attach certifications in your job application workspace or user profile.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {certifications.map((cert) => (
                            <div
                                key={cert.id}
                                className="bg-white border border-neutral-200/70 rounded-2xl p-5 flex flex-col justify-between hover:border-neutral-300 transition-all space-y-3 shadow-2xs"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                                        <RiCheckLine size={14} /> Verified Credential
                                    </div>
                                    <h3 className="font-bold text-sm text-[#0A0A0A]">{cert.title}</h3>
                                    <p className="text-xs text-neutral-500">Issuer: {cert.issuer}</p>
                                </div>
                                {cert.credentialUrl && (
                                    <a
                                        href={cert.credentialUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 pt-2 border-t border-neutral-100"
                                    >
                                        View Credential <RiExternalLinkLine size={12} />
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
