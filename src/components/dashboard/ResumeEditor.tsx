"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    RiArrowLeftLine, 
    RiSave3Line, 
    RiMagicLine, 
    RiLayout4Line, 
    RiEyeLine, 
    RiCodeSSlashLine, 
    RiMore2Line,
    RiArrowRightSLine,
    RiCheckLine,
    RiLoader4Line,
    RiCloseCircleLine,
    RiAddLine,
    RiSubtractLine,
    RiRobot2Line,
    RiCloseLine,
    RiSparklingLine,
    RiUser6Line,
    RiBriefcaseLine,
    RiGraduationCapLine,
    RiToolsLine,
    RiClipboardLine,
    RiFileDownloadLine,
    RiExternalLinkLine,
    RiCheckboxCircleFill,
    RiDragMove2Fill,
    RiCalendarLine
} from "react-icons/ri";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

interface ResumeEditorProps {
    initialData?: any;
}

export function ResumeEditor({ initialData }: ResumeEditorProps) {
    const [resume, setResume] = useState(() => {
        if (initialData) {
            try {
                const parsed = JSON.parse(initialData.content || "{}");
                return {
                    id: initialData.id,
                    title: initialData.title || "Untitled Resume",
                    content: {
                        basics: parsed.basics || { name: "", email: "", phone: "", summary: "", location: "" },
                        experience: parsed.experience || [],
                        education: parsed.education || [],
                        skills: parsed.skills || []
                    }
                };
            } catch (e) {
                console.error("Failed to parse resume content", e);
            }
        }
        return {
            id: initialData?.id || "new",
            title: initialData?.title || "Untitled Resume",
            content: {
                basics: { name: "", email: "", phone: "", summary: "", location: "" },
                experience: [],
                education: [],
                skills: []
            }
        };
    });
    const [isSaving, setIsSaving] = useState(false);
    const [activeSection, setActiveSection] = useState("basics");
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
    const [showAiPanel, setShowAiPanel] = useState(false);
    const [aiContext, setAiContext] = useState<any>(null);
    const [copying, setCopying] = useState<string | null>(null);
    const router = useRouter();
    const { showToast } = useToast();

    const getAiSuggestions = async (section: string, currentText: string, itemContext?: any) => {
        setIsAiLoading(true);
        setShowAiPanel(true);
        setAiContext({ section, currentText, itemContext });
        
        try {
            const res = await fetch("/api/ai/copilot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    section,
                    currentText,
                    context: resume.content
                })
            });
            const data = await res.json();
            if (data.suggestions) {
                setAiSuggestions(data.suggestions);
            }
        } catch (error) {
            showToast("AI Assistant failed to connect", "error");
        } finally {
            setIsAiLoading(false);
        }
    };

    const sections = [
        { id: "basics", label: "Basics", icon: RiUser6Line },
        { id: "experience", label: "Experience", icon: RiBriefcaseLine },
        { id: "education", label: "Education", icon: RiGraduationCapLine },
        { id: "skills", label: "Skills", icon: RiToolsLine },
    ];

    const handleSave = async () => {
        if (resume.id === "new") {
            showToast("Global Save for NEW resumes in development", "info");
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch(`/api/resumes/${resume.id}/update`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: resume.title,
                    content: JSON.stringify(resume.content)
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Save failed");

            showToast("Resume State Synchronized", "success");
        } catch (error: any) {
            showToast(error.message, "error");
        } finally {
            setIsSaving(false);
        }
    };

    const copyToClipboard = async (type: 'json' | 'text') => {
        setCopying(type);
        try {
            let content = "";
            if (type === 'json') {
                content = JSON.stringify(resume.content, null, 2);
            } else {
                const { basics, experience, education, skills } = resume.content;
                content = `${basics.name.toUpperCase()}\n${basics.location} | ${basics.email}\n\n`;
                content += `SUMMARY\n${basics.summary}\n\n`;
                content += `EXPERIENCE\n`;
                experience.forEach((exp: any) => {
                    content += `${exp.role} @ ${exp.company}\n`;
                    exp.highlights.forEach((h: string) => content += `- ${h}\n`);
                    content += `\n`;
                });
                content += `SKILLS\n${skills.join(', ')}`;
            }
            await navigator.clipboard.writeText(content);
            showToast(`Copied ${type.toUpperCase()} to clipboard`, "success");
            setTimeout(() => setCopying(null), 2000);
        } catch (err) {
            showToast("Failed to copy", "error");
            setCopying(null);
        }
    };

    const updateBasics = (field: string, value: string) => {
        setResume(prev => ({
            ...prev,
            content: {
                ...prev.content,
                basics: { ...prev.content.basics, [field]: value }
            }
        }));
    };

    const addExperience = () => {
        const newItem = { id: Date.now(), company: "", role: "", period: "", highlights: [""] };
        setResume(prev => ({
            ...prev,
            content: { ...prev.content, experience: [...prev.content.experience, newItem] }
        }));
    };

    const addEducation = () => {
        const newItem = { id: Date.now(), school: "", degree: "", period: "" };
        setResume(prev => ({
            ...prev,
            content: { ...prev.content, education: [...prev.content.education, newItem] }
        }));
    };

    const updateExperience = (id: number, field: string, value: any) => {
        setResume(prev => ({
            ...prev,
            content: {
                ...prev.content,
                experience: prev.content.experience.map((item: any) => 
                    item.id === id ? { ...item, [field]: value } : item
                )
            }
        }));
    };

    const removeitem = (section: 'experience' | 'education' | 'skills', id: number) => {
        setResume(prev => ({
            ...prev,
            content: {
                ...prev.content,
                [section]: (prev.content as any)[section].filter((item: any) => item.id !== id)
            }
        }));
    };

    const updateEducation = (id: number, field: string, value: string) => {
        setResume(prev => ({
            ...prev,
            content: {
                ...prev.content,
                education: prev.content.education.map((item: any) => 
                    item.id === id ? { ...item, [field]: value } : item
                )
            }
        }));
    };

    const applySuggestion = (suggestion: string) => {
        if (!aiContext) return;

        const { section, itemContext } = aiContext;

        if (section === "Summary") {
            updateBasics("summary", suggestion);
        } else if (section === "Experience Bullet Point") {
            const { expId, highlightIdx } = itemContext;
            const exp = resume.content.experience.find((e: any) => e.id === expId);
            if (exp) {
                const newH = [...exp.highlights];
                newH[highlightIdx] = suggestion;
                updateExperience(expId, "highlights", newH);
            }
        }
        
        setShowAiPanel(false);
        showToast("AI Intelligence Applied", "success");
    };

    return (
        <div className="flex h-screen bg-[#F8F9FA] overflow-hidden relative">
            {/* Sidebar Navigation */}
            {/* ... (sidebar code) */}
            <aside className="w-20 md:w-64 bg-white border-r border-black/5 flex flex-col items-center py-8">
                <button 
                    onClick={() => router.push('/dashboard')}
                    className="mb-12 w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center text-black/40 hover:bg-black hover:text-white transition-all shadow-sm"
                >
                    <RiArrowLeftLine size={24} />
                </button>
                
                <nav className="flex-grow w-full px-4 space-y-4">
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`
                                w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group
                                ${activeSection === section.id 
                                    ? "bg-black text-white shadow-xl shadow-black/10" 
                                    : "text-black/40 hover:bg-black/5 hover:text-black"}
                            `}
                        >
                            <section.icon size={20} className={`${activeSection === section.id ? "text-white" : "group-hover:scale-110 transition-transform"}`} />
                            <span className="hidden md:block font-black text-[0.7rem] uppercase tracking-widest">{section.label}</span>
                            {activeSection === section.id && (
                                <motion.div layoutId="active-nav" className="ml-auto hidden md:block">
                                    <RiArrowRightSLine size={16} />
                                </motion.div>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="mt-auto px-4 w-full">
                    <button 
                        onClick={() => setShowAiPanel(!showAiPanel)}
                        className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-6 flex flex-col gap-4 w-full text-left hover:bg-blue-500/10 transition-all group"
                    >
                        <RiRobot2Line size={24} className="text-blue-500 group-hover:scale-110 transition-transform" />
                        <p className="text-[0.6rem] font-black uppercase tracking-widest text-blue-500 leading-relaxed">
                            Open Copilot
                        </p>
                    </button>
                </div>
            </aside>

            {/* Main Editor Surface */}
            <main className="flex-grow flex flex-col relative">
                {/* Editor Header */}
                <header className="h-24 bg-white border-b border-black/5 flex items-center justify-between px-10">
                    <div className="flex items-center gap-4">
                        <input 
                            type="text" 
                            value={resume.title}
                            onChange={(e) => setResume({...resume, title: e.target.value})}
                            className="text-xl font-black text-black outline-none bg-transparent w-48 md:w-64 focus:border-b-2 border-black/10 transition-all uppercase tracking-tight"
                        />
                        <span className="px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-[0.6rem] font-black uppercase tracking-widest">Draft</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 mr-2">
                            <button 
                                onClick={() => copyToClipboard('text')}
                                className="h-12 px-5 bg-white border border-black/5 rounded-xl text-[0.6rem] font-black uppercase tracking-widest text-black/60 hover:bg-black hover:text-white transition-all flex items-center gap-2 active:scale-95"
                            >
                                {copying === 'text' ? <RiCheckboxCircleFill className="text-green-500" /> : <RiClipboardLine />}
                                {copying === 'text' ? "Copied Text" : "Copy Text"}
                            </button>
                            <button 
                                onClick={() => copyToClipboard('json')}
                                className="h-12 px-5 bg-white border border-black/5 rounded-xl text-[0.6rem] font-black uppercase tracking-widest text-black/60 hover:bg-black hover:text-white transition-all flex items-center gap-2 active:scale-95"
                            >
                                {copying === 'json' ? <RiCheckboxCircleFill className="text-green-500" /> : <RiCodeSSlashLine />}
                                {copying === 'json' ? "Copied JSON" : "Copy JSON"}
                            </button>
                            <button 
                                onClick={() => window.print()}
                                className="h-12 px-5 bg-white border border-black/5 rounded-xl text-[0.6rem] font-black uppercase tracking-widest text-black/40 hover:text-black transition-all flex items-center gap-2 group italic"
                            >
                                <RiFileDownloadLine className="group-hover:scale-110 transition-transform" />
                                Export PDF
                            </button>
                        </div>

                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-black text-white px-10 h-12 rounded-xl font-black text-[0.75rem] uppercase tracking-[0.2em] shadow-xl shadow-black/10 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-30"
                        >
                            {isSaving ? <RiLoader4Line size={18} className="animate-spin" /> : <RiSave3Line size={18} />}
                            {isSaving ? "Saving..." : "Save State"}
                        </button>
                    </div>
                </header>

                {/* Split Pane Layer */}
                <div className="flex-grow flex overflow-hidden">
                    {/* Left: Input Form */}
                    <div className="flex-1 overflow-y-auto no-scrollbar bg-white p-16">
                        <div className="max-w-3xl mx-auto space-y-12 pb-24">
                            <div className="flex items-center justify-between pb-8 border-b border-black/5">
                                <div>
                                    <h2 className="text-4xl font-black text-black tracking-tighter mb-2">{activeSection.toUpperCase()}</h2>
                                    <p className="text-black/60 text-sm font-medium italic">Refine your strategic assets for maximum professional leverage.</p>
                                </div>
                                <RiCodeSSlashLine size={48} className="text-black/[0.03]" />
                            </div>

                            {/* Forms rendered here... */}
                            {/* ... (Basics, Experience, Education, Skills) */}

                            {/* SECTION BASICS */}
                            {activeSection === "basics" && (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-black/70 ml-1">Full Identity</label>
                                            <input 
                                                type="text" 
                                                value={resume.content.basics.name}
                                                onChange={(e) => updateBasics("name", e.target.value)}
                                                placeholder="John Wick" 
                                                className="w-full h-16 bg-[#F8F9FA] rounded-2xl px-6 font-bold text-black border-2 border-black/[0.02] focus:border-black/10 focus:bg-white outline-none transition-all" 
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-black/70 ml-1">Location</label>
                                            <input 
                                                type="text" 
                                                value={resume.content.basics.location}
                                                onChange={(e) => updateBasics("location", e.target.value)}
                                                placeholder="San Francisco, CA" 
                                                className="w-full h-16 bg-[#F8F9FA] rounded-2xl px-6 font-bold text-black border-2 border-black/[0.02] focus:border-black/10 focus:bg-white outline-none transition-all" 
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-black/70 ml-1">Secure Contact</label>
                                            <input 
                                                type="email" 
                                                value={resume.content.basics.email}
                                                onChange={(e) => updateBasics("email", e.target.value)}
                                                placeholder="john@continental.com" 
                                                className="w-full h-16 bg-[#F8F9FA] rounded-2xl px-6 font-bold text-black border-2 border-black/[0.02] focus:border-black/10 focus:bg-white outline-none transition-all" 
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-black/70 ml-1">Phone</label>
                                            <input 
                                                type="text" 
                                                value={resume.content.basics.phone}
                                                onChange={(e) => updateBasics("phone", e.target.value)}
                                                placeholder="+1 (555) 000-0000" 
                                                className="w-full h-16 bg-[#F8F9FA] rounded-2xl px-6 font-bold text-black border-2 border-black/[0.02] focus:border-black/10 focus:bg-white outline-none transition-all" 
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3 relative group">
                                        <label className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-black/70 ml-1">Professional Narrative</label>
                                        <div className="relative">
                                            <textarea 
                                                value={resume.content.basics.summary}
                                                onChange={(e) => updateBasics("summary", e.target.value)}
                                                placeholder="Briefly describe your high-level achievements..."
                                                className="w-full min-h-[220px] bg-[#F8F9FA] rounded-[2rem] p-8 font-bold text-black border-2 border-black/[0.02] focus:border-black/10 focus:bg-white outline-none transition-all resize-none leading-relaxed shadow-inner"
                                            />
                                            <button 
                                                onClick={() => getAiSuggestions("Summary", resume.content.basics.summary)}
                                                className="absolute bottom-4 right-4 p-3 bg-black text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95"
                                            >
                                                <RiMagicLine size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SECTION EXPERIENCE */}
                            {activeSection === "experience" && (
                                <div className="space-y-12">
                                    {resume.content.experience.map((exp: any) => (
                                        <div key={exp.id} className="p-12 border border-black/5 rounded-[3rem] space-y-10 relative group hover:border-black/10 transition-all bg-white shadow-sm hover:shadow-xl hover:shadow-black/5">
                                            {/* Drag Handle Aesthetic */}
                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all cursor-move text-black/10">
                                                <RiDragMove2Fill size={20} />
                                            </div>

                                            <button 
                                                onClick={() => removeitem('experience', exp.id)}
                                                className="absolute -top-4 -right-4 w-12 h-12 bg-white border border-black/5 rounded-full flex items-center justify-center text-black/20 hover:text-red-500 hover:border-red-100 transition-all shadow-lg active:scale-95"
                                            >
                                                <RiCloseCircleLine size={24} />
                                            </button>
                                            
                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="space-y-3">
                                                    <label className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-black/40 ml-1">Company</label>
                                                    <input 
                                                        type="text" 
                                                        value={exp.company}
                                                        onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                                                        placeholder="Continental Hotels" 
                                                        className="w-full h-16 bg-[#F8F9FA] rounded-2xl px-6 font-bold text-black border-2 border-black/[0.02] focus:border-black/10 focus:bg-white outline-none transition-all placeholder:text-black/20" 
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-black/40 ml-1">Role/Title</label>
                                                    <input 
                                                        type="text" 
                                                        value={exp.role}
                                                        onChange={(e) => updateExperience(exp.id, "role", e.target.value)}
                                                        placeholder="Senior Executive" 
                                                        className="w-full h-16 bg-[#F8F9FA] rounded-2xl px-6 font-bold text-black border-2 border-black/[0.02] focus:border-black/10 focus:bg-white outline-none transition-all placeholder:text-black/20" 
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-black/40 ml-1">Active Duration</label>
                                                <div className="relative">
                                                    <RiCalendarLine className="absolute left-6 top-1/2 -translate-y-1/2 text-black/20" />
                                                    <input 
                                                        type="text" 
                                                        value={exp.period}
                                                        onChange={(e) => updateExperience(exp.id, "period", e.target.value)}
                                                        placeholder="JAN 2020 — PRESENT" 
                                                        className="w-full h-16 bg-[#F8F9FA] rounded-2xl pl-14 pr-6 font-bold text-black border-2 border-black/[0.02] focus:border-black/10 focus:bg-white outline-none transition-all placeholder:text-black/20" 
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-black/40 ml-1">Key Achievements (Bullet points)</label>
                                                <div className="space-y-4">
                                                    {exp.highlights.map((h: string, idx: number) => (
                                                        <div key={idx} className="flex gap-4 group/bullet relative">
                                                            <div className="w-2 h-2 rounded-full bg-black/10 mt-6 shrink-0" />
                                                            <textarea 
                                                                value={h}
                                                                onChange={(e) => {
                                                                    const newH = [...exp.highlights];
                                                                    newH[idx] = e.target.value;
                                                                    updateExperience(exp.id, "highlights", newH);
                                                                }}
                                                                placeholder="Quantify your impact..."
                                                                className="flex-grow min-h-[80px] bg-black/5 rounded-xl p-4 font-bold text-sm border-2 border-transparent focus:border-black/5 outline-none resize-none placeholder:text-black/20"
                                                            />
                                                            <div className="flex flex-col gap-2 opacity-0 group-hover/bullet:opacity-100 transition-all">
                                                                <button 
                                                                    onClick={() => getAiSuggestions("Experience Bullet Point", h, { expId: exp.id, highlightIdx: idx })}
                                                                    className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                                                                >
                                                                    <RiMagicLine size={16} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => {
                                                                        const newH = exp.highlights.filter((_: any, i: number) => i !== idx);
                                                                        updateExperience(exp.id, "highlights", newH);
                                                                    }}
                                                                    className="w-10 h-10 bg-black/5 text-black/20 rounded-lg flex items-center justify-center hover:text-red-500 transition-colors"
                                                                >
                                                                    <RiSubtractLine size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <button 
                                                        onClick={() => {
                                                            const newH = [...exp.highlights, ""];
                                                            updateExperience(exp.id, "highlights", newH);
                                                        }}
                                                        className="w-full py-4 border-2 border-dashed border-black/5 rounded-2xl text-[0.6rem] font-black uppercase tracking-widest text-black/20 hover:text-black hover:border-black/20 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <RiAddLine size={16} />
                                                        Add Bullet Point
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={addExperience}
                                        className="w-full h-20 border-2 border-dashed border-black/10 rounded-[2rem] flex items-center justify-center gap-4 text-black/30 font-black uppercase tracking-[0.2em] hover:border-black/50 hover:text-black transition-all bg-black/[0.01]"
                                    >
                                        <RiAddLine size={24} />
                                        Add Strategic Experience
                                    </button>
                                </div>
                            )}

                            {/* SECTION EDUCATION */}
                            {activeSection === "education" && (
                                <div className="space-y-12">
                                    {resume.content.education.map((edu: any) => (
                                        <div key={edu.id} className="p-12 border border-black/5 rounded-[3rem] space-y-10 relative group hover:border-black/10 transition-all bg-white shadow-sm hover:shadow-xl hover:shadow-black/5">
                                            {/* Drag Handle Aesthetic */}
                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all cursor-move text-black/10">
                                                <RiDragMove2Fill size={20} />
                                            </div>

                                            <button 
                                                onClick={() => removeitem('education', edu.id)}
                                                className="absolute -top-4 -right-4 w-12 h-12 bg-white border border-black/5 rounded-full flex items-center justify-center text-black/20 hover:text-red-500 hover:border-red-100 transition-all shadow-lg active:scale-95"
                                            >
                                                <RiCloseCircleLine size={24} />
                                            </button>
                                            
                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="space-y-3">
                                                    <label className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-black/40 ml-1">Institution</label>
                                                    <input 
                                                        type="text" 
                                                        value={edu.school}
                                                        onChange={(e) => updateEducation(edu.id, "school", e.target.value)}
                                                        placeholder="High Table Academy" 
                                                        className="w-full h-16 bg-[#F8F9FA] rounded-2xl px-6 font-bold text-black border-2 border-black/[0.02] focus:border-black/10 focus:bg-white outline-none transition-all placeholder:text-black/20" 
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-black/40 ml-1">Degree/Level</label>
                                                    <input 
                                                        type="text" 
                                                        value={edu.degree}
                                                        onChange={(e) => updateEducation(edu.id, "degree", e.target.value)}
                                                        placeholder="Master of Strategy" 
                                                        className="w-full h-16 bg-[#F8F9FA] rounded-2xl px-6 font-bold text-black border-2 border-black/[0.02] focus:border-black/10 focus:bg-white outline-none transition-all placeholder:text-black/20" 
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-black/40 ml-1">Period</label>
                                                <div className="relative">
                                                    <RiCalendarLine className="absolute left-6 top-1/2 -translate-y-1/2 text-black/20" />
                                                    <input 
                                                        type="text" 
                                                        value={edu.period}
                                                        onChange={(e) => updateEducation(edu.id, "period", e.target.value)}
                                                        placeholder="2016 — 2020" 
                                                        className="w-full h-16 bg-[#F8F9FA] rounded-2xl pl-14 pr-6 font-bold text-black border-2 border-black/[0.02] focus:border-black/10 focus:bg-white outline-none transition-all placeholder:text-black/20" 
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={addEducation}
                                        className="w-full h-20 border-2 border-dashed border-black/10 rounded-[2rem] flex items-center justify-center gap-4 text-black/30 font-black uppercase tracking-[0.2em] hover:border-black/50 hover:text-black transition-all bg-black/[0.01]"
                                    >
                                        <RiAddLine size={24} />
                                        Add Strategic Credential
                                    </button>
                                </div>
                            )}

                            {/* SECTION SKILLS */}
                            {activeSection === "skills" && (
                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        <label className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-black/70 ml-1">Technical Stack (Comma separated)</label>
                                        <textarea 
                                            value={resume.content.skills?.join(', ')}
                                            onChange={(e) => {
                                                setResume(prev => ({
                                                    ...prev,
                                                    content: { ...prev.content, skills: e.target.value.split(',').map(s => s.trim()) }
                                                }));
                                            }}
                                            placeholder="Next.js, Python, AWS, neural-audit..."
                                            className="w-full min-h-[150px] bg-[#F8F9FA] rounded-2xl p-8 font-bold text-black border-2 border-transparent focus:border-black/5 outline-none transition-all resize-none leading-relaxed"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Live Preview Sheet */}
                    <div className="hidden xl:flex flex-1 bg-[#EBEEF2] overflow-y-auto p-16 items-start justify-center no-scrollbar preview-container">
                        <div className="w-full max-w-[800px] aspect-[1/1.41] bg-white shadow-2xl rounded-sm p-16 relative overflow-hidden preview-sheet">
                            {/* Watermark/Grid Background */}
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none">
                                <div className="h-full w-full bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px]" />
                            </div>

                            {/* Preview Header */}
                            <div className="relative border-b-2 border-black pb-8 mb-12">
                                <h1 className="text-4xl font-black tracking-tighter text-black mb-2 uppercase">{resume.content.basics.name || "UNIDENTIFIED"}</h1>
                                <div className="flex gap-4 text-[0.7rem] font-bold text-black/60 uppercase tracking-widest">
                                    <span>{resume.content.basics.location || "GLOBAL AGNOSTIC"}</span>
                                    <span>•</span>
                                    <span>{resume.content.basics.email || "NO SECURE CONTACT"}</span>
                                    {resume.content.basics.phone && (
                                        <>
                                            <span>•</span>
                                            <span>{resume.content.basics.phone}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Preview Body Shell */}
                            <div className="space-y-12">
                                {resume.content.basics.summary && (
                                    <section>
                                        <h2 className="text-[0.65rem] font-black uppercase tracking-[0.3em] text-black/40 mb-4 border-b border-black/5 pb-2">Mission Statement</h2>
                                        <p className="text-[0.8rem] text-black/80 leading-relaxed font-medium">
                                            {resume.content.basics.summary}
                                        </p>
                                    </section>
                                )}

                                {resume.content.experience.length > 0 && (
                                    <section>
                                        <h2 className="text-[0.65rem] font-black uppercase tracking-[0.3em] text-black/40 mb-6 border-b border-black/5 pb-2">Experience Portfolio</h2>
                                        <div className="space-y-8">
                                            {resume.content.experience.map((exp: any) => (
                                                <div key={exp.id} className="space-y-2">
                                                    <div className="flex justify-between items-baseline">
                                                        <h3 className="text-md font-black text-black uppercase">{exp.role || "OPERATIVE"} @ {exp.company || "AGENCY"}</h3>
                                                        <span className="text-[0.7rem] font-bold text-black/40 uppercase">{exp.period || "20XX — PRESENT"}</span>
                                                    </div>
                                                    {exp.highlights?.length > 0 && (
                                                        <ul className="space-y-2 list-disc pl-4">
                                                            {exp.highlights.filter((h: string) => h.trim()).map((h: string, idx: number) => (
                                                                <li key={idx} className="text-[0.8rem] text-black/70 leading-relaxed font-medium">{h}</li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {(resume.content.education || []).length > 0 && (
                                    <section>
                                        <h2 className="text-[0.65rem] font-black uppercase tracking-[0.3em] text-black/40 mb-6 border-b border-black/5 pb-2">Academic Foundation</h2>
                                        <div className="space-y-6">
                                            {resume.content.education.map((edu: any) => (
                                                <div key={edu.id} className="space-y-1">
                                                    <div className="flex justify-between items-baseline">
                                                        <h3 className="text-md font-black text-black uppercase">{edu.degree || "CREDENTIAL"}</h3>
                                                        <span className="text-[0.7rem] font-bold text-black/40 uppercase">{edu.period || "20XX — 20XX"}</span>
                                                    </div>
                                                    <p className="text-[0.8rem] font-bold text-black/60 uppercase tracking-wide">{edu.school || "INSTITUTION"}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {resume.content.skills.length > 0 && (
                                    <section>
                                        <h2 className="text-[0.65rem] font-black uppercase tracking-[0.3em] text-black/40 mb-6 border-b border-black/5 pb-2">Technical Core</h2>
                                        <div className="flex flex-wrap gap-2 text-[0.7rem] font-black uppercase tracking-wider text-black">
                                            {resume.content.skills.map((s: string, i: number) => (
                                                <React.Fragment key={i}>
                                                    <span>{s}</span>
                                                    {i < resume.content.skills.length - 1 && <span className="text-black/20">•</span>}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Assistant Overlay */}
                <AnimatePresence>
                    {showAiPanel && (
                        <>
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowAiPanel(false)}
                                className="absolute inset-0 bg-black/20 backdrop-blur-sm z-40"
                            />
                            <motion.div 
                                initial={{ x: "100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="absolute top-0 right-0 h-full w-[400px] bg-white shadow-[-20px_0_50px_rgba(0,0,0,0.1)] z-50 flex flex-col pt-12"
                            >
                                <div className="px-10 flex items-center justify-between mb-12">
                                    <div>
                                        <h3 className="text-2xl font-black text-black tracking-tighter uppercase italic">AI Copilot</h3>
                                        <p className="text-[0.6rem] font-black uppercase tracking-widest text-blue-500">Intelligent Optimization</p>
                                    </div>
                                    <button 
                                        onClick={() => setShowAiPanel(false)}
                                        className="w-12 h-12 bg-black/5 rounded-2xl flex items-center justify-center text-black/40 hover:bg-black hover:text-white transition-all shadow-sm"
                                    >
                                        <RiCloseLine size={24} />
                                    </button>
                                </div>

                                <div className="flex-grow overflow-y-auto px-10 no-scrollbar pb-12 space-y-8">
                                    {isAiLoading ? (
                                        <div className="flex flex-col items-center justify-center h-64 gap-6">
                                            <RiLoader4Line size={48} className="text-black/10 animate-spin" />
                                            <p className="text-[0.6rem] font-black uppercase tracking-[0.3em] text-black/20 animate-pulse text-center">
                                                Analyzing Strategic Context...<br/>
                                                Synthesizing Impact Vectors
                                            </p>
                                        </div>
                                    ) : aiSuggestions.length > 0 ? (
                                        <>
                                            <div className="p-8 bg-blue-500/5 border border-blue-500/10 rounded-3xl space-y-4">
                                                <RiSparklingLine size={24} className="text-blue-500" />
                                                <h4 className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-blue-600">Contextual Refinement</h4>
                                                <p className="text-xs font-bold text-black/60 leading-relaxed italic">
                                                    "Optimized based on ATS patterns and competitive high-frequency professional standards."
                                                </p>
                                            </div>

                                            <div className="space-y-6">
                                                {aiSuggestions.map((suggestion, idx) => (
                                                    <motion.div 
                                                        key={idx}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: idx * 0.1 }}
                                                        className="p-6 border-2 border-black/5 rounded-2xl space-y-4 hover:border-black/20 transition-all group relative overflow-hidden"
                                                    >
                                                        <div className="absolute top-0 right-0 w-16 h-16 bg-black/[0.02] -mr-8 -mt-8 rounded-full" />
                                                        <p className="text-sm font-bold text-black/80 leading-relaxed">
                                                            {suggestion}
                                                        </p>
                                                        <button 
                                                            onClick={() => applySuggestion(suggestion)}
                                                            className="w-full h-12 bg-black text-white rounded-xl font-black text-[0.65rem] uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0"
                                                        >
                                                            Apply Vector
                                                        </button>
                                                    </motion.div>
                                                ))}
                                            </div>

                                            <button 
                                                onClick={() => getAiSuggestions(aiContext.section, aiContext.currentText, aiContext.itemContext)}
                                                className="w-full h-16 border-2 border-dashed border-black/10 rounded-2xl flex items-center justify-center gap-3 text-black/20 font-bold uppercase tracking-widest hover:text-black hover:border-black/30 transition-all"
                                            >
                                                <RiMagicLine size={18} />
                                                Regenerate
                                            </button>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-64 gap-6 opacity-20">
                                            <RiRobot2Line size={64} />
                                            <p className="text-[0.65rem] font-black uppercase tracking-widest text-center">
                                                System Idle.<br/>
                                                Select a section to optimize.
                                            </p>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="p-10 border-t border-black/5 bg-black/[0.01]">
                                    <div className="flex items-center gap-4 text-[0.6rem] font-black uppercase tracking-widest text-black/30">
                                        <RiCheckLine size={16} className="text-green-500" />
                                        <span>Neural Audit Verified</span>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
