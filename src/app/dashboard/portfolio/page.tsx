import React from "react";
import { DashboardPage, DashboardPageHeader } from "@/components/dashboard/DashboardPage";
import { FeatureIcon } from "@/components/dashboard/FeatureIcon";
import { AppIcon } from "@/components/ui/AppIcon";
import { featureChrome } from "@/components/dashboard/feature-chrome";
import { getDashboardSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import {
    workItems as workItemsTable,
    certifications as certificationsTable,
    user as userTable
} from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import {
    RiLink,
    RiAddLine,
    RiCheckLine
} from "react-icons/ri";

import { getOrCreateUniquePortfolioSlug } from "@/lib/slug-generator";
import { PortfolioStatusCard } from "@/components/dashboard/PortfolioStatusCard";

export default async function PortfolioDashboardPage() {
    const session = await getDashboardSession();
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
    const portfolio = await db.query.portfolios.findFirst({
        where: (table, { eq: equals }) => equals(table.userId, session.user.id),
    });

    return (
        <DashboardPage>
            <DashboardPageHeader
                title="Portfolio"
                description="Choose which work and credentials appear on your public portfolio."
            />

            <PortfolioStatusCard
                slug={portfolioSlug}
                title={portfolio?.title || userData?.name || "Portfolio"}
                selectedWorkIds={((portfolio?.selectedWorkIds as string[] | null)?.length ? portfolio?.selectedWorkIds as string[] : workItems.filter((item) => item.isPublic).map((item) => item.id))}
                isPublished={portfolio?.isPublished ?? false}
            />

            {/* Grid 1: Projects & Work Items */}
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <h2 className={`${featureChrome.sectionTitle} flex items-center gap-2`}>
                        <FeatureIcon feature="Work" size={16} className="text-muted-foreground" /> Work items ({workItems.length})
                    </h2>
                    <Link href="/dashboard/work" className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:underline">
                        <AppIcon icon={RiAddLine} size={14} /> Add work item
                    </Link>
                </div>

                {workItems.length === 0 ? (
                    <div className={featureChrome.emptyState}>
                        <p className="text-sm text-muted-foreground">No work items yet.</p>
                        <Link href="/dashboard/work" className={`${featureChrome.primaryButton} mt-4`}>
                            <AppIcon icon={RiAddLine} size={14} /> Add your first project
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {workItems.map((item) => (
                            <div
                                key={item.id}
                                className={`${featureChrome.card} justify-between gap-3`}
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="rounded-md bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                                            {item.category}
                                        </span>
                                        <span className="text-xs font-medium text-muted-foreground">
                                            {item.isPublic ? "Visible on public page" : "Private"}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-semibold tracking-tight text-foreground">{item.title}</h3>
                                    {item.description && (
                                        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                                            {item.description}
                                        </p>
                                    )}
                                </div>
                                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                                    <Link
                                        href="/dashboard/work"
                                        className="text-sm font-medium text-foreground hover:underline"
                                    >
                                        Manage in Work →
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
                    <h2 className={featureChrome.sectionTitle}>
                        Certifications ({certifications.length})
                    </h2>
                </div>

                {certifications.length === 0 ? (
                    <div className={`${featureChrome.emptyState} text-sm text-muted-foreground`}>
                        No certifications added yet. Attach them in an application workspace or your profile.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {certifications.map((cert) => (
                            <div
                                key={cert.id}
                                className={`${featureChrome.card} justify-between gap-3`}
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                                        <AppIcon icon={RiCheckLine} size={14} /> Credential
                                    </div>
                                    <h3 className="text-sm font-semibold tracking-tight text-foreground">{cert.title}</h3>
                                    <p className="text-sm text-muted-foreground">Issuer: {cert.issuer}</p>
                                </div>
                                {cert.credentialUrl && (
                                    <a
                                        href={cert.credentialUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 border-t border-neutral-200/70 pt-2 text-sm font-medium text-foreground hover:underline"
                                    >
                                        View credential <AppIcon icon={RiLink} size={12} />
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardPage>
    );
}
