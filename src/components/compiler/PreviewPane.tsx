"use client";

import React from "react";
import { RiExternalLinkLine } from "react-icons/ri";
import type { ResumeContent } from "./types";

interface PreviewPaneProps {
    content: ResumeContent;
    onJumpToSource: (path: string) => void;
}

/** 
 * LaTeX-quality resume preview matching Overleaf output.
 * Uses serif font, centered header, underlined section titles, proper bullet indentation.
 */
export function PreviewPane({ content, onJumpToSource }: PreviewPaneProps) {
    const c = content;
    const hasContact = c.basics.phone || c.basics.email || c.basics.linkedin || c.basics.portfolio || c.basics.location;

    return (
        <div className="flex-grow bg-[#EBEEF2] flex flex-col overflow-hidden">
            {/* Preview header bar */}
            <div className="h-9 bg-[#E0E0E0] border-b border-black/8 flex items-center justify-between px-4 shrink-0">
                <span className="text-[10px] font-semibold text-black/40 tracking-wide">Compiled Output</span>
                <span className="text-[10px] font-semibold text-black/30">A4 · 1 page</span>
            </div>
            {/* Paper scroll area */}
            <div className="flex-grow overflow-y-auto flex justify-center p-6 custom-scrollbar">
                <div 
                    className="w-full max-w-[680px] bg-white shadow-[0_2px_20px_rgba(0,0,0,0.08)] rounded-[2px] shrink-0"
                    style={{ aspectRatio: '1/1.414', fontFamily: "'Georgia', 'Times New Roman', 'CMU Serif', serif" }}
                >
                    <div className="p-[32px_38px] overflow-y-auto h-full text-[#1a1a1a] leading-[1.45]">
                        
                        {/* ── HEADER ── */}
                        <div 
                            className="text-center mb-1 cursor-pointer hover:bg-blue-50/40 rounded px-1 transition-colors" 
                            data-path="basics.name" 
                            onClick={() => onJumpToSource('basics.name')}
                        >
                            <h1 className="text-[22px] font-bold tracking-[0.01em] leading-tight">
                                {c.basics.name || "Your Name"}
                            </h1>
                            {hasContact && (
                                <div className="text-[10px] text-[#333] mt-1 leading-snug">
                                    {/* Row 1: phone · email */}
                                    <div className="flex flex-wrap justify-center gap-x-1">
                                        {c.basics.phone && (
                                            <span className="cursor-pointer hover:text-blue-600" onClick={(e) => { e.stopPropagation(); onJumpToSource('basics.phone'); }}>
                                                {c.basics.phone}
                                            </span>
                                        )}
                                        {c.basics.phone && c.basics.email && <span className="text-black/30"> · </span>}
                                        {c.basics.email && (
                                            <span className="cursor-pointer hover:text-blue-600" onClick={(e) => { e.stopPropagation(); onJumpToSource('basics.email'); }}>
                                                {c.basics.email}
                                            </span>
                                        )}
                                    </div>
                                    {/* Row 2: linkedin · portfolio · location */}
                                    <div className="flex flex-wrap justify-center gap-x-1">
                                        {c.basics.linkedin && (
                                            <span className="cursor-pointer hover:text-blue-600" onClick={(e) => { e.stopPropagation(); onJumpToSource('basics.linkedin'); }}>
                                                {c.basics.linkedin}
                                            </span>
                                        )}
                                        {c.basics.linkedin && c.basics.portfolio && <span className="text-black/30"> · </span>}
                                        {c.basics.portfolio && (
                                            <span className="cursor-pointer hover:text-blue-600" onClick={(e) => { e.stopPropagation(); onJumpToSource('basics.portfolio'); }}>
                                                {c.basics.portfolio}
                                            </span>
                                        )}
                                        {(c.basics.linkedin || c.basics.portfolio) && c.basics.location && <span className="text-black/30"> · </span>}
                                        {c.basics.location && (
                                            <span className="cursor-pointer hover:text-blue-600" onClick={(e) => { e.stopPropagation(); onJumpToSource('basics.location'); }}>
                                                {c.basics.location}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── EDUCATION ── */}
                        {c.education?.length > 0 && (
                            <ResumeSection title="Education">
                                {c.education.map((edu, idx) => (
                                    <div key={edu.id} className="mb-2 cursor-pointer hover:bg-blue-50/40 rounded px-0.5 -mx-0.5 transition-colors" onClick={() => onJumpToSource(`education.${idx}.school`)}>
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-[11px] font-bold">{edu.school || "Institution"}</span>
                                            <span className="text-[10px] text-[#444]">{edu.location || ""}</span>
                                        </div>
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-[10px] italic text-[#333]">
                                                {edu.degree || "Degree"}
                                                {edu.gpa && ` | ${edu.gpa}`}
                                            </span>
                                            <span className="text-[10px] text-[#444]">{edu.period || ""}</span>
                                        </div>
                                        {edu.highlights?.length > 0 && edu.highlights.some(h => h.trim()) && (
                                            <ul className="mt-0.5 ml-4 list-disc">
                                                {edu.highlights.filter(h => h.trim()).map((h, hIdx) => (
                                                    <li key={hIdx} className="text-[10px] text-[#333] leading-snug">{h}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </ResumeSection>
                        )}

                        {/* ── SKILLS ── */}
                        {c.skills?.length > 0 && c.skills.some(s => s.items.trim()) && (
                            <ResumeSection title="Skills">
                                <ul className="ml-4 list-disc space-y-0.5">
                                    {c.skills.filter(s => s.items.trim()).map((skill) => (
                                        <li key={skill.id} className="text-[10px] text-[#333] leading-snug cursor-pointer hover:bg-blue-50/40 rounded transition-colors" onClick={() => onJumpToSource(`skills.${skill.id}`)}>
                                            <span className="font-bold">{skill.category}:</span> {skill.items}
                                        </li>
                                    ))}
                                </ul>
                            </ResumeSection>
                        )}

                        {/* ── PROJECTS ── */}
                        {c.projects?.length > 0 && (
                            <ResumeSection title="Projects">
                                {c.projects.map((proj, idx) => (
                                    <div key={proj.id} className="mb-2 cursor-pointer hover:bg-blue-50/40 rounded px-0.5 -mx-0.5 transition-colors" onClick={() => onJumpToSource(`projects.${idx}.title`)}>
                                        <div className="flex justify-between items-baseline gap-2">
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="text-[11px] font-bold">{proj.title || "Project"}</span>
                                                {proj.link && (
                                                    <a href={proj.link} target="_blank" rel="noopener noreferrer" className="text-black/40 hover:text-blue-600" onClick={(e) => e.stopPropagation()}>
                                                        <RiExternalLinkLine size={8} />
                                                    </a>
                                                )}
                                            </div>
                                            <span className="text-[10px] italic text-[#555] shrink-0">
                                                {proj.techStack || ""}
                                                {proj.techStack && proj.link && " · "}
                                                {proj.link && <a href={proj.link} target="_blank" rel="noopener noreferrer" className="font-bold not-italic hover:text-blue-600" onClick={(e) => e.stopPropagation()}>Live Demo</a>}
                                            </span>
                                        </div>
                                        {proj.highlights?.length > 0 && proj.highlights.some(h => h.trim()) && (
                                            <ul className="mt-0.5 ml-4 list-disc">
                                                {proj.highlights.filter(h => h.trim()).map((h, hIdx) => (
                                                    <li key={hIdx} className="text-[10px] text-[#333] leading-snug">{h}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </ResumeSection>
                        )}

                        {/* ── EXPERIENCE ── */}
                        {c.experience?.length > 0 && (
                            <ResumeSection title="Experience">
                                {c.experience.map((exp, idx) => (
                                    <div key={exp.id} className="mb-2 cursor-pointer hover:bg-blue-50/40 rounded px-0.5 -mx-0.5 transition-colors" data-path={`experience.${idx}.role`} onClick={() => onJumpToSource(`experience.${idx}.role`)}>
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-[11px] font-bold">{exp.company || "Company"}</span>
                                            <span className="text-[10px] text-[#444]">{exp.location || ""}</span>
                                        </div>
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-[10px] italic text-[#333]">{exp.role || "Role"}</span>
                                            <span className="text-[10px] text-[#444]">{exp.period || ""}</span>
                                        </div>
                                        {exp.highlights?.length > 0 && exp.highlights.some(h => h.trim()) && (
                                            <ul className="mt-0.5 ml-4 list-disc">
                                                {exp.highlights.filter(h => h.trim()).map((h, hIdx) => (
                                                    <li key={hIdx} className="text-[10px] text-[#333] leading-snug">{h}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </ResumeSection>
                        )}

                        {/* ── CERTIFICATIONS & ACHIEVEMENTS ── */}
                        {c.certifications?.length > 0 && c.certifications.some(a => a.items.trim()) && (
                            <ResumeSection title="Certifications & Achievements">
                                <ul className="ml-4 list-disc space-y-0.5">
                                    {c.certifications.filter(a => a.items.trim()).map((ach) => (
                                        <li key={ach.id} className="text-[10px] text-[#333] leading-snug">
                                            <span className="font-bold">{ach.category}:</span> {ach.items}
                                        </li>
                                    ))}
                                </ul>
                            </ResumeSection>
                        )}

                        {/* ── SUMMARY (if present, rendered after sections like some LaTeX templates) ── */}
                        {c.basics.summary && (
                            <ResumeSection title="Summary">
                                <p className="text-[10px] text-[#333] leading-relaxed cursor-pointer hover:bg-blue-50/40 rounded transition-colors" onClick={() => onJumpToSource('basics.summary')}>
                                    {c.basics.summary}
                                </p>
                            </ResumeSection>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/** LaTeX-style section: bold uppercase title with full-width rule */
function ResumeSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="mt-3 mb-1.5">
            <h2 
                className="text-[13px] font-bold uppercase tracking-[0.02em] border-b border-[#1a1a1a] pb-[1px] mb-1.5"
                style={{ lineHeight: 1.3 }}
            >
                {title}
            </h2>
            {children}
        </section>
    );
}
