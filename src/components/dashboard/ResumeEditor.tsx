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
    RiAwardLine, RiShareLine
} from "react-icons/ri";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { useEffect } from "react";
import { PreviewPane } from "@/components/compiler/PreviewPane";
import { FieldInput, FieldTextarea } from "@/components/compiler/FieldInput";
import { parseResumeData } from "@/components/compiler/parseResume";
import { ShareModal } from "@/components/compiler/ShareModal";
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
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast();

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
            const res = await fetch("/api/ai/copilot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ section, currentText, context: resume.content }) });
            const data = await res.json();
            if (data.suggestions) setAiSuggestions(data.suggestions);
        } catch { showToast("AI connection failed", "error"); }
        finally { setIsAiLoading(false); }
    };

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
        } catch (error) { 
            const err = error as Error;
            showToast(err.message || "Save failed", "error"); 
        } finally { 
            setIsSaving(false); 
        }
    };

    const handleSourceChange = (value: string) => {
        try { setResume((p: ResumeData) => ({ ...p, content: JSON.parse(value) })); setJsonError(null); }
        catch (e) { const err = e as Error; setJsonError(err.message); }
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
        if (section === 'Summary') updateBasics('summary', text);
        else if (section === 'experience' && itemContext) {
            const exp = resume.content.experience.find(e => e.id === itemContext.id);
            if (exp) { const nh = [...exp.highlights]; nh[itemContext.idx] = text; updateExperience(itemContext.id, 'highlights', nh); }
        }
        setShowAiPanel(false); showToast("Applied", "success");
    };

    // ── JSX ───────────────────────────────────────────────────

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white font-sans text-[#0A0A0A]">
            {/* ── TOOLBAR (44px) ── */}
            <header className="h-11 bg-white border-b border-black/6 flex items-center justify-between px-3 shrink-0 select-none">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push('/dashboard')} className="w-7 h-7 rounded-md bg-[#F5F5F5] flex items-center justify-center text-[#737373] hover:bg-[#0A0A0A] hover:text-white transition-all">
                        <RiArrowLeftLine size={14} />
                    </button>
                    <div className="w-px h-5 bg-black/8" />
                    <input type="text" value={resume.title} onChange={(e) => setResume({...resume, title: e.target.value})} className="bg-transparent text-sm font-semibold text-[#0A0A0A] outline-none w-48 border-b border-transparent focus:border-[#3B82F6] transition-colors" />
                    <span className="px-2 py-0.5 bg-[#3B82F6]/10 text-[#3B82F6] rounded text-[10px] font-semibold tracking-wide">DRAFT</span>
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
                                        title: resume.title 
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
                    <button onClick={() => setShowShareModal(true)} className="h-7 px-3 rounded-md text-[10px] font-semibold text-[#737373] hover:bg-[#F5F5F5] hover:text-[#0A0A0A] transition-all flex items-center gap-1.5">
                        <RiShareLine size={12} /> Share
                    </button>
                    <div className="w-px h-5 bg-black/8" />
                    <button onClick={handleSave} disabled={isSaving} className="h-7 px-4 bg-[#3B82F6] hover:bg-[#2563EB] rounded-md text-[10px] font-bold tracking-wide text-white transition-all flex items-center gap-1.5 disabled:opacity-40 active:scale-95">
                        {isSaving ? <RiLoader4Line size={12} className="animate-spin" /> : <RiSave3Line size={12} />}
                        {isSaving ? "Saving..." : "Save"}
                    </button>
                </div>
            </header>

            {/* ── MAIN 3-COLUMN LAYOUT ── */}
            <div className="flex-grow flex overflow-hidden">

                {/* COL 1: Section Nav (48px) */}
                <aside className="w-12 bg-white border-r border-black/6 flex flex-col items-center py-3 gap-1 shrink-0">
                    {sections.map((s) => (
                        <button key={s.id} onClick={() => setActiveSection(s.id)} title={s.label}
                            className={`w-9 h-9 rounded-md flex items-center justify-center transition-all relative ${activeSection === s.id ? "bg-[#0A0A0A] text-white" : "text-[#A3A3A3] hover:bg-[#F5F5F5] hover:text-[#0A0A0A]"}`}>
                            <s.icon size={16} />
                        </button>
                    ))}
                    <div className="flex-grow" />
                    <button onClick={() => setShowAiPanel(!showAiPanel)} title="AI Copilot"
                        className={`w-9 h-9 rounded-md flex items-center justify-center transition-all ${showAiPanel ? "bg-[#3B82F6]/10 text-[#3B82F6]" : "text-[#A3A3A3] hover:bg-[#F5F5F5] hover:text-[#3B82F6]"}`}>
                        <RiRobot2Line size={16} />
                    </button>
                </aside>

                {/* COL 2: Editor Pane (~38%) */}
                <div className="w-[38%] min-w-[300px] bg-white border-r border-black/6 flex flex-col overflow-hidden">
                    <div className="h-8 bg-[#FAFAFA] border-b border-black/5 flex items-center px-4 shrink-0">
                        <span className="text-[10px] font-semibold text-[#737373] tracking-wide uppercase">{viewMode === "source" ? "JSON Source" : sections.find(s => s.id === activeSection)?.label}</span>
                    </div>
                    <div className="flex-grow overflow-y-auto custom-scrollbar">
                        <div className="p-5 space-y-4 pb-20">
                            {viewMode === "source" ? (
                                <div>
                                    <textarea value={JSON.stringify(resume.content, null, 2)} onChange={(e) => handleSourceChange(e.target.value)}
                                        className={`w-full h-[calc(100vh-140px)] bg-[#1e1e1e] text-emerald-400 font-mono text-xs p-4 rounded-lg outline-none border transition-all resize-none ${jsonError ? "border-red-400" : "border-[#333] focus:border-[#3B82F6]"}`} spellCheck={false} />
                                    {jsonError && <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-[10px] font-semibold flex items-center gap-1.5"><RiCloseCircleLine size={12} />{jsonError}</div>}
                                </div>
                            ) : (
                                <>
                                    {activeSection === "basics" && <BasicsEditor content={resume.content} updateBasics={updateBasics} getAiSuggestions={getAiSuggestions} />}
                                    {activeSection === "education" && <EducationEditor content={resume.content} updateEducation={updateEducation} addEducation={addEducation} removeItem={removeItem} />}
                                    {activeSection === "skills" && <SkillsEditor content={resume.content} updateSkill={updateSkill} addSkill={addSkill} removeItem={removeItem} />}
                                    {activeSection === "projects" && <ProjectsEditor content={resume.content} updateProject={updateProject} addProject={addProject} removeItem={removeItem} />}
                                    {activeSection === "experience" && <ExperienceEditor content={resume.content} updateExperience={updateExperience} addExperience={addExperience} removeItem={removeItem} />}
                                    {activeSection === "certifications" && <CertsEditor content={resume.content} updateCert={updateCert} addCert={addCert} removeItem={removeItem} />}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* COL 3: Preview (~62%) */}
                <PreviewPane content={debouncedContent} onJumpToSourceAction={jumpToSource} />
            </div>

            {/* ── AI PANEL ── */}
            <AnimatePresence>
                {showAiPanel && (
                    <>
                        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAiPanel(false)} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[110]" />
                        <m.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-[360px] bg-white border-l border-black/8 shadow-[-10px_0_30px_rgba(0,0,0,0.06)] z-[120] flex flex-col">
                            <div className="h-11 border-b border-black/6 flex items-center justify-between px-4 shrink-0">
                                <div className="flex items-center gap-2"><RiRobot2Line size={14} className="text-[#3B82F6]" /><span className="text-xs font-semibold text-[#0A0A0A]">AI Copilot</span></div>
                                <button onClick={() => setShowAiPanel(false)} className="w-6 h-6 rounded flex items-center justify-center text-[#737373] hover:bg-[#F5F5F5] transition-all"><RiCloseLine size={14} /></button>
                            </div>
                            <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {isAiLoading ? (
                                    <div className="flex flex-col items-center justify-center h-48 gap-3"><RiLoader4Line size={28} className="text-black/10 animate-spin" /><p className="text-[10px] font-semibold text-[#737373]">Analyzing...</p></div>
                                ) : aiSuggestions.length > 0 ? (
                                    <>
                                        <div className="p-3 bg-[#3B82F6]/5 border border-[#3B82F6]/15 rounded-lg"><p className="text-[10px] font-semibold text-[#3B82F6]">Suggestions based on ATS patterns.</p></div>
                                        {aiSuggestions.map((s, idx) => (
                                            <m.div key={idx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }} className="p-3 border border-black/8 rounded-lg space-y-2 hover:border-[#3B82F6]/30 transition-all group">
                                                <p className="text-xs text-[#333] leading-relaxed">{s}</p>
                                                <button onClick={() => applySuggestion(s)} className="w-full h-7 bg-[#3B82F6] text-white rounded text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-all hover:bg-[#2563EB]">Apply</button>
                                            </m.div>
                                        ))}
                                        <button 
                                            onClick={() => aiContext && getAiSuggestions(aiContext.section, aiContext.currentText, aiContext.itemContext)} 
                                            className="w-full h-8 border border-dashed border-black/15 rounded-lg flex items-center justify-center gap-1.5 text-[#737373] text-[10px] font-semibold hover:text-[#0A0A0A] hover:border-black/30 transition-all"
                                        >
                                            <RiMagicLine size={10} /> Regenerate
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-48 gap-3 opacity-30"><RiRobot2Line size={36} /><p className="text-[10px] font-semibold text-center">Hover a field and click ✨ to get suggestions.</p></div>
                                )}
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
            <div className="relative group">
                <FieldTextarea name="basics.summary" label="Summary" value={content.basics.summary} onChange={(v) => updateBasics("summary", v)} placeholder="Brief professional summary..." rows={4} />
                <button onClick={() => getAiSuggestions("Summary", content.basics.summary)} className="absolute bottom-2 right-2 p-1.5 bg-[#3B82F6]/10 text-[#3B82F6] rounded opacity-0 group-hover:opacity-100 transition-all hover:bg-[#3B82F6]/20"><RiMagicLine size={14} /></button>
            </div>
        </div>
    );
}

