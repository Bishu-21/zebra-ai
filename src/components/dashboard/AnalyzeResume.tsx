"use client";

import React, { useState, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
    RiScanLine,
    RiUploadCloud2Line,
    RiLoader4Line,
    RiArrowRightLine,
    RiArrowRightSLine,
    RiCloseCircleLine,
    RiInformationLine,
    RiCheckboxCircleLine
} from "react-icons/ri";
import { useRouter } from "next/navigation";
import { ResumeResultsModal } from "./ResumeResultsModal";
import { ResumeAnalysisData } from "@/components/compiler/types";
import { readApiResponse } from "@/lib/api-response";
import { ResumeProcessingStatus } from "./ResumeProcessingStatus";
import { loadResumeReviewOptions, type ResumeReviewOption } from "@/lib/resume-review-options";

export function AnalyzeResume() {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [scanStep, setScanStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisData | null>(null);
  const [activeResumeId, setActiveResumeId] = useState<string | null>(null);
  const [uploadedTitle, setUploadedTitle] = useState<string | null>(null);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [savedResumes, setSavedResumes] = useState<ResumeReviewOption[]>([]);
  const [isLoadingResumes, setIsLoadingResumes] = useState(false);
  const [resumeListError, setResumeListError] = useState<string | null>(null);
  const [resumeListAttempt, setResumeListAttempt] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const openReview = React.useCallback(() => {
    setIsLoadingResumes(true);
    setResumeListError(null);
    setResumeListAttempt(attempt => attempt + 1);
    setIsOpen(true);
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    void loadResumeReviewOptions(fetch, controller.signal)
      .then(options => { if (!controller.signal.aborted) setSavedResumes(options); })
      .catch(err => {
        if (!controller.signal.aborted) setResumeListError(err instanceof Error ? err.message : "Could not load your saved resumes");
      })
      .finally(() => { if (!controller.signal.aborted) setIsLoadingResumes(false); });
    return () => controller.abort();
  }, [isOpen, resumeListAttempt]);

  React.useEffect(() => {
    const open = () => {
      openReview();
      sessionStorage.removeItem("zebu:pending-tool");
    };
    window.addEventListener("zebu:open-resume_analysis", open);
    if (sessionStorage.getItem("zebu:pending-tool") === "resume_analysis") open();
    return () => window.removeEventListener("zebu:open-resume_analysis", open);
  }, [openReview]);

  const handleAnalysisFailure = (err: unknown) => {
    setError(err instanceof Error ? err.message : "Analysis failed");
    setIsAnalyzing(false);
    setIsUploading(false);
  };

  const startAnalysis = (textToAnalyze?: string, resumeId?: string) => {
    void triggerAnalysis(textToAnalyze, resumeId).catch(handleAnalysisFailure);
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

      const data = await readApiResponse<{ id: string; title?: string }>(res, "Upload failed");

      setContent("");
      setActiveResumeId(data.id);
      setUploadedTitle(data.title || file.name);
      setScanStep("Resume structured. Starting evidence audit...");
      startAnalysis(undefined, data.id);

    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
      setIsUploading(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const triggerAnalysis = async (textToAnalyze?: string, resumeId?: string) => {
    setIsAnalyzing(true);
    setScanStep("Reviewing your resume against 45 evidence checks...");

    setError(null);

    try {
      const res = await fetch("/api/ai/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resumeId ? { resumeId } : { content: textToAnalyze }),
      });

      const data = await readApiResponse<{ analysis: ResumeAnalysisData; resumeId: string }>(res, "Analysis failed");

      setScanStep("Analysis Complete.");

      setAnalysisResult(data.analysis);
      setActiveResumeId(data.resumeId);
      setIsResultsModalOpen(true);
      setIsAnalyzing(false);
      setIsUploading(false);
      setIsOpen(false);
      router.refresh();

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setIsAnalyzing(false);
      setIsUploading(false);
    }
  };

  const handleManualAnalyze = () => {
    if (activeResumeId) {
      startAnalysis(undefined, activeResumeId);
      return;
    }
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
        onClick={openReview}
        className="group/card relative overflow-hidden flex flex-col justify-between w-full h-full cursor-pointer transition-all p-7 bg-white border border-neutral-200/80 rounded-3xl hover:border-neutral-300 hover:shadow-xl active:scale-[0.99] group shadow-xs"
      >
        <div className="flex items-start justify-between mb-8">
            <div className="w-11 h-11 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-600 group-hover/card:bg-[#0A0A0A] group-hover/card:text-white transition-colors duration-300">
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
                          <div className="w-11 h-11 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center shadow-2xs shrink-0">
                              <RiScanLine size={22} />
                          </div>
                          <div>
                              <h2 className="text-lg font-bold tracking-tight text-[#0A0A0A]">Check My Resume</h2>
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
                      <div className="space-y-2">
                          <label htmlFor="review-saved-resume" className="text-xs font-semibold text-neutral-600">Existing resume</label>
                          <select
                              id="review-saved-resume"
                              value={savedResumes.some(resume => resume.id === activeResumeId) ? activeResumeId ?? "" : ""}
                              disabled={isProcessing || isLoadingResumes || !!resumeListError}
                              onChange={event => {
                                  setActiveResumeId(event.target.value || null);
                                  setUploadedTitle(null);
                                  setContent("");
                                  setError(null);
                              }}
                              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-900 disabled:opacity-50"
                          >
                              <option value="">{isLoadingResumes ? "Loading your resumes..." : "Choose a saved resume"}</option>
                              {savedResumes.map(resume => <option key={resume.id} value={resume.id}>{resume.title || "Untitled resume"}</option>)}
                          </select>
                          {resumeListError ? (
                              <p role="alert" className="text-xs text-red-700">
                                  {resumeListError} <button type="button" onClick={() => {
                                      setIsLoadingResumes(true);
                                      setResumeListError(null);
                                      setResumeListAttempt(attempt => attempt + 1);
                                  }} className="underline">Retry</button>
                              </p>
                          ) : !isLoadingResumes && savedResumes.length === 0 ? (
                              <p className="text-xs text-neutral-500">No saved resumes yet. Paste or upload one below.</p>
                          ) : (
                              <p className="text-xs text-neutral-500">Review the saved version without uploading it again. Analysis uses one credit.</p>
                          )}
                      </div>
                      <div className="flex items-center justify-between">
                          <div>
                              <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Resume Content</h4>
                              <p className="text-xs text-neutral-500 mt-0.5">Or paste plain text or import a new document below</p>
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

                      {uploadedTitle && activeResumeId && !isProcessing && (
                        <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-emerald-950 truncate">{uploadedTitle}</p>
                            <p className="text-[10px] text-emerald-800">Structured draft saved. You can retry the audit without uploading again.</p>
                          </div>
                          <RiCheckboxCircleLine className="text-emerald-700 shrink-0" size={18} />
                        </div>
                      )}

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
                                      <ResumeProcessingStatus key={isAnalyzing ? "analysis" : "upload"} stage={scanStep} />
                                  </m.div>
                              )}
                          </AnimatePresence>

                          <textarea
                              value={content}
                              onChange={(e) => {
                                setContent(e.target.value);
                                setActiveResumeId(null);
                                setUploadedTitle(null);
                              }}
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
                  <div className="px-6 py-4 border-t border-neutral-200/60 flex items-center justify-end bg-white sticky bottom-0 z-20 gap-3">
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
                              disabled={isProcessing || (!content.trim() && !activeResumeId)}
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
