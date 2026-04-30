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
    verificationStatus: 'verified' | 'unverified' | 'partial';
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
            <div className="bg-white border border-black/8 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center">
                        <RiShieldCheckLine className="text-[#3B82F6]" size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-[#0A0A0A] uppercase tracking-tight">Project Proof Analyzer</h3>
                        <p className="text-[10px] font-bold text-[#737373] uppercase tracking-widest">Verify GitHub/Demo links for resume evidence</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <div className="relative flex-grow">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]">
                            {url.includes('github.com') ? <RiGithubFill size={16} /> : <RiExternalLinkLine size={16} />}
                        </div>
                        <input 
                            type="text" 
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Paste GitHub or Live Demo URL..."
                            className="w-full h-11 bg-[#F5F5F5] border border-black/5 rounded-xl pl-10 pr-4 text-xs font-medium focus:bg-white focus:border-[#3B82F6] transition-all outline-none placeholder:text-[#A3A3A3]"
                        />
                    </div>
                    <button 
                        onClick={handleAnalyze}
                        disabled={isLoading || !url.trim()}
                        className="h-11 px-6 bg-[#0A0A0A] hover:bg-[#262626] text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-black/10 active:scale-95"
                    >
                        {isLoading ? <RiLoader4Line className="animate-spin" size={16} /> : <RiCommandLine size={16} />}
                        {isLoading ? 'Analyzing' : 'Analyze'}
                    </button>
                </div>

                {error && (
                    <m.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-[10px] font-bold uppercase tracking-widest"
                    >
                        <RiErrorWarningLine size={14} />
                        {error}
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
