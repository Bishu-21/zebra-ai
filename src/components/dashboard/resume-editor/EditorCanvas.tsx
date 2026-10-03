"use client";

import { PreviewPane } from "@/components/compiler/PreviewPane";
import type { ResumeData,SectionId,TemplateType } from "@/components/compiler/types";
import { getResumeSourceText } from "@/lib/resume-content";
import { AnimatePresence,m } from "framer-motion";
import React from "react";
import {
RiCloseCircleLine,
RiFileCodeLine,
RiFileCopy2Line,
RiFormatClear,
RiRobot2Line
} from "react-icons/ri";
import { BasicsEditor } from "../BasicsEditor";
import { EducationEditor } from "../EducationEditor";
import { SkillsEditor } from "../SkillsEditor";
import { CertsEditor } from "../resume-editor/CertsEditor";
import { ExperienceEditor } from "../resume-editor/ExperienceEditor";
import { ProjectsEditor } from "../resume-editor/ProjectsEditor";

const MemoizedPreviewPane = React.memo(PreviewPane);

interface Props {
    showAiPanel: boolean;
    isZenMode: boolean;
    isNarrowLayout: boolean;
    sections: { id: SectionId; label: string; icon: import("react-icons").IconType; }[];
    setActiveSection: React.Dispatch<React.SetStateAction<SectionId>>;
    activeSection: SectionId;
    setShowAiPanel: React.Dispatch<React.SetStateAction<boolean>>;
    editorTab: "editor" | "preview";
    editorWidth: number;
    viewMode: "source" | "sheet";
    isFlatImport: boolean;
    resume: ResumeData;
    handleSourceChange: (value: string) => void;
    showToast: (message: string, type?: "error" | "success" | "info") => void;
    settings: import("@/context/SettingsContext").Settings;
    jsonError: string | null;
    updateBasics: (field: string, value: string) => void;
    updateEducation: (id: number, field: string, value: string | string[]) => void;
    addEducation: () => void;
    removeItem: (section: "experience" | "education" | "projects" | "skills" | "certifications", id: number) => void;
    updateSkill: (id: number, field: string, value: string) => void;
    addSkill: () => void;
    updateProject: (id: number, field: string, value: string | string[]) => void;
    addProject: () => void;
    getAiSuggestions: (section: string, currentText: string, itemContext?: { id: number; idx: number; }) => Promise<void>;
    updateExperience: (id: number, field: string, value: string | string[]) => void;
    addExperience: () => void;
    updateCert: (id: number, field: string, value: string) => void;
    addCert: () => void;
    startResizing: () => void;
    isResizing: boolean;
    debouncedContent: import("@/components/compiler/types").ResumeContent;
    jumpToSource: (path: string) => void;
    selectedTemplate: TemplateType;
}

