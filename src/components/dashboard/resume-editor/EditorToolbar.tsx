"use client";

import type { ResumeData,TemplateType } from "@/components/compiler/types";
import { AnimatePresence,m } from "framer-motion";
import { useRouter } from "next/navigation";
import React from "react";
import {
RiArrowDownSLine,
RiArrowLeftLine,
RiBallPenLine,
RiCheckboxCircleFill,
RiClipboardLine,
RiCodeSSlashLine,
RiDeleteBin6Line,
RiEditLine,
RiFileCopy2Line,
RiFileDownloadLine,
RiFocus2Line,RiFocus3Line,
RiLoader4Line,
RiMagicLine,
RiSave3Line,
RiShareLine
} from "react-icons/ri";

interface Props {
    showAiPanel: boolean;
    router: ReturnType<typeof useRouter>;
    isRenaming: boolean;
    setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isMenuOpen: boolean;
    resume: ResumeData;
    setResume: React.Dispatch<React.SetStateAction<ResumeData>>;
    setIsRenaming: React.Dispatch<React.SetStateAction<boolean>>;
    handleSave: () => Promise<void>;
    setShowShareModal: React.Dispatch<React.SetStateAction<boolean>>;
    handleExportPdf: () => Promise<void>;
    copyToClipboard: () => Promise<void>;
    handleDuplicate: () => Promise<void>;
    handleDelete: () => Promise<void>;
    isStripeVersion: boolean | undefined;
    setViewMode: React.Dispatch<React.SetStateAction<"source" | "sheet">>;
    viewMode: "source" | "sheet";
    copying: string | null;
    setSelectedTemplate: React.Dispatch<React.SetStateAction<TemplateType>>;
    selectedTemplate: TemplateType;
    isGeneratingPdf: boolean;
    setIsZenMode: React.Dispatch<React.SetStateAction<boolean>>;
    isZenMode: boolean;
    settings: import("@/context/SettingsContext").Settings;
    isSaving: boolean;
    saveStatus: "saved" | "saving" | "unsaved" | "error";
}

