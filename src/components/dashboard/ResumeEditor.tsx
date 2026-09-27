"use client";
import { EditorCanvas } from "./resume-editor/EditorCanvas";
import { EditorToolbar } from "./resume-editor/EditorToolbar";
import { useEditorLayout } from "./resume-editor/useEditorLayout";

import { EditorAssistantPanel } from "./resume-editor/EditorAssistantPanel";

import { ShareModal } from "@/components/compiler/ShareModal";
import { parseResumeData } from "@/components/compiler/parseResume";
import type { ResumeData,SectionId,TemplateType } from "@/components/compiler/types";
import { useToast } from "@/components/ui/Toast";
import { useSettings } from "@/context/SettingsContext";
import { useDebounce } from "@/hooks/useDebounce";
import { getResumeSourceText,normalizeResumeContent } from "@/lib/resume-content";
import { AnimatePresence,m } from "framer-motion";
import { useRouter,useSearchParams } from "next/navigation";
import React,{ useCallback,useEffect,useState } from "react";
import {
RiAwardLine,
RiBallPenLine,
RiBriefcaseLine,
RiCheckboxCircleFill,
RiClipboardLine,
RiGraduationCapLine,
RiLoader4Line,
RiMagicLine,
RiRobot2Line,
RiStackLine,
RiToolsLine,
RiUser6Line
} from "react-icons/ri";

interface ResumeEditorProps {
    initialData?: { id: string; title: string; content: string; revision: number; };
    isStripeVersion?: boolean;
    versionTitle?: string | null;
}

