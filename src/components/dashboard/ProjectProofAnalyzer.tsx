"use client";

import React, { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { 
    RiGithubFill, 
    RiExternalLinkLine, 
    RiShieldCheckLine, 
    RiErrorWarningLine, 
    RiLoader4Line,
    RiCommandLine
} from 'react-icons/ri';
import { ProjectAnalysisResults } from './ProjectAnalysisResults';

interface ProjectAnalysis {
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
    verificationStatus: 'supported' | 'partial' | 'not_assessed' | 'verified' | 'unverified';
}

export function ProjectProofAnalyzer() {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<ProjectAnalysis | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        if (!url.trim()) return;
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch('/api/ai/project-analyse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to analyze project');

            setResult(data.analysis);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full space-y-6">
            {/* INPUT SECTION */}
            <div className="bg-white border border-neutral-200/70 rounded-2xl p-6 shadow-2xs space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center shadow-2xs shrink-0">
                        <RiShieldCheckLine size={20} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-[#0A0A0A] tracking-tight">Project Proof Analyzer</h3>
                        <p className="text-xs font-normal text-neutral-500">Verify GitHub or Live Demo links for resume evidence</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative flex-grow">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                            {url.includes('github.com') ? <RiGithubFill size={16} /> : <RiExternalLinkLine size={16} />}
                        </div>
                        <input 
                            type="text" 
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Paste GitHub or Live Demo URL..."
                            className="w-full h-10 bg-neutral-50 border border-neutral-200/80 rounded-full pl-10 pr-4 text-xs font-medium text-[#0A0A0A] focus:bg-white focus:border-[#0A0A0A] transition-all outline-none placeholder:text-neutral-400"
                        />
                    </div>
                    <button 
                        onClick={handleAnalyze}
                        disabled={isLoading || !url.trim()}
                        className="h-10 px-5 bg-[#0A0A0A] hover:bg-neutral-800 text-white rounded-full text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-2 shadow-2xs active:scale-95 shrink-0"
                    >
                        {isLoading ? <RiLoader4Line className="animate-spin" size={15} /> : <RiCommandLine size={15} />}
                        {isLoading ? 'Analyzing...' : 'Analyze Proof'}
                    </button>
                </div>

                {error && (
                    <m.div 
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-red-50 border border-red-200/80 rounded-xl flex items-center gap-2 text-xs font-medium text-red-700"
                    >
                        <RiErrorWarningLine size={16} className="shrink-0 text-red-600" />
                        <span>{error}</span>
                    </m.div>
                )}
            </div>

            {/* RESULTS SECTION */}
            <AnimatePresence mode="wait">
                {result && (
                    <ProjectAnalysisResults result={result} />
                )}
            </AnimatePresence>
        </div>
    );
}