export function EditorToolbar({
    showAiPanel,
    router,
    isRenaming,
    setIsMenuOpen,
    isMenuOpen,
    resume,
    setResume,
    setIsRenaming,
    handleSave,
    setShowShareModal,
    handleExportPdf,
    copyToClipboard,
    handleDuplicate,
    handleDelete,
    isStripeVersion,
    setViewMode,
    viewMode,
    copying,
    setSelectedTemplate,
    selectedTemplate,
    isGeneratingPdf,
    setIsZenMode,
    isZenMode,
    settings,
    isSaving,
    saveStatus,
}: Props) {
    return (
<header className={`min-h-14 bg-background border-b border-border-subtle flex flex-wrap items-center justify-between gap-2 px-3 py-2 shrink-0 select-none relative z-[150] transition-[padding] duration-300 ${showAiPanel ? "lg:pr-[432px]" : ""}`}>
                <div className="flex min-w-0 max-w-full basis-full items-center gap-2 lg:basis-auto lg:min-w-[20rem] lg:flex-1">
                    <button onClick={() => router.push('/dashboard')} aria-label="Back to dashboard" className="w-11 h-11 shrink-0 rounded-[var(--radius-sm)] bg-muted flex items-center justify-center text-muted-foreground hover:bg-foreground hover:text-white transition-all">
                        <RiArrowLeftLine size={14} />
                    </button>
                    <div className="w-px h-5 bg-black/8" />

                    {/* Clean Project Menu Trigger */}
                    <div className="relative min-w-0">
                        {!isRenaming ? (
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="flex min-h-11 max-w-full items-center gap-2 px-2 py-1 rounded-[var(--radius-sm)] hover:bg-muted transition-all group"
                            >
                                <span className="text-sm font-semibold text-foreground max-w-[120px] sm:max-w-[200px] truncate">{resume.title}</span>
                                <RiArrowDownSLine size={14} className={`shrink-0 text-muted-foreground transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
                            </button>
                        ) : (
                            <input
                                id="resume-title-input"
                                type="text"
                                autoFocus
                                value={resume.title}
                                onChange={(e) => setResume({...resume, title: e.target.value})}
                                onBlur={() => { setIsRenaming(false); handleSave(); }}
                                onKeyDown={(e) => { if (e.key === 'Enter') { setIsRenaming(false); handleSave(); } }}
                                className="bg-muted text-sm font-semibold text-foreground outline-none px-2 py-1 rounded-[var(--radius-sm)] border border-primary min-h-11 max-w-full w-32 sm:w-48 transition-all"
                            />
                        )}

                        <AnimatePresence>
                            {isMenuOpen && (
                                <>
                                    <m.div
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="fixed inset-0 z-[-1]"
                                    />
                                    <m.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.15, ease: "easeOut" }}
                                        className="absolute top-full left-0 mt-1 w-56 bg-background/90 backdrop-blur-xl border border-border-subtle rounded-[var(--radius-lg)] shadow-[0_10px_40px_rgba(0,0,0,0.12)] overflow-hidden p-1.5"
                                    >
                                        <button onClick={() => { setIsMenuOpen(false); setShowShareModal(true); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-secondary hover:bg-muted rounded-[var(--radius-md)] transition-all">
                                            <RiShareLine size={14} className="text-primary" />
                                            Share and collaborate
                                        </button>
                                        <button onClick={() => { setIsMenuOpen(false); handleExportPdf(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-secondary hover:bg-muted rounded-[var(--radius-md)] transition-all">
                                            <RiFileDownloadLine size={14} />
                                            Export PDF
                                        </button>
                                        <button onClick={() => { setIsMenuOpen(false); copyToClipboard(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-secondary hover:bg-muted rounded-[var(--radius-md)] transition-all">
                                            <RiClipboardLine size={14} />
                                            Copy text
                                        </button>
                                        <button onClick={() => { setIsMenuOpen(false); setIsRenaming(true); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-secondary hover:bg-muted rounded-[var(--radius-md)] transition-all">
                                            <RiEditLine size={14} />
                                            Rename
                                        </button>
                                        <button onClick={handleDuplicate} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-secondary hover:bg-muted rounded-[var(--radius-md)] transition-all">
                                            <RiFileCopy2Line size={14} />
                                            Duplicate
                                        </button>
                                        <div className="h-px bg-border-subtle my-1" />
                                        <button onClick={handleDelete} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 rounded-[var(--radius-md)] transition-all">
                                            <RiDeleteBin6Line size={14} />
                                            Delete
                                        </button>
                                    </m.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="hidden sm:flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-black/5 text-black rounded text-[10px] font-semibold tracking-wide border border-black/10">DRAFT</span>
                        {isStripeVersion && (
                            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-semibold tracking-wide flex items-center gap-1 border border-primary/20">
                                <RiMagicLine size={10} />
                                TAILORED VERSION
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex w-full max-w-full flex-wrap items-center justify-end gap-2 lg:w-auto">
                    <div className="hidden sm:flex bg-muted p-0.5 rounded-[var(--radius-md)] items-center gap-0.5 border border-border-subtle">
                        <button onClick={() => setViewMode("sheet")} className={`min-h-11 px-3 py-1 rounded-[var(--radius-sm)] text-[10px] font-semibold tracking-wide transition-all ${viewMode === "sheet" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                            <span className="flex items-center gap-1"><RiBallPenLine size={11} /> Editor</span>
                        </button>
                        <button onClick={() => setViewMode("source")} className={`min-h-11 px-3 py-1 rounded-[var(--radius-sm)] text-[10px] font-semibold tracking-wide transition-all ${viewMode === "source" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                            <span className="flex items-center gap-1"><RiCodeSSlashLine size={11} /> Source</span>
                        </button>
                    </div>
                    <div className="hidden sm:block w-px h-5 bg-black/8" />
                    <button onClick={copyToClipboard} className="h-11 min-w-11 justify-center px-2 sm:px-3 rounded-[var(--radius-md)] text-[10px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all flex items-center gap-1.5" title="Copy">
                        {copying ? <RiCheckboxCircleFill className="text-emerald-500" size={12} /> : <RiClipboardLine size={12} />}
                        <span className="hidden sm:block">Copy</span>
                    </button>

                    <div className="hidden lg:flex bg-muted p-0.5 rounded-[var(--radius-md)] items-center gap-0.5 border border-border-subtle">
                        {(['modern', 'professional', 'minimal'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => {
                                    setSelectedTemplate(t);
                                    localStorage.setItem(`resume-template-${resume.id}`, t);
                                }}
                                className={`min-h-11 px-2 py-1 rounded-[var(--radius-sm)] text-[9px] font-bold uppercase tracking-wider transition-all ${selectedTemplate === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleExportPdf}
                        disabled={isGeneratingPdf}
                        title="Export PDF"
                        className="flex h-11 px-2 sm:px-3 rounded-[var(--radius-md)] text-[10px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all items-center gap-1.5 disabled:opacity-50"
                    >
                        {isGeneratingPdf ? <RiLoader4Line size={12} className="animate-spin" /> : <RiFileDownloadLine size={12} />}
                        <span>{isGeneratingPdf ? "Exporting..." : "Export PDF"}</span>
                    </button>
                    <button
                        onClick={() => setIsZenMode(!isZenMode)}
                        title="Focus Mode"
                        className={`hidden lg:flex h-11 px-3 rounded-[var(--radius-md)] text-[10px] font-semibold transition-all items-center gap-1.5 ${isZenMode ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                    >
                        {isZenMode ? <RiFocus3Line size={12} /> : <RiFocus2Line size={12} />}
                        {isZenMode ? "Focus Active" : "Focus Mode"}
                    </button>
                    <div className="hidden sm:block w-px h-5 bg-black/8" />
                    <div className="flex items-center gap-1 sm:gap-4">
                        {settings.autoSave && (
                            <div className={`hidden sm:flex items-center gap-1.5 transition-all duration-500 ${isSaving ? 'opacity-100' : 'opacity-40'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${isSaving ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                                <span className="text-[0.65rem] font-bold text-muted-foreground/60 uppercase tracking-widest">{saveStatus === "saving" ? "Saving" : saveStatus === "error" ? "Save failed" : saveStatus === "unsaved" ? "Unsaved" : "Saved"}</span>
                            </div>
                        )}
                        <button onClick={handleSave} disabled={isSaving} aria-label="Save resume" title="Save resume" className="h-11 shrink-0 px-2 sm:px-4 bg-primary hover:bg-primary-dark rounded-[var(--radius-md)] text-[10px] font-bold tracking-wide text-white transition-all flex items-center gap-1.5 disabled:opacity-40 active:scale-95">
                            {isSaving && !settings.autoSave ? <RiLoader4Line size={12} className="animate-spin" /> : <RiSave3Line size={12} />}
                            <span>{isSaving && !settings.autoSave ? "Saving..." : "Save"}</span>
                        </button>
                    </div>
                </div>
            </header>
    );
}
