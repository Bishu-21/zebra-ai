"use client";

import React, { useState, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { 
    RiScanLine, 
    RiUploadCloud2Line, 
    RiFileTextLine,
    RiLoader4Line,
    RiArrowRightLine,
    RiArrowRightSLine,
    RiCloseCircleLine,
    RiInformationLine,
    RiRadarLine
} from "react-icons/ri";
import { useRouter } from "next/navigation";
import { ResumeResultsModal } from "./ResumeResultsModal";
import { ResumeAnalysisData } from "@/components/compiler/types";

export function AnalyzeResume() {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [scanStep, setScanStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisData | null>(null);
  const [activeResumeId, setActiveResumeId] = useState<string | null>(null);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setScanStep("Uploading Document...");
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/resumes/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setContent(data.content);
      setScanStep("Content Extracted.");
      
      // Auto-trigger analysis
      setTimeout(() => triggerAnalysis(data.content), 800);

    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
      setIsUploading(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const triggerAnalysis = async (textToAnalyze: string) => {
    setIsAnalyzing(true);
    const steps = [
      "Initializing Analysis...",
      "Evaluating ATS benchmarks...",
      "Analyzing content impact...",
      "Performing readability check...",
      "Generating improvement suggestions...",
      "Finalizing Report..."
    ];
    let stepIdx = 0;
    
    setScanStep(steps[0]);
    const stepInterval = setInterval(() => {
      stepIdx++;
      if (stepIdx < steps.length) setScanStep(steps[stepIdx]);
    }, 1200);

    setError(null);

    try {
      const res = await fetch("/api/ai/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: textToAnalyze }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");

      clearInterval(stepInterval);
      setScanStep("Analysis Complete.");
      
      setTimeout(() => {
        setAnalysisResult(data.analysis);
        setActiveResumeId(data.resumeId);
        setIsResultsModalOpen(true);
        setIsAnalyzing(false);
        setIsUploading(false);
        setIsOpen(false);
        router.refresh();
      }, 500);

    } catch (err: any) {
      setError(err.message || "Analysis failed");
      setIsAnalyzing(false);
      setIsUploading(false);
      clearInterval(stepInterval);
    }
  };

  const handleManualAnalyze = () => {
    if (!content.trim()) {
      setError("Please paste your resume content or upload a file.");
      return;
    }
    triggerAnalysis(content);
  };

  const isProcessing = isAnalyzing || isUploading;

  return (
    <>
      {/* Launcher Card */}
      <div 
        onClick={() => setIsOpen(true)}
        className="group/card relative overflow-hidden flex flex-col justify-between w-full h-full cursor-pointer transition-all p-10 bg-white border border-black/[0.04] rounded-[2.5rem] hover:shadow-2xl hover:shadow-black/[0.03] active:scale-[0.99] group"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-black/[0.01] rounded-bl-[4rem] group-hover/card:scale-110 transition-transform" />
        
        <div className="flex items-start justify-between mb-8">
            <div className="w-14 h-14 bg-black/[0.03] rounded-2xl flex items-center justify-center text-[#737373]/40 group-hover/card:bg-[#3B82F6] group-hover/card:text-white transition-all duration-500">
                <RiScanLine size={24} />
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                <span className="text-[0.6rem] font-bold uppercase tracking-widest text-accent-gray">System Status</span>
                <RiArrowRightSLine size={14} className="text-primary" />
            </div>
        </div>

        <div>
            <h3 className="font-bold text-2xl mb-2 text-foreground tracking-tighter">Resume Analyzer</h3>
            <p className="text-[0.65rem] text-accent-gray font-bold uppercase tracking-[0.1em] leading-relaxed">
                Detailed Content Review & <br/> Optimization
            </p>
        </div>
      </div>

      {/* Tool Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isProcessing && setIsOpen(false)}></div>
            <div className="relative bg-white/90 backdrop-blur-xl w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] shadow-2xl border border-white/50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="p-10 border-b border-black/[0.03] flex items-center justify-between bg-white/40 backdrop-blur-3xl sticky top-0 z-20">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-primary rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-blue-500/20">
                            <RiRadarLine size={28} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1.5">
                                <h2 className="text-2xl font-bold text-foreground tracking-tighter uppercase leading-none">Resume Analysis</h2>
                            </div>
                            <p className="text-[0.7rem] font-bold text-accent-gray uppercase tracking-widest">
                                Content Review <span className="mx-2 opacity-50">&</span> Optimization
                            </p>
                        </div>
                    </div>
                    <button onClick={() => !isProcessing && setIsOpen(false)} className="w-12 h-12 flex items-center justify-center text-black/20 hover:text-black hover:bg-black/[0.03] rounded-full transition-all disabled:opacity-30" disabled={isProcessing}>
                        <RiCloseCircleLine size={24} />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto p-10 no-scrollbar relative">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h4 className="text-sm font-black uppercase tracking-widest text-black/60">Resume Content</h4>
                                <p className="text-xs font-bold text-black/40 italic">Paste plain text or import a document below.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept=".pdf,.docx,.txt"
                                    className="hidden"
                                />
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isProcessing}
                                    className="flex items-center gap-2 px-6 py-3 bg-white border border-black/10 rounded-xl text-[0.7rem] font-bold transition-all shadow-sm disabled:opacity-30 text-black uppercase tracking-wider hover:border-black/20"
                                >
                                    {isUploading ? <RiLoader4Line size={18} className="animate-spin" /> : <RiUploadCloud2Line size={18} />}
                                    Upload Document
                                </button>
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="relative group/input overflow-hidden rounded-[2rem] border border-black/5 shadow-inner bg-black/[0.02]">
                            <div className="absolute top-8 left-8 text-black/20 z-20">
                                <RiFileTextLine size={32} />
                            </div>
                            
                            {/* Cinematic Scan Animation Overlay */}
                            <AnimatePresence>
                                {isProcessing && (
                                    <m.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 z-30 pointer-events-none overflow-hidden rounded-[2rem]"
                                    >
                                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[4px]"></div>
                                        
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                                            <div className="scale-150 text-black/80">
                                                <RiLoader4Line className="animate-spin" size={40} />
                                            </div>
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="text-sm font-bold uppercase tracking-[0.2em] text-[#0A0A0A] animate-pulse">{scanStep}</span>
                                                <div className="w-48 h-2 bg-black/[0.05] rounded-full overflow-hidden">
                                                    <m.div 
                                                        className="h-full bg-[#3B82F6]"
                                                        initial={{ width: "0%" }}
                                                        animate={{ width: "100%" }}
                                                        transition={{ duration: 6, ease: "linear" }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Laser Audit Line */}
                                        <m.div 
                                            animate={{ top: ["0%", "100%", "0%"] }}
                                            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                                            className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#3B82F6] to-transparent shadow-[0_0_30px_rgba(59,130,246,0.6)] z-40 opacity-50"
                                        />
                                    </m.div>
                                )}
                            </AnimatePresence>

                            <textarea 
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Paste your resume content here..."
                                className={`w-full min-h-[400px] pl-20 pr-10 py-10 bg-transparent text-[1rem] font-medium focus:outline-none transition-all resize-none leading-relaxed placeholder:text-black/20 text-black relative z-10 ${isProcessing ? "blur-[2px]" : ""}`}
                                disabled={isProcessing}
                            />
                            
                            {error && (
                                <m.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="absolute bottom-10 left-10 right-10 flex items-center gap-3 text-white text-[0.75rem] font-black uppercase tracking-widest bg-red-500 p-6 rounded-2xl shadow-2xl z-40"
                                >
                                    <RiInformationLine size={20} />
                                    {error}
                                </m.div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-black/5 flex items-center justify-between bg-white/30 backdrop-blur-xl sticky bottom-0">
                    <div className="flex items-center gap-3 px-6 py-3 bg-black/5 rounded-2xl border border-black/5">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-[0.65rem] font-black uppercase tracking-widest text-accent-gray">Analyzer Ready</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsOpen(false)}
                            disabled={isProcessing}
                            className="px-8 py-4 text-sm font-black uppercase tracking-widest text-black/40 hover:text-black transition-colors disabled:opacity-20"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleManualAnalyze}
                            disabled={isProcessing || !content.trim()}
                            className="bg-[#3B82F6] text-white px-12 py-5 rounded-[1.25rem] font-bold text-sm hover:bg-[#2563EB] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-blue-500/20 disabled:opacity-30 flex items-center gap-3 group"
                        >
                            {isAnalyzing ? "Processing Analysis..." : "Run Analysis"}
                            {!isAnalyzing && <RiArrowRightLine size={18} className="group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {isResultsModalOpen && analysisResult && (
        <ResumeResultsModal 
          isOpen={isResultsModalOpen}
          onCloseAction={() => setIsResultsModalOpen(false)}
          data={analysisResult}
          resumeId={activeResumeId || undefined}
        />
      )}
    </>
  );
}
