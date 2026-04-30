"use client";

import React, { useEffect, useRef, useState } from "react";
import { RiExternalLinkLine, RiArrowDownSLine, RiFontSize } from "react-icons/ri";
import { useSettings } from "@/context/SettingsContext";
import type { ResumeContent } from "./types";

interface PreviewPaneProps {
    content: ResumeContent;
    onJumpToSourceAction: (path: string) => void;
    template?: string;
}

function ensureAbsoluteUrl(url: string): string {
    if (!url) return "";
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:')) {
        return url;
    }
    return `https://${url}`;
}

/** 
 * LaTeX-quality resume preview matching Overleaf output.
 * Uses serif font, centered header, underlined section titles, proper bullet indentation.
 */
export function PreviewPane({ content, onJumpToSourceAction, template = "modern" }: PreviewPaneProps) {
    const { settings, updateSettingsAction } = useSettings();
    const [autoScale, setAutoScale] = useState(1);
    const [realPaperHeight] = useState(297); // in mm
    const containerRef = useRef<HTMLDivElement>(null);
    const paperRef = useRef<HTMLDivElement>(null);

    const scaleOptions = [0.25, 0.5, 0.75, 1, 1.5, 2];
    const fontOptions = [
        { name: "Latin Modern Roman", family: "'Latin Modern Roman', serif" },
        { name: "Times New Roman", family: "'Times New Roman', serif" },
        { name: "Inter", family: "'Inter', sans-serif" },
        { name: "Roboto", family: "'Roboto', sans-serif" },
        { name: "Outfit", family: "'Outfit', sans-serif" },
        { name: "STIX Two Text", family: "'STIX Two Text', serif" }
    ];

    useEffect(() => {
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const containerWidth = entry.contentRect.width - 64; // Padding
                const paperWidth = 794; 
                const newScale = containerWidth / paperWidth;
                setAutoScale(Math.min(newScale, 1.2));
            }
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                const baseScale = settings.previewScale === "auto" ? autoScale : (settings.previewScale as number);
                const newScale = Math.min(Math.max(baseScale + delta, 0.25), 3);
                updateSettingsAction({ previewScale: Number(newScale.toFixed(2)) });
            }
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('wheel', handleWheel, { passive: false });
        }
        return () => {
            if (container) container.removeEventListener('wheel', handleWheel);
        };
    }, [settings.previewScale, autoScale, updateSettingsAction]);

    const currentScale = settings.previewScale === "auto" ? autoScale : settings.previewScale;
    const currentFont = fontOptions.find(f => f.name === settings.resumeFont) || fontOptions[0];

    const [isFontOpen, setIsFontOpen] = useState(false);
    const [isScaleOpen, setIsScaleOpen] = useState(false);

    const c = content;
    const hasContact = c.basics.phone || c.basics.email || c.basics.linkedin || c.basics.portfolio || c.basics.location;

    return (
        <div ref={containerRef} className="flex-grow h-full bg-muted flex flex-col overflow-hidden relative min-h-0">
            {/* Preview header bar */}
            <div className="h-9 bg-muted/80 border-b border-border-subtle flex items-center justify-between px-3 shrink-0">
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Compiled Output</span>
                    
                    {/* FONT SELECT */}
                    <div 
                        onMouseEnter={() => setIsFontOpen(true)}
                        onMouseLeave={() => setIsFontOpen(false)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted hover:bg-muted/80 transition-all cursor-pointer relative"
                    >
                        <RiFontSize size={11} className="text-muted-foreground" />
                        <span className="text-[9px] font-bold text-foreground/60 truncate max-w-[80px]">{settings.resumeFont}</span>
                        <RiArrowDownSLine size={10} className="text-muted-foreground/50" />
                        
                        {isFontOpen && (
                            <div className="absolute top-full left-0 pt-1 w-40 z-[100]">
                                <div className="bg-background shadow-xl border border-border-subtle rounded-[var(--radius-md)] py-1 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                                    {fontOptions.map(f => (
                                        <button key={f.name} onClick={() => { updateSettingsAction({ resumeFont: f.name }); setIsFontOpen(false); }}
                                            className={`w-full text-left px-3 py-1.5 text-[10px] hover:bg-muted transition-all flex items-center justify-between ${settings.resumeFont === f.name ? "text-primary font-bold bg-primary/5" : "text-muted-foreground"}`}>
                                            {f.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SCALE SELECT */}
                    <div 
                        onMouseEnter={() => setIsScaleOpen(true)}
                        onMouseLeave={() => setIsScaleOpen(false)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted hover:bg-muted/80 transition-all cursor-pointer relative"
                    >
                        <span className="text-[9px] font-bold text-foreground/60">{settings.previewScale === "auto" ? "Auto" : `${(settings.previewScale as number) * 100}%`}</span>
                        <RiArrowDownSLine size={10} className="text-muted-foreground/50" />
                        
                        {isScaleOpen && (
                            <div className="absolute top-full left-0 pt-1 w-24 z-[100]">
                                <div className="bg-background shadow-xl border border-border-subtle rounded-[var(--radius-md)] py-1 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                                    <button onClick={() => { updateSettingsAction({ previewScale: "auto" }); setIsScaleOpen(false); }}
                                        className={`w-full text-left px-3 py-1.5 text-[10px] hover:bg-muted transition-all ${settings.previewScale === "auto" ? "text-primary font-bold bg-primary/5" : "text-muted-foreground"}`}>
                                        Auto-Fit
                                    </button>
                                    <div className="h-px bg-border-subtle my-1" />
                                    {scaleOptions.map(s => (
                                        <button key={s} onClick={() => { updateSettingsAction({ previewScale: s }); setIsScaleOpen(false); }}
                                            className={`w-full text-left px-3 py-1.5 text-[10px] hover:bg-muted transition-all ${settings.previewScale === s ? "text-primary font-bold bg-primary/5" : "text-muted-foreground"}`}>
                                            {s * 100}%
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground/40">A4 · 1 page</span>
            </div>
            {/* Paper scroll area */}
            <div className="flex-grow overflow-y-auto overflow-x-hidden custom-scrollbar scroll-smooth bg-muted/30 p-8 sm:p-12 min-h-0">
                {/* Visual Footprint Container (Centered via mx-auto) */}
                <div 
                    style={{ 
                        width: `${210 * (currentScale as number)}mm`,
                        height: `${realPaperHeight * (currentScale as number)}mm` 
                    }} 
                    className="mx-auto shadow-[0_30px_70px_rgba(0,0,0,0.12)] relative"
                >
                    {/* High-Fidelity Transform Engine */}
                    <div 
                        ref={paperRef}
                        className="bg-white shrink-0 origin-top-left transition-transform duration-300 ease-out"
                        style={{ 
                            width: '210mm', 
                            minHeight: '297mm',
                            transform: `scale(${currentScale})`,
                            fontFamily: currentFont.family,
                            WebkitFontSmoothing: 'antialiased',
                            MozOsxFontSmoothing: 'grayscale',
                            position: 'absolute',
                            top: 0,
                            left: 0
                        }}
                    >
                        <div className="p-[48px_54px] text-foreground leading-[1.45]">
                        
                        {/* ── HEADER ── */}
                        <div 
                            className={`mb-1 cursor-pointer hover:bg-primary/5 rounded px-1 transition-colors ${template === 'professional' ? 'text-left border-l-4 border-foreground pl-5' : 'text-center'}`} 
                            data-path="basics.name" 
                            onClick={() => onJumpToSourceAction('basics.name')}
                        >
                            <h1 className="text-[22px] font-bold tracking-[0.01em] leading-tight">
                                {c.basics.name || "Your Name"}
                            </h1>
                            {hasContact && (
                                <div className={`text-[10px] text-foreground/80 mt-1 leading-snug flex flex-wrap gap-x-1 ${template === 'professional' ? 'justify-start' : 'justify-center'}`}>
                                    {/* Row 1: phone · email */}
                                    <div className="flex flex-wrap gap-x-1">
                                        {c.basics.phone && (
                                            <span className="cursor-pointer hover:text-primary" onClick={(e) => { e.stopPropagation(); onJumpToSourceAction('basics.phone'); }}>
                                                {c.basics.phone}
                                            </span>
                                        )}
                                        {c.basics.phone && c.basics.email && <span className="text-muted-foreground/30"> · </span>}
                                        {c.basics.email && (
                                            <span className="cursor-pointer hover:text-primary" onClick={(e) => { e.stopPropagation(); onJumpToSourceAction('basics.email'); }}>
                                                {c.basics.email}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-muted-foreground/30"> · </span>
                                    {/* Row 2: linkedin · portfolio · location */}
                                    <div className="flex flex-wrap gap-x-1">
                                        {c.basics.linkedin && (
                                            <a href={ensureAbsoluteUrl(c.basics.linkedin)} target="_blank" rel="noopener noreferrer" className="hover:text-primary" onClick={(e) => e.stopPropagation()}>
                                                {c.basics.linkedin.replace(/^https?:\/\/(www\.)?/, "")}
                                            </a>
                                        )}
                                        {c.basics.linkedin && c.basics.portfolio && <span className="text-muted-foreground/30"> · </span>}
                                        {c.basics.portfolio && (
                                            <a href={ensureAbsoluteUrl(c.basics.portfolio)} target="_blank" rel="noopener noreferrer" className="hover:text-primary" onClick={(e) => e.stopPropagation()}>
                                                {c.basics.portfolio.replace(/^https?:\/\/(www\.)?/, "")}
                                            </a>
                                        )}
                                        {(c.basics.linkedin || c.basics.portfolio) && c.basics.location && <span className="text-muted-foreground/30"> · </span>}
                                        {c.basics.location && (
                                            <span className="cursor-pointer hover:text-primary" onClick={(e) => { e.stopPropagation(); onJumpToSourceAction('basics.location'); }}>
                                                {c.basics.location}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>


                        {/* ── EDUCATION ── */}
                        {c.education?.length > 0 && (
                            <ResumeSection title="Education" template={template}>
                                {c.education.map((edu, idx) => (
                                    <div key={edu.id} className="mb-2 cursor-pointer hover:bg-primary/5 rounded px-0.5 -mx-0.5 transition-colors" onClick={() => onJumpToSourceAction(`education.${idx}.school`)}>
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-[11px] font-bold">{edu.school || "Institution"}</span>
                                            <span className="text-[10px] text-muted-foreground">{edu.location || ""}</span>
                                        </div>
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-[10px] italic text-foreground/80">
                                                {edu.degree || "Degree"}
                                                {edu.gpa && ` | ${edu.gpa}`}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">{edu.period || ""}</span>
                                        </div>
                                        {edu.highlights?.length > 0 && edu.highlights.some(h => h.trim()) && (
                                            <ul className="mt-0.5 ml-4 list-disc">
                                                {edu.highlights.filter(h => h.trim()).map((h, hIdx) => (
                                                    <li key={hIdx} className="text-[10px] text-foreground/80 leading-snug">{h}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </ResumeSection>
                        )}

                        {/* ── SKILLS ── */}
                        {c.skills?.length > 0 && c.skills.some(s => s.items.trim()) && (
                            <ResumeSection title="Skills" template={template}>
                                <ul className="ml-4 list-disc space-y-0.5">
                                    {c.skills.filter(s => s.items.trim()).map((skill) => (
                                        <li key={skill.id} className="text-[10px] text-foreground/80 leading-snug cursor-pointer hover:bg-primary/5 rounded transition-colors" onClick={() => onJumpToSourceAction(`skills.${skill.id}`)}>
                                            <span className="font-bold">{skill.category}:</span> {skill.items}
                                        </li>
                                    ))}
                                </ul>
                            </ResumeSection>
                        )}

                        {/* ── PROJECTS ── */}
                        {c.projects?.length > 0 && (
                            <ResumeSection title="Projects" template={template}>
                                {c.projects.map((proj, idx) => (
                                    <div key={proj.id} className="mb-2 cursor-pointer hover:bg-primary/5 rounded px-0.5 -mx-0.5 transition-colors" onClick={() => onJumpToSourceAction(`projects.${idx}.title`)}>
                                        <div className="flex justify-between items-baseline gap-2">
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="text-[11px] font-bold">{proj.title || "Project"}</span>
                                                {proj.link && (
                                                    <a href={proj.link} target="_blank" rel="noopener noreferrer" className="text-muted-foreground/40 hover:text-primary" onClick={(e) => e.stopPropagation()}>
                                                        <RiExternalLinkLine size={8} />
                                                    </a>
                                                )}
                                            </div>
                                            <span className="text-[10px] italic text-muted-foreground shrink-0">
                                                {proj.techStack || ""}
                                                {proj.techStack && proj.link && " · "}
                                                {proj.link && <a href={ensureAbsoluteUrl(proj.link)} target="_blank" rel="noopener noreferrer" className="font-bold not-italic hover:text-primary" onClick={(e) => e.stopPropagation()}>Live Demo</a>}
                                            </span>
                                        </div>
                                        {proj.highlights?.length > 0 && proj.highlights.some(h => h.trim()) && (
                                            <ul className="mt-0.5 ml-4 list-disc">
                                                {proj.highlights.filter(h => h.trim()).map((h, hIdx) => (
                                                    <li key={hIdx} className="text-[10px] text-foreground/80 leading-snug">{h}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </ResumeSection>
                        )}

                        {/* ── EXPERIENCE ── */}
                        {c.experience?.length > 0 && (
                            <ResumeSection title="Experience" template={template}>
                                {c.experience.map((exp, idx) => (
                                    <div key={exp.id} className="mb-2 cursor-pointer hover:bg-primary/5 rounded px-0.5 -mx-0.5 transition-colors" data-path={`experience.${idx}.role`} onClick={() => onJumpToSourceAction(`experience.${idx}.role`)}>
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-[11px] font-bold">{exp.company || "Company"}</span>
                                            <span className="text-[10px] text-muted-foreground">{exp.location || ""}</span>
                                        </div>
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-[10px] italic text-foreground/80">{exp.role || "Role"}</span>
                                            <span className="text-[10px] text-muted-foreground">{exp.period || ""}</span>
                                        </div>
                                        {exp.highlights?.length > 0 && exp.highlights.some(h => h.trim()) && (
                                            <ul className="mt-0.5 ml-4 list-disc">
                                                {exp.highlights.filter(h => h.trim()).map((h, hIdx) => (
                                                    <li key={hIdx} className="text-[10px] text-foreground/80 leading-snug">{h}</li>
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
                                        <li key={ach.id} className="text-[10px] text-foreground/80 leading-snug">
                                            <span className="font-bold">{ach.category}:</span> {ach.items}
                                        </li>
                                    ))}
                                </ul>
                            </ResumeSection>
                        )}

                        {/* ── SUMMARY (if present, rendered after sections like some LaTeX templates) ── */}
                        {c.basics.summary && (
                            <ResumeSection title="Summary" template={template}>
                                <p className="text-[10px] text-foreground/80 leading-relaxed cursor-pointer hover:bg-primary/5 rounded transition-colors" onClick={() => onJumpToSourceAction('basics.summary')}>
                                    {c.basics.summary}
                                </p>
                            </ResumeSection>
                        )}
                    </div>
                </div>
            </div>
        </div>
        </div>
    );
}

/** LaTeX-style section: bold uppercase title with full-width rule */
function ResumeSection({ title, children, template }: { title: string; children: React.ReactNode; template?: string }) {
    const isMinimal = template === 'minimal';
    return (
        <section className="mt-3 mb-1.5">
            <h2 
                className={`text-[13px] font-bold uppercase tracking-[0.02em] mb-1.5 ${isMinimal ? 'bg-muted px-2 py-1 rounded border-none' : 'border-b border-foreground pb-[1px]'}`}
                style={{ lineHeight: 1.3 }}
            >
                {title}
            </h2>
            {children}
        </section>
    );
}
