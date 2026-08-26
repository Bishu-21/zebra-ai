import React from "react";
import { db } from "@/lib/db";
import { resumes } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SharePageActions } from "@/components/compiler/SharePageActions";
import Link from "next/link";
import type { ResumeContent, Experience, Education, SkillCategory, Project, Achievement } from "@/components/compiler/types";
import { toPublicResumeContent } from "@/lib/resume-content";

export async function generateMetadata({ params: paramsPromise }: { params: Promise<{ token: string }> }): Promise<Metadata> {
    const params = await paramsPromise;
    const resume = await db.query.resumes.findFirst({
        where: and(eq(resumes.shareToken, params.token), eq(resumes.isPublic, true)),
        columns: { title: true, content: true },
    });
    if (!resume) return { title: "Resume Not Found | Zebra AI" };

    let name = "Resume";
    try {
        const parsed = JSON.parse(resume.content || "{}");
        name = parsed.basics?.name || resume.title || "Resume";
    } catch { name = resume.title || "Resume"; }

    return {
        title: `${name} — Resume | Zebra AI`,
        description: `View ${name}'s professional resume, compiled with Zebra AI.`,
    };
}

export default async function SharedResumePage({ params: paramsPromise }: { params: Promise<{ token: string }> }) {
    const params = await paramsPromise;

    const resume = await db.query.resumes.findFirst({
        where: eq(resumes.shareToken, params.token),
    });

    if (!resume || !resume.shareToken || !resume.isPublic) notFound();

    let content: ResumeContent;
    try { content = toPublicResumeContent(JSON.parse(resume.content || "{}")); }
    catch { content = toPublicResumeContent({}); }

    const basics = content.basics || {};
    const education = (content.education || []) as Education[];
    const skills = (content.skills || []) as (string | SkillCategory)[];
    const projects = (content.projects || []) as Project[];
    const experience = (content.experience || []) as Experience[];
    const certifications = (content.certifications || []) as Achievement[];

    return (
        <div className="min-h-screen bg-[#F5F5F5] font-sans flex flex-col pb-20 md:pb-0">
            {/* Top bar */}
            <header className="h-12 bg-white border-b border-black/6 flex items-center justify-between px-6 shrink-0 print:hidden">
                <div className="flex items-center gap-2">
                    <Link href="/" className="text-sm font-bold tracking-[-0.04em] text-[#0A0A0A]">Zebra AI</Link>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 uppercase tracking-wider">
                        Shared Resume
                    </span>
                </div>
                <SharePageActions
                    token={params.token}
                    resumeTitle={resume.title || "Resume"}
                    resumeData={content}
                />
            </header>

            {/* Main content grid */}
            <main className="flex-grow max-w-6xl mx-auto w-full p-6 print:p-0 print:bg-white">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Resume paper (100% unblocked & readable) */}
                    <div className="lg:col-span-8 flex justify-center">
                        <article
                            className="w-full max-w-[720px] bg-white shadow-[0_2px_20px_rgba(0,0,0,0.08)] rounded-sm print:shadow-none print:max-w-none"
                            style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                        >
                            <div className="p-[40px_48px] text-[#1a1a1a] leading-[1.45]">

                                {/* Header */}
                                <div className="text-center mb-2">
                                    <h1 className="text-[24px] font-bold tracking-[0.01em] leading-tight">{basics.name || "Resume"}</h1>
                                    <p className="text-[11px] text-[#333] mt-1">
                                        {[basics.phone, basics.email, basics.linkedin, basics.portfolio, basics.location].filter(Boolean).join(" · ")}
                                    </p>
                                </div>

                                {/* Education */}
                                {education.length > 0 && (
                                    <Section title="Education">
                                        {education.map((edu, idx) => (
                                            <div key={idx} className="mb-2">
                                                <div className="flex justify-between items-baseline">
                                                    <span className="text-[12px] font-bold">{edu.school}</span>
                                                    <span className="text-[11px] text-[#444]">{edu.location}</span>
                                                </div>
                                                <div className="flex justify-between items-baseline">
                                                    <span className="text-[11px] text-[#333]">{edu.degree}{edu.gpa ? ` | ${edu.gpa}` : ""}</span>
                                                    <span className="text-[11px] text-[#444]">{edu.period}</span>
                                                </div>
                                                <Bullets items={edu.highlights} />
                                            </div>
                                        ))}
                                    </Section>
                                )}

                                {/* Skills */}
                                {skills.length > 0 && (
                                    <Section title="Skills">
                                        <ul className="ml-5 list-disc space-y-0.5">
                                            {skills.map((skill, idx) => {
                                                if (typeof skill === "string") {
                                                    return <li key={idx} className="text-[11px] text-[#333] leading-snug">{skill}</li>;
                                                }
                                                return (
                                                    <li key={idx} className="text-[11px] text-[#333] leading-snug">
                                                        <span className="font-bold">{skill.category}:</span> {skill.items}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </Section>
                                )}

                                {/* Projects */}
                                {projects.length > 0 && (
                                    <Section title="Projects">
                                        {projects.map((proj, idx) => (
                                            <div key={idx} className="mb-2">
                                                <div className="flex justify-between items-baseline">
                                                    <span className="text-[12px] font-bold">
                                                        {proj.title}
                                                        {proj.techStack ? <span className="font-normal text-[#444]"> | {proj.techStack}</span> : ""}
                                                    </span>
                                                    {proj.link && <span className="text-[11px] text-[#444]">{proj.link}</span>}
                                                </div>
                                                <Bullets items={proj.highlights} />
                                            </div>
                                        ))}
                                    </Section>
                                )}

                                {/* Experience */}
                                {experience.length > 0 && (
                                    <Section title="Experience">
                                        {experience.map((exp, idx) => (
                                            <div key={idx} className="mb-2.5">
                                                <div className="flex justify-between items-baseline">
                                                    <span className="text-[12px] font-bold">{exp.company}</span>
                                                    <span className="text-[11px] text-[#444]">{exp.location}</span>
                                                </div>
                                                <div className="flex justify-between items-baseline">
                                                    <span className="text-[11px] text-[#333] italic">{exp.role}</span>
                                                    <span className="text-[11px] text-[#444]">{exp.period}</span>
                                                </div>
                                                <Bullets items={exp.highlights} />
                                            </div>
                                        ))}
                                    </Section>
                                )}

                                {/* Certifications */}
                                {certifications.length > 0 && certifications.some((c) => (c as Achievement)?.items?.trim()) && (
                                    <Section title="Certifications & Achievements">
                                        <ul className="ml-5 list-disc space-y-0.5">
                                            {certifications.filter((c) => (c as Achievement)?.items?.trim()).map((c, idx) => (
                                                <li key={idx} className="text-[11px] text-[#333] leading-snug">
                                                    <span className="font-bold">{(c as Achievement).category}:</span> {(c as Achievement).items}
                                                </li>
                                            ))}
                                        </ul>
                                    </Section>
                                )}

                                {/* Summary */}
                                {basics.summary && (
                                    <Section title="Summary">
                                        <p className="text-[11px] text-[#333] leading-relaxed">{basics.summary}</p>
                                    </Section>
                                )}
                            </div>
                        </article>
                    </div>

                    {/* Desktop Guest Conversion Card */}
                    <div className="hidden lg:block lg:col-span-4 shrink-0 print:hidden">
                        <div className="sticky top-16 bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-sm space-y-5">
                            <div className="space-y-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                                    Resume Review Workspace
                                </span>
                                <h3 className="text-base font-black text-[#0A0A0A] tracking-tight">
                                    Build your ATS-optimized resume
                                </h3>
                                <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                                    Review, tailor, and export a structured resume using your supplied experience.
                                </p>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-neutral-100 text-xs">
                                <div className="flex items-center gap-2 text-neutral-700 font-medium">
                                    <span className="text-emerald-600 font-bold">✓</span>
                                    <span>Instant ATS Score & 45-point audit</span>
                                </div>
                                <div className="flex items-center gap-2 text-neutral-700 font-medium">
                                    <span className="text-emerald-600 font-bold">✓</span>
                                    <span>AI Job Tailoring for target roles</span>
                                </div>
                                <div className="flex items-center gap-2 text-neutral-700 font-medium">
                                    <span className="text-emerald-600 font-bold">✓</span>
                                    <span>Shareable portfolio and resume links</span>
                                </div>
                            </div>

                            <div className="pt-2 space-y-2">
                                <Link
                                    href={`/signin?returnTo=${encodeURIComponent(`/share/${params.token}`)}`}
                                    className="w-full py-2.5 px-4 bg-[#0A0A0A] hover:bg-neutral-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
                                >
                                    Build yours with Zebra AI →
                                </Link>
                                <p className="text-[10px] center text-neutral-400 font-medium text-center">
                                    Free account · No credit card required
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Mobile Bottom Persistent Conversion Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-md border-t border-neutral-200 p-3.5 flex items-center justify-between shadow-lg print:hidden">
                <div className="space-y-0.5 pr-2">
                    <p className="text-xs font-bold text-[#0A0A0A] truncate">Build your ATS-optimized resume</p>
                    <p className="text-[10px] text-neutral-500 font-medium">Free with Zebra AI</p>
                </div>
                <Link
                    href={`/signin?returnTo=${encodeURIComponent(`/share/${params.token}`)}`}
                    className="shrink-0 px-4 py-2 bg-[#0A0A0A] text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
                >
                    Get Started →
                </Link>
            </div>

            {/* Footer */}
            <footer className="h-8 bg-[#0A0A0A] flex items-center justify-center shrink-0 print:hidden mt-8">
                <span className="text-[9px] font-semibold text-white/70">Compiled with Zebra AI — zebra-ai.app</span>
            </footer>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="mt-3 mb-1.5">
            <h2 className="text-[14px] font-bold uppercase tracking-[0.02em] border-b border-[#1a1a1a] pb-[1px] mb-1.5" style={{ lineHeight: 1.3 }}>
                {title}
            </h2>
            {children}
        </section>
    );
}

function Bullets({ items }: { items?: string[] }) {
    if (!items?.length || !items.some(h => h?.trim())) return null;
    return (
        <ul className="mt-0.5 ml-5 list-disc">
            {items.filter(h => h?.trim()).map((h, idx) => (
                <li key={idx} className="text-[11px] text-[#333] leading-snug">{h}</li>
            ))}
        </ul>
    );
}
