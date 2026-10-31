"use client";

import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { 
    RiGithubFill, 
    RiExternalLinkLine, 
    RiErrorWarningLine, 
    RiLoader4Line,
    RiCommandLine
} from 'react-icons/ri';
import { ProjectAnalysisResults } from './ProjectAnalysisResults';
import { featureChrome } from './feature-chrome';

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
        <div className="w-full space-y-5">
                <div className="space-y-1.5">
                    <label htmlFor="project-proof-url" className={featureChrome.label}>Project URL</label>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative min-w-0 flex-grow">
                        <div className={featureChrome.fieldIcon}>
                            {url.includes('github.com') ? <RiGithubFill size={16} /> : <RiExternalLinkLine size={16} />}
                        </div>
                        <input
                            id="project-proof-url"
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://github.com/… or a live demo URL"
                            className={`${featureChrome.input} pl-10`}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleAnalyze}
                        disabled={isLoading || !url.trim()}
                        className={featureChrome.primaryButton}
                    >
                        {isLoading ? <RiLoader4Line className="animate-spin" size={15} /> : <RiCommandLine size={15} />}
                        {isLoading ? "Checking…" : "Check project"}
                    </button>
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        <RiErrorWarningLine size={16} className="shrink-0 text-red-600" />
                        <span>{error}</span>
                    </div>
                )}

            {/* RESULTS SECTION */}
            <AnimatePresence mode="wait">
                {result && (
                    <ProjectAnalysisResults result={result} />
                )}
            </AnimatePresence>
        </div>
    );
}
