"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    RiScanLine, 
    RiScan2Line, 
    RiUploadCloud2Line, 
    RiFileTextLine,
    RiLoader4Line,
    RiFlashlightLine,
    RiArrowRightLine,
    RiCloseCircleLine,
    RiInformationLine,
    RiBarChartLine
} from "react-icons/ri";
import { useRouter } from "next/navigation";
import { ResumeResultsModal } from "./ResumeResultsModal";

export function AnalyzeResume() {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [scanStep, setScanStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
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

    } catch (err: any) {
      setError(err.message);
      setIsUploading(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const triggerAnalysis = async (textToAnalyze: string) => {
    setIsAnalyzing(true);
    const steps = ["Initializing Neural Audit...", "Identifying Keywords...", "Benchmarking ATS Score...", "Finalizing Report..."];
    let stepIdx = 0;
    
    setScanStep(steps[0]);
    const stepInterval = setInterval(() => {
        stepIdx++;
        if (stepIdx < steps.length) setScanStep(steps[stepIdx]);
    }, 1500);

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
        setIsResultsModalOpen(true);
        setIsAnalyzing(false);
        setIsUploading(false);
        setIsOpen(false); // Close the launcher modal
        router.refresh();
      }, 500);

    } catch (err: any) {
      setError(err.message);
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
        className="flex items-center justify-between w-full h-full cursor-pointer hover:opacity-90 transition-all p-10 bg-white border border-black/5 rounded-[2.5rem] shadow-sm group/card hover:shadow-xl hover:shadow-black/5 active:scale-[0.99]"
      >
        <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-black/[0.02] border border-black/5 rounded-2xl flex items-center justify-center text-black/[0.12] shadow-inner group-hover/card:scale-110 group-hover/card:bg-black group-hover/card:text-white transition-all duration-500">
                <RiScanLine size={24} />
            </div>
            <div>
                <h3 className="font-black text-xl mb-1 text-black tracking-tight group-hover/card:translate-x-1 transition-transform duration-300">Intelligence Scan</h3>
                <p className="text-sm text-black/40 font-bold uppercase tracking-wider">
                    Execute a neural audit to detect structural deficits.
                </p>
            </div>
        </div>
        <button className="px-6 py-3 bg-black text-white rounded-xl text-[0.7rem] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10">
            Execute Protocol
        </button>
      </div>

      {/* Tool Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isProcessing && setIsOpen(false)}></div>
            <div className="relative bg-white/90 backdrop-blur-xl w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] shadow-2xl border border-white/50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="p-8 border-b border-black/5 flex items-center justify-between bg-white/30 backdrop-blur-md sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-black/5 rounded-2xl flex items-center justify-center text-black/60">
                            <RiFlashlightLine size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-black uppercase tracking-tight">Intelligence Audit Protocol</h2>
                            <p className="text-sm font-medium text-black/50">Benchmark your resume against 45+ global ATS metrics.</p>
                        </div>
                    </div>
                    <button onClick={() => !isProcessing && setIsOpen(false)} className="text-black/30 hover:text-black transition-colors disabled:opacity-30" disabled={isProcessing}>
                        <RiCloseCircleLine size={28} />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto p-10 no-scrollbar relative">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h4 className="text-sm font-black uppercase tracking-widest text-black/60">Source Material</h4>
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
                                    <motion.div 
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
                                                <span className="text-sm font-black uppercase tracking-[0.2em] text-black animate-pulse">{scanStep}</span>
                                                <div className="w-48 h-1 bg-black/5 rounded-full overflow-hidden">
                                                    <motion.div 
                                                        className="h-full bg-black"
                                                        initial={{ width: "0%" }}
                                                        animate={{ width: "100%" }}
                                                        transition={{ duration: 6, ease: "linear" }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Laser Audit Line */}
                                        <motion.div 
                                            animate={{ top: ["0%", "100%", "0%"] }}
                                            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                                            className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-black to-transparent shadow-[0_0_30px_rgba(0,0,0,0.8)] z-40 opacity-30"
                                        />
                                    </motion.div>
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
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="absolute bottom-10 left-10 right-10 flex items-center gap-3 text-white text-[0.75rem] font-black uppercase tracking-widest bg-red-500 p-6 rounded-2xl shadow-2xl z-40"
                                >
                                    <RiInformationLine size={20} />
                                    {error}
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-black/5 flex items-center justify-between bg-white/30 backdrop-blur-xl sticky bottom-0">
                    <div className="flex items-center gap-3 px-6 py-3 bg-black/5 rounded-2xl border border-black/5 shadow-inner">
                        <RiBarChartLine size={18} className="text-black/60" />
                        <span className="text-[0.65rem] font-black uppercase tracking-widest text-black/50">Neural Audit Engine v2.0</span>
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
                            className="bg-black text-white px-12 py-5 rounded-[1.25rem] font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-black/20 disabled:opacity-30 flex items-center gap-3 group"
                        >
                            {isAnalyzing ? "Processing Matrix..." : "Execute Neural Audit"}
                            {!isAnalyzing && <RiArrowRightLine size={18} className="group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      <ResumeResultsModal 
         isOpen={isResultsModalOpen}
         onCloseAction={() => setIsResultsModalOpen(false)}
         data={analysisResult}
      />
    </>
  );
}