export function ResumeEditor({ initialData, isStripeVersion }: ResumeEditorProps) {
    const [resume, setResume] = useState<ResumeData>(() => parseResumeData(initialData));
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>("modern");

    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem(`resume-template-${initialData?.id || "new"}`);
            if (saved === "modern" || saved === "professional" || saved === "minimal" || saved === "executive") {
                queueMicrotask(() => setSelectedTemplate(saved as TemplateType));
            }
        }
    }, [initialData?.id]);


    useEffect(() => {
        if (typeof window !== "undefined" && initialData?.id) {
            localStorage.setItem(`resume-template-${initialData.id}`, selectedTemplate);
        }
    }, [initialData?.id, selectedTemplate]);

    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved" | "error">("saved");
    const [activeSection, setActiveSection] = useState<SectionId>("basics");
    const [viewMode, setViewMode] = useState<"sheet" | "source">(() => {
        const parsed = parseResumeData(initialData);
        return parsed.content._ingestionMeta?.parseStatus === "legacy" ? "source" : "sheet";
    });
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState<{
        original: string;
        problem: string;
        after: string;
        rationale: string;
    }[]>([]);
    const [showAiPanel, setShowAiPanel] = useState(false);
    const [aiContext, setAiContext] = useState<{ section: string; currentText: string; itemContext?: { id: number; idx: number } } | null>(null);
    const [copying, setCopying] = useState<string | null>(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isReconstructing, setIsReconstructing] = useState(false);
    const [isZenMode, setIsZenMode] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [editorTab, setEditorTab] = useState<"editor" | "preview">("editor");
    const { editorWidth, isResizing, isNarrowLayout, startResizing } = useEditorLayout();

    // Chat State
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; content: string }[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatEndRef = React.useRef<HTMLDivElement>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast();
    const { settings } = useSettings();
    const lastSavedContentRef = React.useRef(JSON.stringify(resume.content));
    const autosaveAbortRef = React.useRef<AbortController | null>(null);
    const revisionRef = React.useRef(initialData?.revision ?? 0);

    useEffect(() => {
        lastSavedContentRef.current = JSON.stringify(resume.content);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resume.id]);

    useEffect(() => {
        const importToken = searchParams.get("import");
        if (importToken && resume.id === "new") {
            const fetchImport = async () => {
                try {
                    const res = await fetch(`/api/resumes/share?token=${importToken}`);
                    if (!res.ok) throw new Error("Failed to fetch shared resume");
                    const data = await res.json();
                    if (data.content) {
                        setResume(p => ({
                            ...p,
                            title: `${data.title} (Copy)`,
                            content: JSON.parse(data.content)
                        }));
                        showToast("Resume imported! Don't forget to save.", "success");
                    }
                } catch {
                    showToast("Could not import resume", "error");
                }
            };
            fetchImport();
        }
    }, [searchParams, resume.id, showToast]);

    const debouncedContent = useDebounce(resume.content, 300);

    const jumpToSource = useCallback((path: string) => {
        const field = document.querySelector(`[name="${path}"]`) as HTMLElement;
        if (field) {
            field.focus();
            field.scrollIntoView({ behavior: 'smooth', block: 'center' });
            field.style.boxShadow = '0 0 0 2px var(--primary)';
            setTimeout(() => { field.style.boxShadow = ''; }, 1200);
        }
        const section = path.split('.')[0] as SectionId;
        if (section) setActiveSection(section);
    }, []);

    const sections = [
        { id: "basics" as SectionId, label: "Basics", icon: RiUser6Line },
        { id: "education" as SectionId, label: "Education", icon: RiGraduationCapLine },
        { id: "skills" as SectionId, label: "Skills", icon: RiToolsLine },
        { id: "projects" as SectionId, label: "Projects", icon: RiStackLine },
        { id: "experience" as SectionId, label: "Experience", icon: RiBriefcaseLine },
        { id: "certifications" as SectionId, label: "Certs", icon: RiAwardLine },
    ];

    // ── Handlers ──────────────────────────────────────────────

    const getAiSuggestions = async (section: string, currentText: string, itemContext?: { id: number; idx: number }) => {
        setIsAiLoading(true); setShowAiPanel(true); setAiContext({ section, currentText, itemContext });
        try {
            const res = await fetch("/api/ai/copilot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ section, currentText, context: resume.content })
            });
            if (!res.ok) throw new Error("AI is currently unavailable");
            const data = await res.json();
            if (data.suggestions) setAiSuggestions(data.suggestions);
        } catch {
            showToast("AI connection failed", "error");
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!chatInput.trim() || isChatLoading) return;

        const userMsg = chatInput.trim();
        setChatInput("");
        setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsChatLoading(true);
        setShowAiPanel(true);

        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMsg,
                    history: chatMessages,
                    context: resume.content
                })
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
                throw new Error(
                    typeof data?.error === "string"
                        ? data.error
                        : "ZE-AI could not finish that response. Please retry.",
                );
            }
            if (typeof data?.response !== "string" || !data.response.trim()) {
                throw new Error("ZE-AI returned an empty response. Please retry.");
            }
            setChatMessages(prev => [...prev, { role: 'model', content: data.response }]);
        } catch (error) {
            setChatMessages(prev => {
                const lastMessage = prev[prev.length - 1];
                return lastMessage?.role === 'user' && lastMessage.content === userMsg
                    ? prev.slice(0, -1)
                    : prev;
            });
            setChatInput(userMsg);
            showToast(
                error instanceof Error ? error.message : "ZE-AI could not finish that response. Please retry.",
                "error",
            );
        } finally {
            setIsChatLoading(false);
        }
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    const handleSave = async () => {
        autosaveAbortRef.current?.abort();
        setIsSaving(true);
        setSaveStatus("saving");
        try {
            const isNew = resume.id === "new";
            const res = await fetch("/api/resumes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: isNew ? null : resume.id,
                    title: resume.title,
                    content: JSON.stringify(resume.content),
                    expectedRevision: isNew ? undefined : revisionRef.current,
                })
            });

            const contentType = res.headers.get("content-type");
            if (!res.ok || !contentType?.includes("application/json")) {
                const text = await res.text();
                console.error("Save failed response:", text);
                const message = res.status === 409
                    ? "A newer version exists. Refresh this page before saving."
                    : res.status === 404 ? "API route not found" : "Server returned an invalid response";
                throw new Error(message);
            }

            const data = await res.json();
            lastSavedContentRef.current = JSON.stringify(resume.content);
            revisionRef.current = data.revision ?? revisionRef.current;
            setSaveStatus("saved");
            if (isNew && data.id) {
                router.replace(`/dashboard/resumes/${data.id}`);
                setResume((p: ResumeData) => ({ ...p, id: data.id }));
                showToast("Resume created", "success");
            } else {
                showToast("Saved", "success");
            }
        } catch (error: unknown) {
            setSaveStatus("error");
            showToast(error instanceof Error ? error.message : "Save failed", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSourceChange = (value: string) => {
        try { setResume((p: ResumeData) => ({ ...p, content: normalizeResumeContent(JSON.parse(value)) })); setJsonError(null); }
        catch (e) { const err = e as Error; setJsonError(err.message); }
    };

    useEffect(() => {
        if (!settings.autoSave) return;
        if (resume.id === "new") return;

        const save = async (contentStr: string, controller: AbortController) => {
            setIsSaving(true);
            setSaveStatus("saving");
            try {
                const res = await fetch(`/api/resumes/${resume.id}/update`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content: contentStr, expectedRevision: revisionRef.current }),
                    signal: controller.signal,
                });
                const data = await res.json().catch(() => null);
                if (!res.ok) throw new Error(res.status === 409 ? "A newer version exists. Refresh before saving." : "Autosave failed");
                revisionRef.current = data?.data?.revision ?? revisionRef.current;
                lastSavedContentRef.current = contentStr;
                setSaveStatus("saved");
            } catch (err) {
                if (controller.signal.aborted) return;
                console.error("Autosave failed", err);
                setSaveStatus("error");
            } finally {
                if (!controller.signal.aborted) setIsSaving(false);
            }
        };

        const debouncedStr = JSON.stringify(debouncedContent);
        if (debouncedStr !== lastSavedContentRef.current) {
            setSaveStatus("unsaved");
            autosaveAbortRef.current?.abort();
            const controller = new AbortController();
            autosaveAbortRef.current = controller;
            void save(debouncedStr, controller);
        }
        return () => autosaveAbortRef.current?.abort();
    }, [debouncedContent, resume.id, settings.autoSave]);

    useEffect(() => {
        const warnIfUnsaved = (event: BeforeUnloadEvent) => {
            if (JSON.stringify(resume.content) === lastSavedContentRef.current) return;
            event.preventDefault();
        };
        window.addEventListener("beforeunload", warnIfUnsaved);
        return () => window.removeEventListener("beforeunload", warnIfUnsaved);
    }, [resume.content]);

    const handleDuplicate = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/resumes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: `${resume.title} (Copy)`,
                    content: JSON.stringify(resume.content)
                })
            });
            const data = await res.json();
            if (data.id) {
                router.push(`/dashboard/resumes/${data.id}`);
                showToast("Resume duplicated", "success");
            }
        } catch (error: unknown) {
            showToast(error instanceof Error ? error.message : "Duplicate failed", "error");
        } finally {
            setIsSaving(false); setIsMenuOpen(false);
        }
    };

    const handleExportPdf = async () => {
        setIsGeneratingPdf(true);
        try {
            const res = await fetch("/api/export/pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    resumeData: resume.content,
                    template: selectedTemplate,
                    title: resume.title,
                    fontFamily: settings.resumeFont
                })
            });

            if (!res.ok) {
                const data = await res.json();
                if (data.error === "PREMIUM_REQUIRED") {
                    showToast("Pro plan required", "error");
                    return;
                }
                throw new Error(data.error);
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${resume.title || "resume"}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            showToast("PDF Downloaded!", "success");
        } catch (err) {
            const error = err as Error;
            showToast(error.message || "Export failed", "error");
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const handleReconstruct = async () => {
        const rawText = getResumeSourceText(resume.content);
        if (!rawText || rawText.length < 100) {
            showToast("The preserved source is too short to structure", "error");
            return;
        }

        setIsReconstructing(true);
        try {
            const res = await fetch("/api/ai/parse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: rawText })
            });

            const response = await res.json();
            if (!res.ok) throw new Error(response.error || "Resume structuring failed");

            setResume(prev => ({
                ...prev,
                content: normalizeResumeContent(response),
            }));
            showToast("Sections mapped. Review them against the preserved source, then save.", "success");
        } catch (error: unknown) {
            showToast(error instanceof Error ? error.message : "AI Reconstruction failed", "error");
        } finally {
            setIsReconstructing(false);
        }
    };

    const isFlatImport =
        resume.content._ingestionMeta?.parseStatus === "legacy" &&
        getResumeSourceText(resume.content).length > 0 &&
        resume.content.experience.length === 0 &&
        resume.content.education.length === 0 &&
        resume.content.projects.length === 0;

    const needsReview = resume.content._ingestionMeta?.parseStatus === "needs_review";
    const ungroundedImportFields = resume.content._ingestionMeta?.sourceSpans?.filter((span) => !span.grounded).length ?? 0;

    const markImportReviewed = () => {
        setResume((previous) => ({
            ...previous,
            content: {
                ...previous.content,
                _ingestionMeta: previous.content._ingestionMeta
                    ? { ...previous.content._ingestionMeta, parseStatus: "reviewed" }
                    : undefined,
            },
        }));
        setSaveStatus("unsaved");
        showToast("Review marked complete. Save the resume to confirm.", "success");
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this resume?")) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/resumes/${resume.id}`, { method: "DELETE" });
            if (res.ok) {
                router.push("/dashboard");
                showToast("Resume deleted", "success");
            }
        } catch (error: unknown) {
            showToast(error instanceof Error ? error.message : "Delete failed", "error");
        } finally {
            setIsSaving(false); setIsMenuOpen(false);
        }
    };

    const copyToClipboard = async () => {
        setCopying('text');
        try {
            const { basics, experience, skills } = resume.content;
            let t = `${basics.name}\n${basics.phone} | ${basics.email} | ${basics.location}\n\n`;
            if (basics.summary) t += `SUMMARY\n${basics.summary}\n\n`;
            experience.forEach(exp => { t += `${exp.role} | ${exp.company} | ${exp.period}\n`; exp.highlights.filter(h => h.trim()).forEach(h => { t += `- ${h}\n`; }); t += '\n'; });
            if (skills.length) { t += 'SKILLS\n'; skills.forEach(s => { t += `${s.category}: ${s.items}\n`; }); }
            await navigator.clipboard.writeText(t);
            showToast("Copied", "success");
            setTimeout(() => setCopying(null), 1500);
        } catch { showToast("Copy failed", "error"); setCopying(null); }
    };

    const updateBasics = (field: string, value: string) => setResume((p: ResumeData) => ({ ...p, content: { ...p.content, basics: { ...p.content.basics, [field]: value } } }));

    const updateExperience = (id: number, field: string, value: string | string[]) => setResume((p: ResumeData) => ({ ...p, content: { ...p.content, experience: p.content.experience.map(i => i.id === id ? { ...i, [field]: value } : i) } }));
    const updateProject = (id: number, field: string, value: string | string[]) => setResume((p: ResumeData) => ({ ...p, content: { ...p.content, projects: (p.content.projects || []).map(i => i.id === id ? { ...i, [field]: value } : i) } }));
    const updateEducation = (id: number, field: string, value: string | string[]) => setResume((p: ResumeData) => ({ ...p, content: { ...p.content, education: p.content.education.map(i => i.id === id ? { ...i, [field]: value } : i) } }));
    const updateSkill = (id: number, field: string, value: string) => setResume((p: ResumeData) => ({ ...p, content: { ...p.content, skills: p.content.skills.map(i => i.id === id ? { ...i, [field]: value } : i) } }));
    const updateCert = (id: number, field: string, value: string) => setResume((p: ResumeData) => ({ ...p, content: { ...p.content, certifications: (p.content.certifications || []).map(i => i.id === id ? { ...i, [field]: value } : i) } }));

    const removeItem = (section: 'experience' | 'education' | 'projects' | 'skills' | 'certifications', id: number) => setResume((p: ResumeData) => ({ ...p, content: { ...p.content, [section]: (p.content[section] as { id: number }[]).filter(i => i.id !== id) } }));

    const addExperience = () => setResume((p: ResumeData) => ({ ...p, content: { ...p.content, experience: [...p.content.experience, { id: Date.now(), company: "", location: "", role: "", period: "", highlights: [""], techStack: "", link: "" }] } }));
    const addProject = () => setResume((p: ResumeData) => ({ ...p, content: { ...p.content, projects: [...(p.content.projects || []), { id: Date.now(), title: "", techStack: "", link: "", highlights: [""] }] } }));
    const addEducation = () => setResume((p: ResumeData) => ({ ...p, content: { ...p.content, education: [...p.content.education, { id: Date.now(), school: "", location: "", degree: "", gpa: "", period: "", highlights: [] }] } }));
    const addSkill = () => setResume((p: ResumeData) => ({ ...p, content: { ...p.content, skills: [...p.content.skills, { id: Date.now(), category: "", items: "" }] } }));
    const addCert = () => setResume((p: ResumeData) => ({ ...p, content: { ...p.content, certifications: [...(p.content.certifications || []), { id: Date.now(), category: "", items: "" }] } }));

    const applySuggestion = (text: string) => {
        if (!aiContext) return;
        const { section, itemContext } = aiContext;
        if (section === 'experience' && itemContext) {
            const exp = resume.content.experience.find(e => e.id === itemContext.id);
            if (exp) {
                const nh = [...exp.highlights];
                nh[itemContext.idx] = text;
                updateExperience(itemContext.id, 'highlights', nh);
            }
        } else if (section === 'projects' && itemContext) {
            const proj = (resume.content.projects || []).find(p => p.id === itemContext.id);
            if (proj) {
                const nh = [...(proj.highlights || [])];
                nh[itemContext.idx] = text;
                updateProject(itemContext.id, 'highlights', nh);
            }
        }
        setShowAiPanel(false);
        showToast("Impact applied!", "success");
    };

    // ── JSX ───────────────────────────────────────────────────

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-background font-sans text-foreground">
            {/* ── TOOLBAR (44px) ── */}
            <EditorToolbar
                showAiPanel={showAiPanel}
                router={router}
                isRenaming={isRenaming}
                setIsMenuOpen={setIsMenuOpen}
                isMenuOpen={isMenuOpen}
                resume={resume}
                setResume={setResume}
                setIsRenaming={setIsRenaming}
                handleSave={handleSave}
                setShowShareModal={setShowShareModal}
                handleExportPdf={handleExportPdf}
                copyToClipboard={copyToClipboard}
                handleDuplicate={handleDuplicate}
                handleDelete={handleDelete}
                isStripeVersion={isStripeVersion}
                setViewMode={setViewMode}
                viewMode={viewMode}
                copying={copying}
                setSelectedTemplate={setSelectedTemplate}
                selectedTemplate={selectedTemplate}
                isGeneratingPdf={isGeneratingPdf}
                setIsZenMode={setIsZenMode}
                isZenMode={isZenMode}
                settings={settings}
                isSaving={isSaving}
                saveStatus={saveStatus}
            />

            <AnimatePresence>
                {isFlatImport && !isReconstructing && (
                    <m.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-primary/5 border-b border-primary/10 px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-[var(--radius-md)] bg-primary/10 flex items-center justify-center text-primary">
                                <RiMagicLine size={18} />
                            </div>
                            <div>
                                <p className="text-xs font-black text-secondary">Legacy import preserved</p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">The original text is safe. Map it into editable sections before reviewing.</p>
                            </div>
                        </div>
                        <button
                            onClick={handleReconstruct}
                            className="px-4 py-1.5 bg-primary hover:bg-primary-dark text-white text-[10px] font-black rounded-[var(--radius-md)] transition-all shadow-lg shadow-primary/20 active:scale-95"
                        >
                            Auto-Structure
                        </button>
                    </m.div>
                )}

                {needsReview && !isReconstructing && (
                    <m.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-2.5 flex items-center gap-3"
                    >
                        <RiCheckboxCircleFill className="text-amber-700 shrink-0" size={17} />
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-black text-amber-950">AI structure ready for review</p>
                            <p className="text-[10px] font-semibold text-amber-800">
                                Compare every section with the preserved source. {ungroundedImportFields > 0
                                    ? `${ungroundedImportFields} extracted ${ungroundedImportFields === 1 ? "field has" : "fields have"} no exact source match.`
                                    : "All extracted fields have an exact source match."}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={markImportReviewed}
                            className="ml-auto shrink-0 rounded-lg bg-amber-900 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-amber-950"
                        >
                            Mark review complete
                        </button>
                    </m.div>
                )}

                {isReconstructing && (
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-primary px-6 py-3 flex items-center justify-center gap-3"
                    >
                        <RiLoader4Line className="animate-spin text-white" size={18} />
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Auto-Structuring document... analyzing content</span>
                    </m.div>
                )}
            </AnimatePresence>

            {/* ── MAIN 3-COLUMN LAYOUT ── */}
            <EditorCanvas
                showAiPanel={showAiPanel}
                isZenMode={isZenMode}
                isNarrowLayout={isNarrowLayout}
                sections={sections}
                setActiveSection={setActiveSection}
                activeSection={activeSection}
                setShowAiPanel={setShowAiPanel}
                editorTab={editorTab}
                editorWidth={editorWidth}
                viewMode={viewMode}
                isFlatImport={isFlatImport}
                resume={resume}
                handleSourceChange={handleSourceChange}
                showToast={showToast}
                settings={settings}
                jsonError={jsonError}
                updateBasics={updateBasics}
                updateEducation={updateEducation}
                addEducation={addEducation}
                removeItem={removeItem}
                updateSkill={updateSkill}
                addSkill={addSkill}
                updateProject={updateProject}
                addProject={addProject}
                getAiSuggestions={getAiSuggestions}
                updateExperience={updateExperience}
                addExperience={addExperience}
                updateCert={updateCert}
                addCert={addCert}
                startResizing={startResizing}
                isResizing={isResizing}
                debouncedContent={debouncedContent}
                jumpToSource={jumpToSource}
                selectedTemplate={selectedTemplate}
            />

            {/* ── AI PANEL ── */}
            <AnimatePresence>
                {showAiPanel && <EditorAssistantPanel setShowAiPanel={setShowAiPanel} aiSuggestions={aiSuggestions} isAiLoading={isAiLoading} setAiSuggestions={setAiSuggestions} applySuggestion={applySuggestion} chatMessages={chatMessages} isChatLoading={isChatLoading} chatEndRef={chatEndRef} handleSendMessage={handleSendMessage} chatInput={chatInput} setChatInput={setChatInput} />}
            </AnimatePresence>

            {/* ── STATUS BAR ── */}
            {!isNarrowLayout && (
                <footer className={`h-6 bg-primary flex items-center justify-between px-3 shrink-0 select-none transition-[padding] duration-300 ${showAiPanel ? "lg:pr-[432px]" : ""}`}>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-white/70" /><span className="text-[9px] font-semibold text-white/80">Ready</span></div>
                        <span className="text-[9px] font-semibold text-white/50">{saveStatus === "saving" ? "Saving..." : saveStatus === "error" ? "Save failed" : saveStatus === "unsaved" ? "Unsaved" : "Saved"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[9px] font-semibold text-white/50">A4</span>
                        <span className="text-[9px] font-semibold text-white/50">UTF-8</span>
                    </div>
                </footer>
            )}

            {/* ── MOBILE / TABLET TAB BAR (< 1024px) ── */}
            {isNarrowLayout && (
                <footer className="h-[52px] bg-background border-t border-border-subtle flex items-center justify-around px-2 shrink-0 select-none pb-safe z-[250] relative shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
                    <button onClick={() => { setEditorTab("editor"); setShowAiPanel(false); }} className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${(editorTab === 'editor' && !showAiPanel) ? 'text-primary' : 'text-muted-foreground'}`}>
                        <RiBallPenLine size={18} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Editor</span>
                    </button>
                    <button onClick={() => { setEditorTab("preview"); setShowAiPanel(false); }} className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${(editorTab === 'preview' && !showAiPanel) ? 'text-primary' : 'text-muted-foreground'}`}>
                        <RiClipboardLine size={18} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Preview</span>
                    </button>
                    <button onClick={() => { setShowAiPanel(true); }} className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${showAiPanel ? 'text-primary' : 'text-muted-foreground'}`}>
                        <RiRobot2Line size={18} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">ZE-AI</span>
                    </button>
                </footer>
            )}

            {/* ── SHARE MODAL ── */}
            <ShareModal
                isOpen={showShareModal}
                onCloseAction={() => setShowShareModal(false)}
                resumeId={resume.id}
                resumeTitle={resume.title}
            />
        </div>
    );
}
