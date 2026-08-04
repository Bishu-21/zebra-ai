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

  const handleAnalysisFailure = (err: unknown) => {
    setError(err instanceof Error ? err.message : "Analysis failed");
    setIsAnalyzing(false);
    setIsUploading(false);
  };

  const startAnalysis = (textToAnalyze: string) => {
    void triggerAnalysis(textToAnalyze).catch(handleAnalysisFailure);
  };

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
      
      // Auto-trigger analysis safely
      setTimeout(() => {
        try {
          startAnalysis(data.content);
        } catch (err) {
          console.error("Auto-analysis execution error:", err);
        }
      }, 800);

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

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Analysis failed");
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
    startAnalysis(content);
  };

  const isProcessing = isAnalyzing || isUploading;

  return (
    <>
      {/* Launcher Card */}
      <div 
        onClick={() => setIsOpen(true)}
        className="group/card relative overflow-hidden flex flex-col justify-between w-full h-full cursor-pointer transition-all p-7 bg-white border border-neutral-200/80 rounded-3xl hover:border-neutral-300 hover:shadow-xl active:scale-[0.99] group shadow-xs"
      >
        <div className="flex items-start justify-between mb-8">
            <div className="w-11 h-11 bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-600 group-hover/card:bg-[#0A0A0A] group-hover/card:text-white transition-colors duration-300">
                <RiScanLine size={22} />
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                <span className="text-xs font-semibold text-neutral-500">Quick Review</span>
                <RiArrowRightSLine size={16} className="text-[#0A0A0A]" />
            </div>
        </div>

        <div>
            <h3 className="font-bold text-xl mb-1.5 text-[#0A0A0A] tracking-tight">Check My Resume</h3>
            <p className="text-xs text-neutral-500 font-normal leading-relaxed">
                Analyze structure, content, and improvement gaps.
            </p>
        </div>
      </div>

      {/* Tool Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
              <m.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/40 backdrop-blur-md" 
                  onClick={() => !isProcessing && setIsOpen(false)}
              />
              <m.div 
                  initial={{ scale: 0.96, opacity: 0, y: 12 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.96, opacity: 0, y: 12 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="relative bg-white w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl border border-neutral-200/80 flex flex-col overflow-hidden z-10"
              >
                  {/* Header */}
                  <div className="px-6 py-5 border-b border-neutral-200/60 flex items-center justify-between bg-white sticky top-0 z-20">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center shadow-2xs shrink-0">
                              <RiRadarLine size={20} />
                          </div>
                          <div>
                              <h2 className="text-lg font-bold tracking-tight text-[#0A0A0A]">Resume Analysis</h2>
                              <p className="text-xs font-normal text-neutral-500">Analyze structure, content, and improvement gaps</p>
                          </div>
                      </div>
                      <button 
                          onClick={() => !isProcessing && setIsOpen(false)} 
                          className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-[#0A0A0A] flex items-center justify-center transition-all disabled:opacity-40" 
                          disabled={isProcessing}
                      >
                          <RiCloseCircleLine size={18} />
                      </button>
                  </div>

                  {/* Body Content */}
                  <div className="flex-grow overflow-y-auto p-6 sm:p-8 space-y-6">
                      <div className="flex items-center justify-between">
                          <div>
                              <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Resume Content</h4>
                              <p className="text-xs text-neutral-500 mt-0.5">Paste plain text or import a document below</p>
                          </div>
                          <div>
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
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200/80 rounded-full text-xs font-semibold text-[#0A0A0A] transition-all disabled:opacity-40"
                              >
                                  {isUploading ? <RiLoader4Line size={14} className="animate-spin" /> : <RiUploadCloud2Line size={14} />}
                                  <span>Upload Document</span>
                              </button>
                          </div>
                      </div>

                      {/* Input Area */}
                      <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-neutral-50/50">
                          {/* Scan Overlay */}
                          <AnimatePresence>
                              {isProcessing && (
                                  <m.div 
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xs gap-4 p-6"
                                  >
                                      <RiLoader4Line className="animate-spin text-[#0A0A0A]" size={32} />
                                      <div className="flex flex-col items-center gap-2 text-center">
                                          <span className="text-xs font-bold text-[#0A0A0A]">{scanStep}</span>
                                          <div className="w-40 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                                              <m.div 
                                                  className="h-full bg-[#0A0A0A]"
                                                  initial={{ width: "0%" }}
                                                  animate={{ width: "100%" }}
                                                  transition={{ duration: 6, ease: "linear" }}
                                              />
                                          </div>
                                      </div>
                                  </m.div>
                              )}
                          </AnimatePresence>

                          <textarea 
                              value={content}
                              onChange={(e) => setContent(e.target.value)}
                              placeholder="Paste your resume content here..."
                              className="w-full min-h-[260px] p-4 bg-transparent text-xs font-medium text-[#0A0A0A] focus:outline-none transition-all resize-none leading-relaxed placeholder:text-neutral-400"
                              disabled={isProcessing}
                          />
                          
                          {error && (
                              <m.div 
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="m-4 p-3 bg-red-50 border border-red-200/80 rounded-xl flex items-center gap-2 text-xs font-medium text-red-700"
                              >
                                  <RiInformationLine size={16} className="shrink-0 text-red-600" />
                                  <span>{error}</span>
                              </m.div>
                          )}
                      </div>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 border-t border-neutral-200/60 flex items-center justify-between bg-white sticky bottom-0 z-20 gap-3">
                      <div className="px-3 py-1.5 bg-neutral-100 rounded-full text-xs font-semibold text-neutral-600 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>Analyzer Ready</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                          <button 
                              onClick={() => setIsOpen(false)}
                              disabled={isProcessing}
                              className="px-5 py-2.5 rounded-full text-xs font-semibold text-neutral-500 hover:text-[#0A0A0A] transition-all disabled:opacity-40"
                          >
                              Cancel
                          </button>
                          <button 
                              onClick={handleManualAnalyze}
                              disabled={isProcessing || !content.trim()}
                              className="px-6 py-2.5 bg-[#0A0A0A] text-white rounded-full text-xs font-bold shadow-2xs hover:bg-neutral-800 active:scale-95 transition-all inline-flex items-center gap-2 disabled:opacity-40"
                          >
                              {isAnalyzing ? "Processing..." : "Run Analysis"}
                              {!isAnalyzing && <RiArrowRightLine size={15} />}
                          </button>
                      </div>
                  </div>
              </m.div>
          </div>
        )}
      </AnimatePresence>

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
