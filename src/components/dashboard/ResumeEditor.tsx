"use client";

import React, { useState, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { m, AnimatePresence } from "framer-motion";
import { 
    RiArrowLeftLine, RiSave3Line, RiMagicLine, RiCodeSSlashLine,
    RiLoader4Line, RiCloseCircleLine, RiAddLine, RiRobot2Line,
    RiCloseLine, RiUser6Line, RiBriefcaseLine,
    RiGraduationCapLine, RiToolsLine, RiClipboardLine, RiFileDownloadLine,
    RiCheckboxCircleFill, RiStackLine, RiBallPenLine, RiDeleteBinLine,
    RiAwardLine, RiShareLine, RiMore2Line, RiMoreFill, RiArrowDownSLine,
    RiDeleteBin6Line, RiFileCopy2Line, RiEditLine,
    RiFocus2Line, RiFocus3Line, RiCommandLine, RiFormatClear,
    RiFileCodeLine, RiClipboardLine as RiClipboardIcon
} from "react-icons/ri";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { useEffect } from "react";
import { PreviewPane } from "@/components/compiler/PreviewPane";
import { FieldInput, FieldTextarea } from "@/components/compiler/FieldInput";
import { parseResumeData } from "@/components/compiler/parseResume";
import { ShareModal } from "@/components/compiler/ShareModal";
import { useSettings } from "@/context/SettingsContext";
import type { ResumeData, ResumeContent, Experience, Project, Education, SkillCategory, Achievement, SectionId, TemplateType } from "@/components/compiler/types";

interface ResumeEditorProps {
    initialData?: { id: string; title: string; content: string; };
}

export function ResumeEditor({ initialData }: ResumeEditorProps) {
    const [resume, setResume] = useState<ResumeData>(() => parseResumeData(initialData));
    const selectedTemplate = 'modern' as TemplateType;
    const [isSaving, setIsSaving] = useState(false);
    const [activeSection, setActiveSection] = useState<SectionId>("basics");
    const [viewMode, setViewMode] = useState<"sheet" | "source">("sheet");
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
    const [showAiPanel, setShowAiPanel] = useState(false);
    const [aiContext, setAiContext] = useState<{ section: string; currentText: string; itemContext?: { id: number; idx: number } } | null>(null);
    const [copying, setCopying] = useState<string | null>(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isReconstructing, setIsReconstructing] = useState(false);
    const [isZenMode, setIsZenMode] = useState(false);
    const [editorWidth, setEditorWidth] = useState(38); // Percentage
    const [isResizing, setIsResizing] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    
    // Chat State
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; content: string }[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatEndRef = React.useRef<HTMLDivElement>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast();
    const { settings } = useSettings();

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
                } catch (err) {
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
            field.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.4)';
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
        } catch (error: any) { 
            showToast(error.message || "AI connection failed", "error"); 
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
            if (!res.ok) throw new Error("Chat failed");
            const data = await res.json();
            setChatMessages(prev => [...prev, { role: 'model', content: data.response }]);
        } catch (err) {
            showToast("Chat system offline", "error");
        } finally {
            setIsChatLoading(false);
        }
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    const startResizing = useCallback(() => {
        setIsResizing(true);
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = useCallback((e: MouseEvent) => {
        if (isResizing) {
            const newWidth = (e.clientX / window.innerWidth) * 100;
            if (newWidth > 20 && newWidth < 80) {
                setEditorWidth(newWidth);
            }
        }
    }, [isResizing]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
        }
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [isResizing, resize, stopResizing]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const isNew = resume.id === "new";
            const res = await fetch("/api/resumes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    id: isNew ? null : resume.id,
                    title: resume.title, 
                    content: JSON.stringify(resume.content) 
                })
            });

            const contentType = res.headers.get("content-type");
            if (!res.ok || !contentType?.includes("application/json")) {
                const text = await res.text();
                console.error("Save failed response:", text);
                throw new Error(res.status === 404 ? "API route not found" : "Server returned an invalid response");
            }

            const data = await res.json();
            if (isNew && data.id) {
                router.replace(`/dashboard/resumes/${data.id}`);
                setResume((p: ResumeData) => ({ ...p, id: data.id }));
                showToast("Resume created", "success");
            } else { 
                showToast("Saved", "success"); 
            }
        } catch (error: any) { 
            showToast(error?.message || "Save failed", "error"); 
        } finally { 
            setIsSaving(false); 
        }
    };

    const handleSourceChange = (value: string) => {
        try { setResume((p: ResumeData) => ({ ...p, content: JSON.parse(value) })); setJsonError(null); }
        catch (e) { const err = e as Error; setJsonError(err.message); }
    };

    useEffect(() => {
        if (!settings.autoSave) return;
        if (resume.id === "new") return;
        
        const save = async () => {
            setIsSaving(true);
            try {
                const res = await fetch(`/api/resumes/${resume.id}/update`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content: JSON.stringify(debouncedContent) })
                });
                if (res.ok) {
                    // Success silently for autosave
                }
            } catch (err) {
                console.error("Autosave failed", err);
            } finally {
                setTimeout(() => setIsSaving(false), 800);
            }
        };

        if (JSON.stringify(debouncedContent) !== JSON.stringify(resume.content)) {
            save();
        }
    }, [debouncedContent, resume.id, settings.autoSave]);

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
        } catch (error: any) { 
            showToast(error?.message || "Duplicate failed", "error"); 
        } finally { 
            setIsSaving(false); setIsMenuOpen(false); 
        }
    };

    const handleReconstruct = async () => {
        const rawText = resume.content.basics.summary;
        if (!rawText || rawText.length < 100) {
            showToast("Not enough content to reconstruct", "error");
            return;
        }

        setIsReconstructing(true);
        try {
            const res = await fetch("/api/ai/parse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: rawText })
            });

            if (!res.ok) throw new Error("Neural mapping failed");

            const structuredData = await res.json();
            setResume(prev => ({
                ...prev,
                content: {
                    ...structuredData,
                    basics: {
                        ...structuredData.basics,
                        summary: "" // Explicitly remove summary per user strategy
                    }
                }
            }));
            showToast("Resume reconstructed successfully!", "success");
        } catch (error: any) {
            showToast(error?.message || "AI Reconstruction failed", "error");
        } finally {
            setIsReconstructing(false);
        }
    };

    const isFlatImport = 
        resume.content.basics.summary.length > 200 && 
        resume.content.experience.length === 0 && 
        resume.content.education.length === 0 &&
        resume.content.projects.length === 0;

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this resume?")) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/resumes/${resume.id}`, { method: "DELETE" });
            if (res.ok) {
                router.push("/dashboard");
                showToast("Resume deleted", "success");
            }
        } catch (error: any) { 
            showToast(error?.message || "Delete failed", "error"); 
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
            if (exp) { const nh = [...exp.highlights]; nh[itemContext.idx] = text; updateExperience(itemContext.id, 'highlights', nh); }
        }
        setShowAiPanel(false); showToast("Applied", "success");
    };

    // ── JSX ───────────────────────────────────────────────────

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white font-sans text-[#0A0A0A]">
            {/* ── TOOLBAR (44px) ── */}
            <header className="h-11 bg-white border-b border-black/6 flex items-center justify-between px-3 shrink-0 select-none relative z-[150]">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push('/dashboard')} className="w-7 h-7 rounded-md bg-[#F5F5F5] flex items-center justify-center text-[#737373] hover:bg-[#0A0A0A] hover:text-white transition-all">
                        <RiArrowLeftLine size={14} />
                    </button>
                    <div className="w-px h-5 bg-black/8" />
                    
                    {/* Clean Project Menu Trigger */}
                    <div className="relative">
                        {!isRenaming ? (
                            <button 
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-[#F5F5F5] transition-all group"
                            >
                                <span className="text-sm font-semibold text-[#0A0A0A] max-w-[200px] truncate">{resume.title}</span>
                                <RiArrowDownSLine size={14} className={`text-[#737373] transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
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
                                className="bg-[#F5F5F5] text-sm font-semibold text-[#0A0A0A] outline-none px-2 py-1 rounded-md border border-[#3B82F6] w-48 transition-all" 
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
                                        className="absolute top-full left-0 mt-1 w-56 bg-white/90 backdrop-blur-xl border border-black/8 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] overflow-hidden p-1.5"
                                    >
                                        <button onClick={() => { setIsMenuOpen(false); setShowShareModal(true); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#404040] hover:bg-[#F5F5F5] rounded-lg transition-all">
                                            <RiShareLine size={14} className="text-[#3B82F6]" />
                                            Share and collaborate
                                        </button>
                                        <button onClick={() => { setIsMenuOpen(false); setIsRenaming(true); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#404040] hover:bg-[#F5F5F5] rounded-lg transition-all">
                                            <RiEditLine size={14} />
                                            Rename
                                        </button>
                                        <button onClick={handleDuplicate} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#404040] hover:bg-[#F5F5F5] rounded-lg transition-all">
                                            <RiFileCopy2Line size={14} />
                                            Duplicate
                                        </button>
                                        <div className="h-px bg-black/5 my-1" />
                                        <button onClick={handleDelete} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                            <RiDeleteBin6Line size={14} />
                                            Delete
                                        </button>
                                    </m.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="hidden sm:block">
                        <span className="px-2 py-0.5 bg-[#3B82F6]/10 text-[#3B82F6] rounded text-[10px] font-semibold tracking-wide">DRAFT</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-[#F5F5F5] p-0.5 rounded-md flex items-center gap-0.5 border border-black/5">
                        <button onClick={() => setViewMode("sheet")} className={`px-3 py-1 rounded text-[10px] font-semibold tracking-wide transition-all ${viewMode === "sheet" ? "bg-white text-[#0A0A0A] shadow-sm" : "text-[#737373] hover:text-[#0A0A0A]"}`}>
                            <span className="flex items-center gap-1"><RiBallPenLine size={11} /> Editor</span>
                        </button>
                        <button onClick={() => setViewMode("source")} className={`px-3 py-1 rounded text-[10px] font-semibold tracking-wide transition-all ${viewMode === "source" ? "bg-white text-[#0A0A0A] shadow-sm" : "text-[#737373] hover:text-[#0A0A0A]"}`}>
                            <span className="flex items-center gap-1"><RiCodeSSlashLine size={11} /> Source</span>
                        </button>
                    </div>
                    <div className="w-px h-5 bg-black/8" />
                    <button onClick={copyToClipboard} className="h-7 px-3 rounded-md text-[10px] font-semibold text-[#737373] hover:bg-[#F5F5F5] hover:text-[#0A0A0A] transition-all flex items-center gap-1.5">
                        {copying ? <RiCheckboxCircleFill className="text-emerald-500" size={12} /> : <RiClipboardLine size={12} />}
                        Copy
                    </button>
                    <button 
                        onClick={async () => {
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

                                // Handle direct blob download
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
                        }} 
                        disabled={isGeneratingPdf}
                        className="h-7 px-3 rounded-md text-[10px] font-semibold text-[#737373] hover:bg-[#F5F5F5] hover:text-[#0A0A0A] transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                        {isGeneratingPdf ? <RiLoader4Line size={12} className="animate-spin" /> : <RiFileDownloadLine size={12} />}
                        {isGeneratingPdf ? "Exporting..." : "Export"}
                    </button>
                    <button 
                        onClick={() => setIsZenMode(!isZenMode)}
                        className={`h-7 px-3 rounded-md text-[10px] font-semibold transition-all flex items-center gap-1.5 ${isZenMode ? "bg-[#3B82F6]/10 text-[#3B82F6]" : "text-[#737373] hover:bg-[#F5F5F5] hover:text-[#0A0A0A]"}`}
                    >
                        {isZenMode ? <RiFocus3Line size={12} /> : <RiFocus2Line size={12} />}
                        {isZenMode ? "Focus Active" : "Focus Mode"}
                    </button>
                    <div className="w-px h-5 bg-black/8" />
                    <div className="flex items-center gap-4">
                        {settings.autoSave && (
                            <div className={`flex items-center gap-1.5 transition-all duration-500 ${isSaving ? 'opacity-100' : 'opacity-40'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${isSaving ? 'bg-[#3B82F6] animate-pulse shadow-[0_0_8px_#3B82F6]' : 'bg-[#D4D4D4]'}`} />
                                <span className="text-[0.65rem] font-bold text-[#A3A3A3] uppercase tracking-widest">{isSaving ? 'Saving' : 'Synced'}</span>
                            </div>
                        )}
                        <button onClick={handleSave} disabled={isSaving} className="h-7 px-4 bg-[#3B82F6] hover:bg-[#2563EB] rounded-md text-[10px] font-bold tracking-wide text-white transition-all flex items-center gap-1.5 disabled:opacity-40 active:scale-95">
                            {isSaving && !settings.autoSave ? <RiLoader4Line size={12} className="animate-spin" /> : <RiSave3Line size={12} />}
                            {isSaving && !settings.autoSave ? "Saving..." : "Save"}
                        </button>
                    </div>
                </div>
            </header>

            <AnimatePresence>
                {isFlatImport && !isReconstructing && (
                    <m.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-[#3B82F6]/5 border-b border-[#3B82F6]/10 px-6 py-3 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center text-[#3B82F6]">
                                <RiMagicLine size={18} className="animate-pulse" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-[#171717]">Incomplete Structure Detected</p>
                                <p className="text-[10px] font-bold text-[#737373] uppercase tracking-widest">Use Auto-Structure to map this document into specific regions.</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleReconstruct}
                            className="px-4 py-1.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[10px] font-black rounded-lg transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                        >
                            Auto-Structure
                        </button>
                    </m.div>
                )}

                {isReconstructing && (
                    <m.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-[#3B82F6] px-6 py-3 flex items-center justify-center gap-3"
                    >
                        <RiLoader4Line className="animate-spin text-white" size={18} />
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] animate-pulse">Auto-Structuring document... analyzing content</span>
                    </m.div>
                )}
            </AnimatePresence>

            {/* ── MAIN 3-COLUMN LAYOUT ── */}
            <div className="flex-grow flex overflow-hidden bg-[#FBFBFB]">

                {/* COL 1: Section Nav (48px) */}
                <AnimatePresence>
                    {!isZenMode && (
                        <m.aside 
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 48, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="bg-white border-r border-black/6 flex flex-col items-center py-3 gap-1 shrink-0"
                        >
                            {sections.map((s) => (
                                <button key={s.id} onClick={() => setActiveSection(s.id)} title={s.label}
                                    className={`w-9 h-9 rounded-md flex items-center justify-center transition-all relative ${activeSection === s.id ? "bg-[#0A0A0A] text-white" : "text-[#A3A3A3] hover:bg-[#F5F5F5] hover:text-[#0A0A0A]"}`}>
                                    <s.icon size={16} />
                                </button>
                            ))}
                            <div className="flex-grow" />
                            <button onClick={() => setShowAiPanel(!showAiPanel)} title="AI Copilot"
                                className={`w-9 h-9 rounded-md flex items-center justify-center transition-all ${showAiPanel ? "bg-[#3B82F6]/10 text-[#3B82F6]" : "text-[#A3A3A3] hover:bg-[#F5F5F5]"}`}>
                                <RiRobot2Line size={16} />
                            </button>
                        </m.aside>
                    )}
                </AnimatePresence>

                {/* COL 2: Editor Pane (Dynamic Width) */}
                <div 
                    style={{ width: isZenMode ? '100%' : `${editorWidth}%` }}
                    className={`flex flex-col overflow-hidden transition-[padding,max-width] duration-500 bg-white ${isZenMode ? "max-w-3xl mx-auto border-x border-black/6" : "border-r border-black/6"}`}
                >
                    <div className="h-8 bg-[#FAFAFA] border-b border-black/5 flex items-center justify-between px-4 shrink-0">
                        <span className="text-[10px] font-semibold text-[#737373] tracking-wide uppercase">{viewMode === "source" ? "JSON Source" : sections.find(s => s.id === activeSection)?.label}</span>
                        {isZenMode && (
                            <div className="flex items-center gap-3">
                                {sections.map(s => (
                                    <button key={s.id} onClick={() => setActiveSection(s.id)}
                                        className={`text-[9px] font-bold uppercase tracking-widest transition-all ${activeSection === s.id ? "text-[#3B82F6]" : "text-[#A3A3A3] hover:text-[#0A0A0A]"}`}>
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex-grow overflow-y-auto custom-scrollbar">
                        <div className={`${isZenMode ? 'p-12' : 'p-5'} h-full flex flex-col`}>
                            {viewMode === "source" ? (
                                <div className="flex-grow flex flex-col bg-[#0F0F0F] rounded-xl border border-white/5 overflow-hidden shadow-2xl relative group">
                                    {/* CODE HEADER */}
                                    <div className="h-10 bg-white/5 border-b border-white/5 flex items-center justify-between px-4 shrink-0">
                                        <div className="flex items-center gap-2">
                                            <RiFileCodeLine size={14} className="text-[#3B82F6]" />
                                            <span className="text-[10px] font-bold text-white/40 tracking-widest uppercase">source.json</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button 
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
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(JSON.stringify(resume.content, null, 2));
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
                                            {Array.from({ length: Math.max(20, (JSON.stringify(resume.content, null, 2).match(/\n/g) || []).length + 2) }).map((_, i) => (
                                                <span key={i} className="text-[9px] font-mono text-white/20 leading-6 h-6">{i + 1}</span>
                                            ))}
                                        </div>
                                        <textarea 
                                            value={JSON.stringify(resume.content, null, 2)} 
                                            onChange={(e) => handleSourceChange(e.target.value)}
                                            spellCheck={false}
                                            className={`flex-grow bg-transparent text-emerald-400 font-mono text-[12px] p-4 outline-none transition-all resize-none leading-6 custom-scrollbar ${jsonError ? "text-red-400" : ""}`} 
                                        />
                                    </div>

                                    {/* ERROR STATUS */}
                                    <AnimatePresence>
                                        {jsonError && (
                                            <m.div 
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                exit={{ y: 20, opacity: 0 }}
                                                className="absolute bottom-4 left-4 right-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg backdrop-blur-md flex items-center gap-3"
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
                                <div className={`${settings.compactView ? 'space-y-3' : 'space-y-6'} pb-24`}>
                                    {activeSection === "basics" && <BasicsEditor content={resume.content} updateBasics={updateBasics} getAiSuggestions={getAiSuggestions} />}
                                    {activeSection === "education" && <EducationEditor content={resume.content} updateEducation={updateEducation} addEducation={addEducation} removeItem={removeItem} />}
                                    {activeSection === "skills" && <SkillsEditor content={resume.content} updateSkill={updateSkill} addSkill={addSkill} removeItem={removeItem} />}
                                    {activeSection === "projects" && <ProjectsEditor content={resume.content} updateProject={updateProject} addProject={addProject} removeItem={removeItem} getAiSuggestions={getAiSuggestions} />}
                                    {activeSection === "experience" && <ExperienceEditor content={resume.content} updateExperience={updateExperience} addExperience={addExperience} removeItem={removeItem} getAiSuggestions={getAiSuggestions} />}
                                    {activeSection === "certifications" && <CertsEditor content={resume.content} updateCert={updateCert} addCert={addCert} removeItem={removeItem} />}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RESIZE DIVIDER */}
                {!isZenMode && (
                    <div 
                        onMouseDown={startResizing}
                        className={`w-1.5 h-full cursor-col-resize hover:bg-[#3B82F6]/30 transition-colors z-50 flex items-center justify-center group relative -ml-0.75 ${isResizing ? 'bg-[#3B82F6]/50' : 'bg-transparent'}`}
                    >
                        <div className="w-[1px] h-8 bg-black/10 group-hover:bg-[#3B82F6] transition-colors" />
                    </div>
                )}

                {/* COL 3: Preview (Dynamic Width) */}
                <AnimatePresence>
                    {!isZenMode && (
                        <m.div 
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: `${100 - editorWidth}%`, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="bg-[#F5F5F5] h-full overflow-hidden flex flex-col"
                        >
                            <PreviewPane content={debouncedContent} onJumpToSourceAction={jumpToSource} />
                        </m.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── AI PANEL ── */}
            <AnimatePresence>
                {showAiPanel && (
                    <>
                        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAiPanel(false)} className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-[110]" />
                        <m.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed top-0 right-0 h-full w-[400px] bg-white border-l border-black/8 shadow-[-20px_0_50px_rgba(0,0,0,0.08)] z-[120] flex flex-col">
                            <div className="h-11 border-b border-black/6 flex items-center justify-between px-4 shrink-0 bg-white/80 backdrop-blur-md">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded bg-[#3B82F6]/10 flex items-center justify-center">
                                        <RiRobot2Line size={12} className="text-[#3B82F6]" />
                                    </div>
                                    <span className="text-xs font-black text-[#0A0A0A] tracking-tight uppercase">AI Assistant</span>
                                </div>
                                <button onClick={() => setShowAiPanel(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#737373] hover:bg-[#F5F5F5] transition-all">
                                    <RiCloseLine size={16} />
                                </button>
                            </div>

                            <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                {/* MAGIC SUGGESTIONS AREA */}
                                {aiSuggestions.length > 0 && (
                                    <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pb-6 border-b border-black/5">
                                        <div className="flex items-center gap-2 mb-4">
                                            <RiMagicLine size={12} className="text-[#3B82F6]" />
                                            <p className="text-[10px] font-black text-[#3B82F6] uppercase tracking-widest">AI Suggestions</p>
                                        </div>
                                        {isAiLoading ? (
                                            <div className="flex flex-col items-center justify-center py-8 gap-3"><RiLoader4Line size={24} className="text-[#3B82F6] animate-spin" /><p className="text-[10px] font-bold text-[#737373] uppercase tracking-widest">Processing...</p></div>
                                        ) : (
                                            aiSuggestions.map((s, idx) => (
                                                <m.div key={idx} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="p-3 bg-[#FBFBFB] border border-black/6 rounded-xl space-y-2.5 hover:border-[#3B82F6]/30 transition-all group shadow-sm">
                                                    <p className="text-[11px] text-[#262626] font-medium leading-relaxed">{s}</p>
                                                    <button onClick={() => applySuggestion(s)} className="w-full h-8 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-blue-500/10">Apply Content</button>
                                                </m.div>
                                            ))
                                        )}
                                    </m.div>
                                )}

                                {/* CHAT HISTORY */}
                                <div className="space-y-4">
                                    {chatMessages.length === 0 && aiSuggestions.length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-full py-20 opacity-20 gap-4">
                                            <RiRobot2Line size={48} />
                                            <p className="text-[11px] font-bold text-center max-w-[200px] uppercase tracking-widest leading-loose">
                                                Select a field for suggestions or ask for advice.
                                            </p>
                                        </div>
                                    )}
                                    
                                    {chatMessages.map((msg, idx) => (
                                        <m.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                                                msg.role === 'user' 
                                                ? 'bg-[#0A0A0A] text-white rounded-tr-none' 
                                                : 'bg-[#F5F5F5] text-[#262626] border border-black/5 rounded-tl-none font-medium'
                                            }`}>
                                                {msg.content}
                                            </div>
                                        </m.div>
                                    ))}
                                    {isChatLoading && (
                                        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                            <div className="bg-[#F5F5F5] border border-black/5 p-3 rounded-2xl rounded-tl-none">
                                                <div className="flex gap-1">
                                                    <m.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 rounded-full bg-[#3B82F6]" />
                                                    <m.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 rounded-full bg-[#3B82F6]" />
                                                    <m.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 rounded-full bg-[#3B82F6]" />
                                                </div>
                                            </div>
                                        </m.div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>
                            </div>

                            {/* CHAT INPUT AREA */}
                            <div className="p-4 border-t border-black/6 bg-white shrink-0">
                                <form onSubmit={handleSendMessage} className="relative group">
                                    <input 
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        placeholder="Ask ZE-AI anything..."
                                        disabled={isChatLoading}
                                        className="w-full h-11 bg-[#F5F5F5] border border-black/5 rounded-xl px-4 pr-12 text-xs font-medium focus:border-[#3B82F6] focus:bg-white transition-all outline-none placeholder:text-[#A3A3A3] disabled:opacity-50"
                                    />
                                    <button 
                                        type="submit"
                                        disabled={!chatInput.trim() || isChatLoading}
                                        className="absolute right-1.5 top-1.5 w-8 h-8 rounded-lg bg-[#0A0A0A] text-white flex items-center justify-center hover:bg-[#262626] transition-all disabled:opacity-0"
                                    >
                                        <RiCommandLine size={14} />
                                    </button>
                                </form>
                            </div>
                        </m.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── STATUS BAR ── */}
            <footer className="h-6 bg-[#3B82F6] flex items-center justify-between px-3 shrink-0 select-none">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-white/70" /><span className="text-[9px] font-semibold text-white/80">Ready</span></div>
                    <span className="text-[9px] font-semibold text-white/50">{isSaving ? "Saving..." : "Synced"}</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[9px] font-semibold text-white/50">A4</span>
                    <span className="text-[9px] font-semibold text-white/50">UTF-8</span>
                </div>
            </footer>

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

// ── SECTION EDITORS (inline for Phase 0, extract in Phase 2) ──

function BasicsEditor({ content, updateBasics, getAiSuggestions }: { content: ResumeContent; updateBasics: (f: string, v: string) => void; getAiSuggestions: (s: string, t: string) => void }) {
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <FieldInput name="basics.name" label="Full Name" value={content.basics.name} onChange={(v) => updateBasics("name", v)} placeholder="Alex Webb" />
                <FieldInput name="basics.location" label="Location" value={content.basics.location} onChange={(v) => updateBasics("location", v)} placeholder="Howrah, West Bengal" />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <FieldInput name="basics.email" label="Email" value={content.basics.email} onChange={(v) => updateBasics("email", v)} placeholder="alex@email.com" />
                <FieldInput name="basics.phone" label="Phone" value={content.basics.phone} onChange={(v) => updateBasics("phone", v)} placeholder="+91-9330199312" />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <FieldInput name="basics.linkedin" label="LinkedIn" value={content.basics.linkedin || ""} onChange={(v) => updateBasics("linkedin", v)} placeholder="linkedin.com/in/..." />
                <FieldInput name="basics.portfolio" label="Portfolio" value={content.basics.portfolio || ""} onChange={(v) => updateBasics("portfolio", v)} placeholder="yoursite.com" />
            </div>
        </div>
    );
}

function EducationEditor({ content, updateEducation, addEducation, removeItem }: { content: ResumeContent; updateEducation: (id: number, f: string, v: string | string[]) => void; addEducation: () => void; removeItem: (s: 'education', id: number) => void }) {
    const { settings } = useSettings();
    return (
        <div className="space-y-4">
            {content.education.map((edu: Education) => (
                <div key={edu.id} className="p-4 border border-black/8 rounded-lg space-y-3 relative group bg-[#FAFAFA] hover:border-black/12 transition-all">
                    <button onClick={() => removeItem('education', edu.id)} className="absolute top-2 right-2 w-6 h-6 rounded flex items-center justify-center text-black/15 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"><RiDeleteBinLine size={12} /></button>
                    <div className="grid grid-cols-2 gap-3">
                        <FieldInput label="Institution" value={edu.school} onChange={(v) => updateEducation(edu.id, "school", v)} placeholder="Brainware University" />
                        <FieldInput label="Location" value={edu.location || ""} onChange={(v) => updateEducation(edu.id, "location", v)} placeholder="Kolkata, India" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <FieldInput label="Degree" value={edu.degree} onChange={(v) => updateEducation(edu.id, "degree", v)} placeholder="B.Tech in CSE (AIML)" />
                        <FieldInput label="CGPA/GPA" value={edu.gpa || ""} onChange={(v) => updateEducation(edu.id, "gpa", v)} placeholder="CGPA: 9.21 / 10.0" />
                    </div>
                    <FieldInput label="Period" value={edu.period} onChange={(v) => updateEducation(edu.id, "period", v)} placeholder="Expected 2026" />
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-[#737373] tracking-wide uppercase">Highlights</label>
                        {(edu.highlights || []).map((h: string, idx: number) => (
                            <div key={idx} className="flex gap-2 items-start">
                                <span className="text-[#A3A3A3] text-xs mt-2 shrink-0">•</span>
                                <textarea 
                                    value={h} 
                                    wrap={settings.lineWrapping ? "soft" : "off"}
                                    style={{ 
                                        fontSize: settings.fontSize,
                                        whiteSpace: settings.lineWrapping ? "pre-wrap" : "pre",
                                        overflowX: settings.lineWrapping ? "hidden" : "auto"
                                    }}
                                    onChange={(e) => { const nh = [...(edu.highlights || [])]; nh[idx] = e.target.value; updateEducation(edu.id, "highlights", nh); }} 
                                    placeholder="Key achievement..." 
                                    className="flex-grow min-h-[36px] bg-[#F5F5F5] rounded-md p-2 text-[#0A0A0A] border border-[#E5E5E5] focus:border-[#3B82F6] outline-none resize-none placeholder:text-black/20 custom-scrollbar" />
                            </div>
                        ))}
                        <button onClick={() => updateEducation(edu.id, "highlights", [...(edu.highlights || []), ""])} className="text-[10px] font-semibold text-[#737373] hover:text-[#3B82F6] transition-colors flex items-center gap-1 ml-4"><RiAddLine size={10} /> Add</button>
                    </div>
                </div>
            ))}
            <AddButton label="Add Education" onClick={addEducation} />
        </div>
    );
}

function SkillsEditor({ content, updateSkill, addSkill, removeItem }: { content: ResumeContent; updateSkill: (id: number, f: string, v: string) => void; addSkill: () => void; removeItem: (s: 'skills', id: number) => void }) {
    return (
        <div className="space-y-4">
            <p className="text-[10px] text-[#737373]">Group your skills by category (e.g., Languages, Core Concepts, Web & Tools).</p>
            {content.skills.map((skill: SkillCategory) => (
                <div key={skill.id} className="p-4 border border-black/8 rounded-lg space-y-3 relative group bg-[#FAFAFA] hover:border-black/12 transition-all">
                    <button onClick={() => removeItem('skills', skill.id)} className="absolute top-2 right-2 w-6 h-6 rounded flex items-center justify-center text-black/15 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"><RiDeleteBinLine size={12} /></button>
                    <FieldInput label="Category" value={skill.category} onChange={(v) => updateSkill(skill.id, "category", v)} placeholder="Languages" />
                    <FieldTextarea label="Items (comma separated)" value={skill.items} onChange={(v) => updateSkill(skill.id, "items", v)} placeholder="Java, Python, C, SQL" rows={2} />
                </div>
            ))}
            <AddButton label="Add Skill Category" onClick={addSkill} />
        </div>
    );
}

function ProjectsEditor({ content, updateProject, addProject, removeItem, getAiSuggestions }: { content: ResumeContent; updateProject: (id: number, f: string, v: string | string[]) => void; addProject: () => void; removeItem: (s: 'projects', id: number) => void; getAiSuggestions: (s: string, t: string, c?: any) => void }) {
    return (
        <div className="space-y-4">
            {(content.projects || []).map((proj: Project) => (
                <div key={proj.id} className="p-4 border border-black/8 rounded-lg space-y-3 relative group bg-[#FAFAFA] hover:border-black/12 transition-all">
                    <button onClick={() => removeItem('projects', proj.id)} className="absolute top-2 right-2 w-6 h-6 rounded flex items-center justify-center text-black/15 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"><RiDeleteBinLine size={12} /></button>
                    <div className="grid grid-cols-2 gap-3">
                        <FieldInput label="Project" value={proj.title} onChange={(v) => updateProject(proj.id, "title", v)} placeholder="StoreIt" />
                        <FieldInput label="Link" value={proj.link || ""} onChange={(v) => updateProject(proj.id, "link", v)} placeholder="https://..." />
                    </div>
                    <FieldInput label="Tech Stack" value={proj.techStack} onChange={(v) => updateProject(proj.id, "techStack", v)} placeholder="Python, SQL, React" />
                    <BulletEditor 
                        highlights={proj.highlights || []} 
                        onUpdate={(nh) => updateProject(proj.id, "highlights", nh)} 
                        getAiSuggestions={(idx, text) => getAiSuggestions('projects', text, { id: proj.id, idx })}
                    />
                </div>
            ))}
            <AddButton label="Add Project" onClick={addProject} />
        </div>
    );
}

function ExperienceEditor({ content, updateExperience, addExperience, removeItem, getAiSuggestions }: { content: ResumeContent; updateExperience: (id: number, f: string, v: string | string[]) => void; addExperience: () => void; removeItem: (s: 'experience', id: number) => void; getAiSuggestions: (s: string, t: string, c?: any) => void }) {
    return (
        <div className="space-y-4">
            {content.experience.map((exp: Experience) => (
                <div key={exp.id} className="p-4 border border-black/8 rounded-lg space-y-3 relative group bg-[#FAFAFA] hover:border-black/12 transition-all">
                    <button onClick={() => removeItem('experience', exp.id)} className="absolute top-2 right-2 w-6 h-6 rounded flex items-center justify-center text-black/15 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"><RiDeleteBinLine size={12} /></button>
                    <div className="grid grid-cols-2 gap-3">
                        <FieldInput label="Company" value={exp.company} onChange={(v) => updateExperience(exp.id, "company", v)} placeholder="Perplexity" />
                        <FieldInput label="Location" value={exp.location || ""} onChange={(v) => updateExperience(exp.id, "location", v)} placeholder="Remote" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <FieldInput label="Role" value={exp.role} onChange={(v) => updateExperience(exp.id, "role", v)} placeholder="Campus Partner" />
                        <FieldInput label="Period" value={exp.period} onChange={(v) => updateExperience(exp.id, "period", v)} placeholder="Sep 2025 - Nov 2025" />
                    </div>
                    <BulletEditor 
                        highlights={exp.highlights} 
                        onUpdate={(nh) => updateExperience(exp.id, "highlights", nh)} 
                        getAiSuggestions={(idx, text) => getAiSuggestions('experience', text, { id: exp.id, idx })}
                    />
                </div>
            ))}
            <AddButton label="Add Experience" onClick={addExperience} />
        </div>
    );
}

function CertsEditor({ content, updateCert, addCert, removeItem }: { content: ResumeContent; updateCert: (id: number, f: string, v: string) => void; addCert: () => void; removeItem: (s: 'certifications', id: number) => void }) {
    return (
        <div className="space-y-4">
            <p className="text-[10px] text-[#737373]">Group by type (e.g., Certifications, Hackathons).</p>
            {(content.certifications || []).map((cert: Achievement) => (
                <div key={cert.id} className="p-4 border border-black/8 rounded-lg space-y-3 relative group bg-[#FAFAFA] hover:border-black/12 transition-all">
                    <button onClick={() => removeItem('certifications', cert.id)} className="absolute top-2 right-2 w-6 h-6 rounded flex items-center justify-center text-black/15 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"><RiDeleteBinLine size={12} /></button>
                    <FieldInput label="Category" value={cert.category} onChange={(v) => updateCert(cert.id, "category", v)} placeholder="Certifications" />
                    <FieldTextarea label="Items (semicolon separated)" value={cert.items} onChange={(v) => updateCert(cert.id, "items", v)} placeholder="IBM Data Science Professional Certificate; Oracle OCI Foundations" rows={3} />
                </div>
            ))}
            <AddButton label="Add Category" onClick={addCert} />
        </div>
    );
}

function BulletEditor({ highlights, onUpdate, getAiSuggestions }: { highlights: string[]; onUpdate: (nh: string[]) => void; getAiSuggestions: (idx: number, text: string) => void }) {
    const { settings } = useSettings();
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-[#737373] tracking-wide uppercase">Highlights</label>
            {highlights.map((h, idx) => (
                <div key={idx} className="flex gap-2 items-start group/bullet">
                    <span className="text-[#A3A3A3] text-xs mt-2 shrink-0">•</span>
                    <div className="flex-grow relative">
                        <textarea 
                            value={h} 
                            wrap={settings.lineWrapping ? "soft" : "off"}
                            spellCheck={settings.spellcheck}
                            style={{ 
                                fontSize: settings.fontSize,
                                whiteSpace: settings.lineWrapping ? "pre-wrap" : "pre",
                                overflowX: settings.lineWrapping ? "hidden" : "auto"
                            }} 
                            onChange={(e) => { const nh = [...highlights]; nh[idx] = e.target.value; onUpdate(nh); }} 
                            placeholder="Quantify your impact..." 
                            className={`w-full ${settings.compactView ? 'min-h-[28px]' : 'min-h-[36px]'} pr-8 bg-[#F5F5F5] rounded-md p-2 text-[#0A0A0A] border border-[#E5E5E5] focus:border-[#3B82F6] outline-none resize-none placeholder:text-black/20 custom-scrollbar`} 
                        />
                        <button 
                            onClick={() => getAiSuggestions(idx, h)}
                            className="absolute right-1.5 top-1.5 w-6 h-6 rounded flex items-center justify-center text-[#3B82F6] hover:bg-white shadow-sm opacity-0 group-hover/bullet:opacity-100 transition-all border border-black/5"
                        >
                            <RiMagicLine size={10} />
                        </button>
                    </div>
                </div>
            ))}
            <button onClick={() => onUpdate([...highlights, ""])} className="text-[10px] font-semibold text-[#737373] hover:text-[#3B82F6] transition-colors flex items-center gap-1 ml-4"><RiAddLine size={10} /> Add bullet</button>
        </div>
    );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <button onClick={onClick} className="w-full h-10 border border-dashed border-black/12 rounded-lg flex items-center justify-center gap-2 text-[#737373] text-[10px] font-semibold hover:border-[#3B82F6]/30 hover:text-[#3B82F6] transition-all">
            <RiAddLine size={12} /> {label}
        </button>
    );
}
