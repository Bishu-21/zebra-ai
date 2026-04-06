import React from "react";
import { db } from "@/lib/db";
import { resumes } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata({ params: paramsPromise }: { params: Promise<{ token: string }> }): Promise<Metadata> {
    const params = await paramsPromise;
    const resume = await db.query.resumes.findFirst({
        where: eq(resumes.shareToken, params.token),
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

    let content: any = {};
    try { content = JSON.parse(resume.content || "{}"); } catch { content = {}; }

    const basics = content.basics || {};
    const education = content.education || [];
    const skills = content.skills || [];
    const projects = content.projects || [];
    const experience = content.experience || [];
    const certifications = content.certifications || [];

    return (
        <div className="min-h-screen bg-[#EBEEF2] font-sans flex flex-col">
            {/* Top bar */}
            <header className="h-12 bg-white border-b border-black/6 flex items-center justify-between px-6 shrink-0 print:hidden">
                <Link href="/" className="text-sm font-bold tracking-[-0.04em] text-[#0A0A0A]">Zebra AI</Link>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-semibold text-[#737373]">Shared Resume</span>
                    <button onClick={undefined} className="h-7 px-4 bg-[#3B82F6] text-white text-[10px] font-bold rounded-md hover:bg-[#2563EB] transition-all">
                        <Link href="/">Build Yours →</Link>
                    </button>
                </div>
            </header>

            {/* Resume paper */}
            <main className="flex-grow flex justify-center p-8 print:p-0 print:bg-white">
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
                                {education.map((edu: any, idx: number) => (
                                    <div key={idx} className="mb-2">
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-[12px] font-bold">{edu.school}</span>
                                            <span className="text-[11px] text-[#444]">{edu.location}</span>
                                        </div>
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-[11px] italic text-[#333]">{edu.degree}{edu.gpa ? ` | ${edu.gpa}` : ""}</span>
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
                                    {skills.filter((s: any) => typeof s === 'string' ? s.trim() : s?.items?.trim()).map((s: any, idx: number) => (
                                        <li key={idx} className="text-[11px] text-[#333] leading-snug">
                                            {typeof s === 'string' ? s : <><span className="font-bold">{s.category}:</span> {s.items}</>}
                                        </li>
                                    ))}
                                </ul>
                            </Section>
                        )}

                        {/* Projects */}
                        {projects.length > 0 && (
                            <Section title="Projects">
                                {projects.map((proj: any, idx: number) => (
                                    <div key={idx} className="mb-2">
                                        <div className="flex justify-between items-baseline gap-2">
                                            <span className="text-[12px] font-bold">{proj.title}</span>
                                            <span className="text-[11px] italic text-[#555] shrink-0">
                                                {proj.techStack}
                                                {proj.link && <> · <a href={proj.link} target="_blank" rel="noopener noreferrer" className="font-bold not-italic text-[#1a1a1a] hover:text-[#3B82F6]">Live Demo</a></>}
                                            </span>
                                        </div>
                                        <Bullets items={proj.highlights} />
                                    </div>
                                ))}
                            </Section>
                        )}

                        {/* Experience */}
                        {experience.length > 0 && (
                            <Section title="Experience">
                                {experience.map((exp: any, idx: number) => (
                                    <div key={idx} className="mb-2">
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-[12px] font-bold">{exp.company}</span>
                                            <span className="text-[11px] text-[#444]">{exp.location}</span>
                                        </div>
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-[11px] italic text-[#333]">{exp.role}</span>
                                            <span className="text-[11px] text-[#444]">{exp.period}</span>
                                        </div>
                                        <Bullets items={exp.highlights} />
                                    </div>
                                ))}
                            </Section>
                        )}

                        {/* Certifications */}
                        {certifications.length > 0 && certifications.some((c: any) => c?.items?.trim()) && (
                            <Section title="Certifications & Achievements">
                                <ul className="ml-5 list-disc space-y-0.5">
                                    {certifications.filter((c: any) => c?.items?.trim()).map((c: any, idx: number) => (
                                        <li key={idx} className="text-[11px] text-[#333] leading-snug">
                                            <span className="font-bold">{c.category}:</span> {c.items}
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
            </main>

            {/* Footer */}
            <footer className="h-8 bg-[#3B82F6] flex items-center justify-center shrink-0 print:hidden">
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
