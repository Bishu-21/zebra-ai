import React from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { 
    portfolios as portfoliosTable, 
    workItems as workItemsTable, 
    user as userTable,
    certifications as certificationsTable
} from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { 
    RiFolder2Line, 
    RiExternalLinkLine, 
    RiBriefcase4Line, 
    RiAwardLine, 
    RiBookOpenLine, 
    RiMagicLine, 
    RiCheckboxCircleLine,
    RiCheckLine
} from "react-icons/ri";
import Image from "next/image";

export const dynamic = "force-dynamic";

interface PortfolioPageProps {
    params: Promise<{ slug: string }>;
}

function cleanSlugInput(raw: string): string {
    return decodeURIComponent(raw).toLowerCase().trim();
}

export default async function PublicPortfolioPage({ params }: PortfolioPageProps) {
    const { slug: rawSlug } = await params;
    const cleanedSlug = cleanSlugInput(rawSlug);

    // 1. Strict Unique Lookup: Query portfolios table by slug
    let portfolio = await db.query.portfolios.findFirst({
        where: eq(portfoliosTable.slug, cleanedSlug),
    });

    // 2. Fallback Unique Lookup: Query portfolios table by userId
    if (!portfolio) {
        portfolio = await db.query.portfolios.findFirst({
            where: eq(portfoliosTable.userId, rawSlug),
        });
    }

    // 3. Fallback Unique Lookup: Direct user ID match
    let targetUser = null;
    if (portfolio) {
        targetUser = await db.query.user.findFirst({
            where: eq(userTable.id, portfolio.userId),
        });
    } else {
        // Match user explicitly by user ID
        targetUser = await db.query.user.findFirst({
            where: eq(userTable.id, rawSlug),
        });

        if (targetUser) {
            portfolio = {
                id: `auto-${targetUser.id}`,
                userId: targetUser.id,
                slug: cleanedSlug,
                title: targetUser.name || "Professional Portfolio",
                bio: "Software Engineer & Builder showcase.",
                selectedWorkIds: null,
                isPublished: true,
                theme: "default",
                createdAt: new Date().toISOString() as unknown as Date,
                updatedAt: new Date().toISOString() as unknown as Date
            };
        }
    }

    if (!portfolio || !targetUser) {
        notFound();
    }

    // 4. Fetch Work Items strictly for this specific user
    let userWorkItems = await db.query.workItems.findMany({
        where: and(
            eq(workItemsTable.userId, targetUser.id),
            eq(workItemsTable.isPublic, true)
        ),
    });

    // Fallback if no items explicitly marked isPublic
    if (userWorkItems.length === 0) {
        userWorkItems = await db.query.workItems.findMany({
            where: eq(workItemsTable.userId, targetUser.id),
        });
    }

    // 5. Fetch Certifications strictly for this specific user
    const userCertifications = await db.query.certifications.findMany({
        where: eq(certificationsTable.userId, targetUser.id),
    });

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case "Project": return <RiFolder2Line className="w-4 h-4 text-blue-500" />;
            case "Internship": return <RiBriefcase4Line className="w-4 h-4 text-emerald-500" />;
            case "Hackathon": return <RiMagicLine className="w-4 h-4 text-amber-500" />;
            case "Course": return <RiBookOpenLine className="w-4 h-4 text-indigo-500" />;
            case "Award": return <RiAwardLine className="w-4 h-4 text-purple-500" />;
            default: return <RiCheckboxCircleLine className="w-4 h-4 text-neutral-500" />;
        }
    };

    return (
        <div className="min-h-screen bg-[#FBFBFB] text-[#0A0A0A] font-sans">
            {/* Header / Banner */}
            <div className="max-w-4xl mx-auto px-6 pt-16 pb-10 space-y-6">
                <div className="flex items-center gap-4">
                    {targetUser?.image ? (
                        <Image
                            src={targetUser.image}
                            alt={portfolio.title}
                            width={72}
                            height={72}
                            className="w-18 h-18 rounded-2xl border-2 border-white shadow-md object-cover"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-2xl bg-[#0A0A0A] text-white font-black text-2xl flex items-center justify-center shadow-md">
                            {(targetUser?.name || portfolio.title).charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">{targetUser?.name || portfolio.title}</h1>
                        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mt-0.5">
                            Verified Work & Proof
                        </p>
                    </div>
                </div>

                {portfolio.bio && (
                    <p className="text-base text-neutral-600 leading-relaxed font-medium max-w-2xl">
                        {portfolio.bio}
                    </p>
                )}
            </div>

            <div className="max-w-4xl mx-auto px-6 pb-20 space-y-10">
                {/* Work Items Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
                        <h2 className="text-lg font-bold">Featured Projects & Experience</h2>
                        <span className="text-xs font-bold text-neutral-400">
                            {userWorkItems.length} {userWorkItems.length === 1 ? "Item" : "Items"}
                        </span>
                    </div>

                    {userWorkItems.length === 0 ? (
                        <div className="py-12 text-center text-neutral-400 text-sm font-medium bg-white rounded-2xl border border-neutral-200/60 p-8">
                            No work items published yet.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {userWorkItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-50 border border-neutral-100 text-[11px] font-bold text-neutral-700">
                                                {getCategoryIcon(item.category)}
                                                {item.category}
                                            </span>
                                        </div>

                                        <div>
                                            <h3 className="text-base font-bold text-[#0A0A0A]">{item.title}</h3>
                                            {item.description && (
                                                <p className="text-xs text-neutral-600 line-clamp-3 mt-1 font-medium leading-relaxed">
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>

                                        {item.result && (
                                            <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-100 text-[11px] text-neutral-700 font-medium">
                                                <span className="font-bold text-[#0A0A0A]">Key Impact: </span>
                                                {String(item.result)}
                                            </div>
                                        )}

                                        {Array.isArray(item.tools) && (item.tools as string[]).length > 0 && (
                                            <div className="flex flex-wrap gap-1 pt-1">
                                                {(item.tools as string[]).map((tool: string, idx: number) => (
                                                    <span key={idx} className="text-[10px] font-semibold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md">
                                                        {String(tool)}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {item.proofUrl && (
                                        <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                                            <a
                                                href={item.proofUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-blue-600 font-bold hover:underline"
                                            >
                                                <RiExternalLinkLine className="w-3.5 h-3.5" />
                                                View Project Proof
                                            </a>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Certifications Section */}
                {userCertifications.length > 0 && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <RiAwardLine className="w-5 h-5 text-emerald-600" /> Certifications & Credentials
                            </h2>
                            <span className="text-xs font-bold text-neutral-400">
                                {userCertifications.length} {userCertifications.length === 1 ? "Credential" : "Credentials"}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {userCertifications.map((cert) => (
                                <div
                                    key={cert.id}
                                    className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between"
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                                            <RiCheckLine size={16} /> Verified Credential
                                        </div>
                                        <h3 className="text-sm font-bold text-[#0A0A0A]">{cert.title}</h3>
                                        <p className="text-xs text-neutral-500 font-medium">Issuer: {cert.issuer}</p>
                                    </div>
                                    {cert.credentialUrl && (
                                        <a
                                            href={cert.credentialUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 pt-2 border-t border-neutral-100"
                                        >
                                            View Credential <RiExternalLinkLine size={12} />
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Powered by Zebra Footer */}
                <div className="pt-16 text-center border-t border-neutral-200/60">
                    <p className="text-xs font-semibold text-neutral-400">
                        Powered by <span className="font-bold text-[#0A0A0A]">Zebra AI</span> — Turning real work into career proof.
                    </p>
                </div>
            </div>
        </div>
    );
}
