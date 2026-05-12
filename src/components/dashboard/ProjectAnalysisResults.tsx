"use client";

import React, { useState } from 'react';
import { m } from 'framer-motion';
import { 
    RiShieldCheckLine, 
    RiToolsLine, 
    RiTextSnippet, 
    RiFileCopy2Line,
    RiCheckLine,
    RiCloseLine,
    RiGithubFill,
    RiExternalLinkLine
} from 'react-icons/ri';

export interface ProjectAnalysisData {
    score: number;
    techStack: string[];
    readmeScore: number;
    hasDemo: boolean;
    hasRepo: boolean;
    analysis: {
        strengths: string[];
        weaknesses: string[];
        improvements: string[];
    };
    suggestedResumeBullet: string;
    verificationStatus: 'verified' | 'unverified' | 'partial';
    url?: string;
}

interface Props {
    result: ProjectAnalysisData;
}

export function ProjectAnalysisResults({ result }: Props) {
    const [copied, setCopied] = useState(false);

    const copyBullet = () => {
        if (!result?.suggestedResumeBullet) return;
        navigator.clipboard.writeText(result.suggestedResumeBullet);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <m.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
            {/* LEFT: Score & Stats */}
            <div className="md:col-span-1 space-y-6">
                <div className="bg-background border border-border-subtle rounded-[var(--radius-2xl)] p-6 flex flex-col items-center text-center">
                    <div className="relative w-24 h-24 mb-4">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="48" cy="48" r="40"
                                stroke="currentColor" strokeWidth="8" fill="transparent"
                                className="text-muted"
                            />
                            <m.circle
                                cx="48" cy="48" r="40"
                                stroke="currentColor" strokeWidth="8" fill="transparent"
                                strokeDasharray="251.2"
                                initial={{ strokeDashoffset: 251.2 }}
                                animate={{ strokeDashoffset: 251.2 - (251.2 * result.score) / 100 }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="text-primary"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xl font-black text-foreground">{result.score}</span>
                        </div>
                    </div>
                    <h4 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] mb-1">Proof Score</h4>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-success/10 text-success rounded-full">
                        <RiShieldCheckLine size={10} />
                        <span className="text-[8px] font-black uppercase tracking-widest">{result.verificationStatus}</span>
                    </div>
                </div>

                <div className="bg-background border border-border-subtle rounded-[var(--radius-2xl)] p-5 space-y-4">
                    <div className="space-y-2">
                        <h4 className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                            <RiToolsLine size={12} /> Tech Stack
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                            {result.techStack.map((tech, i) => (
                                <span key={i} className="px-2 py-0.5 bg-muted border border-border-subtle text-foreground text-[9px] font-bold rounded-[var(--radius-md)]">
                                    {tech}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="pt-4 border-t border-border-subtle flex justify-between items-center">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">README Quality</span>
                        <span className="text-[10px] font-black text-foreground">{result.readmeScore}/10</span>
                    </div>
                </div>
            </div>

            {/* RIGHT: Analysis & Bullet */}
            <div className="md:col-span-2 space-y-6">
                <div className="bg-background border border-border-subtle rounded-[var(--radius-2xl)] p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <h4 className="text-[9px] font-black text-success uppercase tracking-widest">Strengths</h4>
                            <ul className="space-y-2">
                                {result.analysis.strengths.map((s, i) => (
                                    <li key={i} className="flex items-start gap-2 text-[11px] text-foreground/60 leading-relaxed">
                                        <RiCheckLine className="text-success shrink-0 mt-0.5" size={12} />
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="space-y-3">
                            <h4 className="text-[9px] font-black text-destructive/70 uppercase tracking-widest">Areas for Improvement</h4>
                            <ul className="space-y-2">
                                {result.analysis.weaknesses.map((w, i) => (
                                    <li key={i} className="flex items-start gap-2 text-[11px] text-foreground/60 leading-relaxed">
                                        <RiCloseLine className="text-destructive/60 shrink-0 mt-0.5" size={12} />
                                        {w}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-border-subtle space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
                                <RiTextSnippet size={12} /> Suggested Resume Bullet
                            </h4>
                            <button 
                                onClick={copyBullet}
                                className="flex items-center gap-1.5 text-[9px] font-black text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
                            >
                                {copied ? <RiCheckLine className="text-success" /> : <RiFileCopy2Line />}
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                        <div className="p-4 bg-primary/5 border border-primary/10 rounded-[var(--radius-xl)]">
                            <p className="text-xs text-foreground font-semibold leading-relaxed italic">
                                &quot;{result.suggestedResumeBullet}&quot;
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-foreground rounded-[var(--radius-2xl)] p-4 flex items-center justify-between shadow-xl shadow-foreground/10">
                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
                        Use this bullet to quantify your project impact in the editor.
                    </p>
                    <div className="flex items-center gap-3">
                        {result.hasRepo && <RiGithubFill className="text-white/40" size={18} />}
                        {result.hasDemo && <RiExternalLinkLine className="text-white/40" size={18} />}
                        {result.url && (
                            <a 
                                href={result.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                            >
                                <RiExternalLinkLine className="text-white" size={12} />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </m.div>
    );
}
