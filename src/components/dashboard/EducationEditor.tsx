import React from "react";
import { FieldInput } from "@/components/compiler/FieldInput";
import { useSettings } from "@/context/SettingsContext";
import { RiDeleteBinLine, RiAddLine } from "react-icons/ri";
import type { ResumeContent, Education } from "@/components/compiler/types";

interface EducationEditorProps {
    content: ResumeContent;
    updateEducation: (id: number, field: string, value: string | string[]) => void;
    addEducation: () => void;
    removeItem: (section: 'education', id: number) => void;
}

export function EducationEditor({ content, updateEducation, addEducation, removeItem }: EducationEditorProps) {
    const { settings } = useSettings();
    return (
        <div className="space-y-4">
            {content.education.map((edu: Education) => (
                <div key={edu.id} className="p-4 border border-border-subtle rounded-[var(--radius-lg)] space-y-3 relative group bg-muted/30 hover:border-muted-foreground/20 transition-all">
                    <button onClick={() => removeItem('education', edu.id)} className="absolute top-2 right-2 w-6 h-6 rounded-[var(--radius-sm)] flex items-center justify-center text-muted-foreground/30 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"><RiDeleteBinLine size={12} /></button>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FieldInput label="Institution" value={edu.school} onChange={(v) => updateEducation(edu.id, "school", v)} placeholder="Brainware University" />
                        <FieldInput label="Location" value={edu.location || ""} onChange={(v) => updateEducation(edu.id, "location", v)} placeholder="Kolkata, India" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FieldInput label="Degree" value={edu.degree} onChange={(v) => updateEducation(edu.id, "degree", v)} placeholder="B.Tech in CSE (AIML)" />
                        <FieldInput label="CGPA/GPA" value={edu.gpa || ""} onChange={(v) => updateEducation(edu.id, "gpa", v)} placeholder="CGPA: 9.21 / 10.0" />
                    </div>
                    <FieldInput label="Period" value={edu.period} onChange={(v) => updateEducation(edu.id, "period", v)} placeholder="Expected 2026" />
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-muted-foreground tracking-wide uppercase">Highlights</label>
                        {(edu.highlights || []).map((h: string, idx: number) => (
                            <div key={idx} className="flex gap-2 items-start">
                                <span className="text-muted-foreground/60 text-xs mt-2 shrink-0">•</span>
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
                                    className="flex-grow min-h-[36px] bg-muted rounded-[var(--radius-md)] p-2 text-foreground border border-border-subtle focus:border-primary outline-none resize-none placeholder:text-foreground/20 custom-scrollbar" />
                            </div>
                        ))}
                        <button onClick={() => updateEducation(edu.id, "highlights", [...(edu.highlights || []), ""])} className="text-[10px] font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 ml-4"><RiAddLine size={10} /> Add</button>
                    </div>
                </div>
            ))}
            <AddButton label="Add Education" onClick={addEducation} />
        </div>
    );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <button onClick={onClick} className="w-full h-10 border border-dashed border-border-subtle rounded-[var(--radius-md)] flex items-center justify-center gap-2 text-muted-foreground text-[10px] font-semibold hover:border-primary/30 hover:text-primary transition-all">
            <RiAddLine size={12} /> {label}
        </button>
    );
}
