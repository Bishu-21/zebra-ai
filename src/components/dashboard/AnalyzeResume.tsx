"use client";

import React, { useState, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
    RiUploadCloud2Line,
    RiLoader4Line,
    RiCloseLine,
    RiInformationLine,
    RiCheckboxCircleLine,
} from "react-icons/ri";
import { useRouter } from "next/navigation";
import { ResumeResultsModal } from "./ResumeResultsModal";
import { ResumeAnalysisData } from "@/components/compiler/types";
import { readApiResponse } from "@/lib/api-response";
import { ResumeProcessingStatus } from "./ResumeProcessingStatus";
import { loadResumeReviewOptions, type ResumeReviewOption } from "@/lib/resume-review-options";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import { FeatureIcon } from "@/components/dashboard/FeatureIcon";
import { AppIcon } from "@/components/ui/AppIcon";
import { featureChrome } from "@/components/dashboard/feature-chrome";
import { DashboardToolCard } from "./DashboardToolCard";
import { RiFileTextLine } from "react-icons/ri";

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
  const closeReview = React.useCallback(() => {
    if (!isAnalyzing && !isUploading) setIsOpen(false);
  }, [isAnalyzing, isUploading]);
  const dialogRef = useDialogFocus(isOpen, closeReview);

  return (
    <>
      <DashboardToolCard
        icon={RiFileTextLine}
        title="Review resume"
        description="Check structure, content, and gaps against 45 evidence rules. Uses one credit."
        onClick={openReview}
      />

      {/* Tool Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
              <m.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={featureChrome.backdrop}
                  onClick={closeReview}
              />
              <m.div
                  ref={dialogRef}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="resume-review-title"
                  initial={{ scale: 0.98, opacity: 0, y: 8 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.98, opacity: 0, y: 8 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  className={`${featureChrome.dialog} max-w-2xl`}
              >
                  <div className={featureChrome.dialogHeader}>
                      <div className="flex min-w-0 flex-1 items-start gap-2.5 sm:items-center">
                          <FeatureIcon feature="Resumes" size={18} className="text-muted-foreground" />
                          <div className="min-w-0">
                              <h2 id="resume-review-title" className="text-base font-semibold tracking-tight text-foreground">Review resume</h2>
                              <p className={featureChrome.helper}>Structure, content, and evidence gaps. Uses one credit.</p>
                          </div>
                      </div>
                      <button
                          type="button"
                          onClick={closeReview}
                          aria-label="Close resume review"
                          className={featureChrome.iconButton}
                          disabled={isProcessing}
                      >
                          <AppIcon icon={RiCloseLine} size={18} />
                      </button>
                  </div>

                  <div className={`${featureChrome.dialogBody} space-y-5`}>
                      <div className="space-y-1.5">
                          <label htmlFor="review-saved-resume" className={featureChrome.label}>Existing resume</label>
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
                              className={featureChrome.select}
                          >
                              <option value="">{isLoadingResumes ? "Loading your resumes..." : "Choose a saved resume"}</option>
                              {savedResumes.map(resume => <option key={resume.id} value={resume.id}>{resume.title || "Untitled resume"}</option>)}
                          </select>
                          {resumeListError ? (
                              <p role="alert" className="text-sm text-red-700">
                                  {resumeListError} <button type="button" onClick={() => {
                                      setIsLoadingResumes(true);
                                      setResumeListError(null);
                                      setResumeListAttempt(attempt => attempt + 1);
                                  }} className="underline">Retry</button>
                              </p>
                          ) : !isLoadingResumes && savedResumes.length === 0 ? (
                              <p className={featureChrome.helper}>No saved resumes yet. Paste or upload one below.</p>
                          ) : (
                              <p className={featureChrome.helper}>Review the saved version without uploading it again.</p>
                          )}
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                              <h4 className={featureChrome.label}>Resume content</h4>
                              <p className={`mt-0.5 ${featureChrome.helper}`}>Paste text or upload a new document</p>
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
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  disabled={isProcessing}
                                  className={featureChrome.secondaryButton}
                              >
                                  {isUploading ? <AppIcon icon={RiLoader4Line} size={16} className="animate-spin" /> : <AppIcon icon={RiUploadCloud2Line} size={16} />}
                                  <span>Upload document</span>
                              </button>
                          </div>
                      </div>

                      {uploadedTitle && activeResumeId && !isProcessing && (
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-emerald-950">{uploadedTitle}</p>
                            <p className={`${featureChrome.helper} text-emerald-800`}>Structured draft saved. You can retry the audit without uploading again.</p>
                          </div>
                          <AppIcon icon={RiCheckboxCircleLine} size={18} className="text-emerald-700" />
                        </div>
                      )}

                      <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white">
                          <AnimatePresence>
                              {isProcessing && (
                                  <m.div
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-white/90 p-6"
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
                              className={`${featureChrome.textarea} min-h-[260px] border-0`}
                              disabled={isProcessing}
                          />

                          {error && (
                              <m.div
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="m-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
                              >
                                  <AppIcon icon={RiInformationLine} size={16} className="text-red-600" />
                                  <span>{error}</span>
                              </m.div>
                          )}
                      </div>
                  </div>

                  <div className={`${featureChrome.dialogFooter} sm:justify-end`}>
                      <button
                          type="button"
                          onClick={closeReview}
                          disabled={isProcessing}
                          className={featureChrome.ghostButton}
                      >
                          Cancel
                      </button>
                      <button
                          type="button"
                          onClick={handleManualAnalyze}
                          disabled={isProcessing || (!content.trim() && !activeResumeId)}
                          className={featureChrome.primaryButton}
                      >
                          {isAnalyzing ? "Processing..." : "Run analysis"}
                      </button>
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