export function EditorCanvas({
    showAiPanel,
    isZenMode,
    isNarrowLayout,
    sections,
    setActiveSection,
    activeSection,
    setShowAiPanel,
    editorTab,
    editorWidth,
    viewMode,
    isFlatImport,
    resume,
    handleSourceChange,
    showToast,
    settings,
    jsonError,
    updateBasics,
    updateEducation,
    addEducation,
    removeItem,
    updateSkill,
    addSkill,
    updateProject,
    addProject,
    getAiSuggestions,
    updateExperience,
    addExperience,
    updateCert,
    addCert,
    startResizing,
    isResizing,
    debouncedContent,
    jumpToSource,
    selectedTemplate,
}: Props) {
    return (
<div className={`flex-grow flex overflow-hidden bg-[#FBFBFB] transition-[padding] duration-300 ${showAiPanel ? "lg:pr-[420px]" : ""}`}>

                {/* COL 1: Section Nav (48px) */}
                <AnimatePresence>
                    {!isZenMode && !isNarrowLayout && (
                        <m.aside
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 48, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="bg-background border-r border-border-subtle flex flex-col items-center py-3 gap-1 shrink-0"
                        >
                            {sections.map((s) => (
                                <button key={s.id} onClick={() => setActiveSection(s.id)} title={s.label}
                                    className={`w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center transition-all relative ${activeSection === s.id ? "bg-foreground text-white" : "text-muted-foreground/60 hover:bg-muted hover:text-foreground"}`}>
                                    <s.icon size={16} />
                                </button>
                            ))}
                            <div className="flex-grow" />
                            <button onClick={() => setShowAiPanel(!showAiPanel)} title="AI Copilot"
                                className={`w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center transition-all ${showAiPanel ? "bg-primary/10 text-primary" : "text-muted-foreground/60 hover:bg-muted"}`}>
                                <RiRobot2Line size={16} />
                            </button>
                        </m.aside>
                    )}
                </AnimatePresence>

                {/* COL 2: Editor Pane (Dynamic Width) */}
                {(!isNarrowLayout || editorTab === "editor") && (
                    <div
                        style={{ width: isNarrowLayout ? '100%' : (isZenMode ? '100%' : `${editorWidth}%`) }}
                        className={`flex flex-col overflow-hidden transition-[padding,max-width] duration-500 bg-background ${isZenMode && !isNarrowLayout ? "max-w-3xl mx-auto border-x border-border-subtle" : "border-r border-border-subtle"}`}
                    >
                        <div className="h-8 bg-muted/30 border-b border-border-subtle flex items-center justify-between px-4 shrink-0">
                                            <span className="text-[10px] font-semibold text-muted-foreground tracking-wide uppercase">{viewMode === "source" ? (isFlatImport ? "Preserved Resume Source" : "JSON Source") : sections.find(s => s.id === activeSection)?.label}</span>
                            {isZenMode && !isNarrowLayout && (
                                <div className="flex items-center gap-3">
                                    {sections.map(s => (
                                        <button key={s.id} onClick={() => setActiveSection(s.id)}
                                            className={`text-[9px] font-bold uppercase tracking-widest transition-all ${activeSection === s.id ? "text-primary" : "text-muted-foreground/60 hover:text-foreground"}`}>
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {isNarrowLayout && viewMode !== "source" && (
                            <div className="flex items-center gap-2 overflow-x-auto px-4 py-2 bg-muted/30 border-b border-border-subtle shrink-0 custom-scrollbar" style={{ scrollbarWidth: 'none' }}>
                                {sections.map(s => (
                                    <button key={s.id} onClick={() => setActiveSection(s.id)}
                                        className={`px-3 py-1.5 rounded-[var(--radius-full)] text-[10px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${activeSection === s.id ? "bg-foreground text-white" : "bg-background border border-border-subtle text-muted-foreground"}`}>
                                        <s.icon size={12} />
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="flex-grow overflow-y-auto custom-scrollbar">
                        <div className={`${isZenMode ? 'p-12' : 'p-5'} h-full flex flex-col`}>
                            {viewMode === "source" ? (
                                <div className="flex-grow flex flex-col bg-[#0F0F0F] rounded-[var(--radius-lg)] border border-white/5 overflow-hidden shadow-2xl relative group">
                                    {/* CODE HEADER */}
                                    <div className="h-10 bg-white/5 border-b border-white/5 flex items-center justify-between px-4 shrink-0">
                                        <div className="flex items-center gap-2">
                                            <RiFileCodeLine size={14} className="text-primary" />
                                            <span className="text-[10px] font-bold text-white/40 tracking-widest uppercase">{isFlatImport ? "original-resume.txt" : "source.json"}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {!isFlatImport && <button
                                                onClick={() => {
                                                    try {
                                                        const formatted = JSON.stringify(JSON.parse(JSON.stringify(resume.content)), null, 2);
                                                        handleSourceChange(formatted);
                                                        showToast("JSON Formatted", "success");
                                                    } catch { showToast("Invalid JSON", "error"); }
                                                }}
                                                className="h-6 px-2 rounded hover:bg-white/10 text-[9px] font-bold text-white/40 hover:text-white transition-all flex items-center gap-1.5"
                                            >
                                                <RiFormatClear size={12} /> Format
                                            </button>}
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(
                                                        isFlatImport
                                                            ? getResumeSourceText(resume.content)
                                                            : JSON.stringify(resume.content, null, 2),
                                                    );
                                                    showToast("Copied to clipboard", "success");
                                                }}
                                                className="h-6 px-2 rounded hover:bg-white/10 text-[9px] font-bold text-white/40 hover:text-white transition-all flex items-center gap-1.5"
                                            >
                                                <RiFileCopy2Line size={12} /> Copy
                                            </button>
                                        </div>
                                    </div>

                                    {/* CODE BODY */}
                                    <div className="flex-grow flex relative overflow-hidden">
                                        {/* Gutter */}
                                        <div className="w-10 bg-white/[0.02] border-r border-white/5 flex flex-col items-center py-4 select-none shrink-0">
                                            {Array.from({ length: Math.max(20, ((isFlatImport ? getResumeSourceText(resume.content) : JSON.stringify(resume.content, null, 2)).match(/\n/g) || []).length + 2) }).map((_, i) => (
                                                <span key={i} className="text-[9px] font-mono text-white/20 leading-6 h-6">{i + 1}</span>
                                            ))}
                                        </div>
                                        <textarea
                                            value={isFlatImport ? getResumeSourceText(resume.content) : JSON.stringify(resume.content, null, 2)}
                                            onChange={(e) => {
                                                if (!isFlatImport) handleSourceChange(e.target.value);
                                            }}
                                            readOnly={isFlatImport}
                                            spellCheck={settings.spellcheck}
                                            wrap={settings.lineWrapping ? "soft" : "off"}
                                            style={{
                                                fontSize: settings.fontSize,
                                                whiteSpace: settings.lineWrapping ? "pre-wrap" : "pre",
                                                overflowX: settings.lineWrapping ? "hidden" : "auto"
                                            }}
                                            className={`flex-grow bg-transparent text-emerald-400 font-mono p-4 outline-none transition-all resize-none leading-6 custom-scrollbar ${jsonError ? "text-red-400" : ""}`}
                                        />
                                    </div>

                                    {/* ERROR STATUS */}
                                    <AnimatePresence>
                                        {jsonError && (
                                            <m.div
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                exit={{ y: 20, opacity: 0 }}
                                                className="absolute bottom-4 left-4 right-4 p-3 bg-red-500/10 border border-red-500/20 rounded-[var(--radius-md)] backdrop-blur-md flex items-center gap-3"
                                            >
                                                <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                                                    <RiCloseCircleLine size={14} className="text-red-400" />
                                                </div>
                                                <div className="flex-grow">
                                                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Parsing Error</p>
                                                    <p className="text-[11px] text-red-300/80 leading-tight">{jsonError}</p>
                                                </div>
                                            </m.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <AnimatePresence mode="wait">
                                    <m.div
                                        key={activeSection}
                                        initial={{ opacity: 0, x: -12 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 12 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                        className={`${settings.compactView ? 'space-y-3' : 'space-y-6'} pb-24`}
                                    >
                                        {activeSection === "basics" && <BasicsEditor content={resume.content} updateBasics={updateBasics} />}
                                        {activeSection === "education" && <EducationEditor content={resume.content} updateEducation={updateEducation} addEducation={addEducation} removeItem={removeItem} />}
                                        {activeSection === "skills" && <SkillsEditor content={resume.content} updateSkill={updateSkill} addSkill={addSkill} removeItem={removeItem} />}
                                        {activeSection === "projects" && <ProjectsEditor content={resume.content} updateProject={updateProject} addProject={addProject} removeItem={removeItem} getAiSuggestions={getAiSuggestions} />}
                                        {activeSection === "experience" && <ExperienceEditor content={resume.content} updateExperience={updateExperience} addExperience={addExperience} removeItem={removeItem} getAiSuggestions={getAiSuggestions} />}
                                        {activeSection === "certifications" && <CertsEditor content={resume.content} updateCert={updateCert} addCert={addCert} removeItem={removeItem} />}
                                    </m.div>
                                </AnimatePresence>
                            )}
                        </div>
                    </div>
                </div>
                )}

                {/* RESIZE DIVIDER */}
                {!isZenMode && !isNarrowLayout && (
                    <div
                        onMouseDown={startResizing}
                        className={`w-1.5 h-full cursor-col-resize hover:bg-primary/30 transition-colors z-50 flex items-center justify-center group relative -ml-0.75 ${isResizing ? 'bg-primary/50' : 'bg-transparent'}`}
                    >
                        <div className="w-[1px] h-8 bg-foreground/10 group-hover:bg-primary transition-colors" />
                    </div>
                )}

                {/* COL 3: Preview (Dynamic Width) */}
                <AnimatePresence>
                    {!isZenMode && (!isNarrowLayout || editorTab === "preview") && (
                        <m.div
                            initial={isNarrowLayout ? { opacity: 0 } : { width: 0, opacity: 0 }}
                            animate={{ width: isNarrowLayout ? '100%' : `${100 - editorWidth}%`, opacity: 1 }}
                            exit={isNarrowLayout ? { opacity: 0 } : { width: 0, opacity: 0 }}
                            className="bg-muted h-full overflow-hidden flex flex-col"
                        >
                            <MemoizedPreviewPane
                                content={debouncedContent}
                                onJumpToSourceAction={jumpToSource}
                                template={selectedTemplate}
                            />
                        </m.div>
                    )}
                </AnimatePresence>
            </div>
    );
}