function EducationEditor({ content, updateEducation, addEducation, removeItem }: { content: ResumeContent; updateEducation: (id: number, f: string, v: string | string[]) => void; addEducation: () => void; removeItem: (s: 'education', id: number) => void }) {
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
                                <textarea value={h} onChange={(e) => { const nh = [...(edu.highlights || [])]; nh[idx] = e.target.value; updateEducation(edu.id, "highlights", nh); }} placeholder="Key achievement..." className="flex-grow min-h-[36px] bg-[#F5F5F5] rounded-md p-2 text-xs text-[#0A0A0A] border border-[#E5E5E5] focus:border-[#3B82F6] outline-none resize-none placeholder:text-black/20" />
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

function ProjectsEditor({ content, updateProject, addProject, removeItem }: { content: ResumeContent; updateProject: (id: number, f: string, v: string | string[]) => void; addProject: () => void; removeItem: (s: 'projects', id: number) => void }) {
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
                    <BulletEditor highlights={proj.highlights || []} onUpdate={(nh) => updateProject(proj.id, "highlights", nh)} />
                </div>
            ))}
            <AddButton label="Add Project" onClick={addProject} />
        </div>
    );
}

function ExperienceEditor({ content, updateExperience, addExperience, removeItem }: { content: ResumeContent; updateExperience: (id: number, f: string, v: string | string[]) => void; addExperience: () => void; removeItem: (s: 'experience', id: number) => void }) {
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
                    <BulletEditor highlights={exp.highlights} onUpdate={(nh) => updateExperience(exp.id, "highlights", nh)} />
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

function BulletEditor({ highlights, onUpdate }: { highlights: string[]; onUpdate: (nh: string[]) => void }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-[#737373] tracking-wide uppercase">Highlights</label>
            {highlights.map((h, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                    <span className="text-[#A3A3A3] text-xs mt-2 shrink-0">•</span>
                    <textarea value={h} onChange={(e) => { const nh = [...highlights]; nh[idx] = e.target.value; onUpdate(nh); }} placeholder="Quantify your impact..." className="flex-grow min-h-[36px] bg-[#F5F5F5] rounded-md p-2 text-xs text-[#0A0A0A] border border-[#E5E5E5] focus:border-[#3B82F6] outline-none resize-none placeholder:text-black/20" />
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
