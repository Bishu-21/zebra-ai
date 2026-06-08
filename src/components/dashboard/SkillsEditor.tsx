import React from "react";
import { FieldInput, FieldTextarea } from "@/components/compiler/FieldInput";
import { RiDeleteBinLine, RiAddLine } from "react-icons/ri";
import type { ResumeContent, SkillCategory } from "@/components/compiler/types";

interface SkillsEditorProps {
    content: ResumeContent;
    updateSkill: (id: number, field: string, value: string) => void;
    addSkill: () => void;
    removeItem: (section: 'skills', id: number) => void;
}

export function SkillsEditor({ content, updateSkill, addSkill, removeItem }: SkillsEditorProps) {
    return (
        <div className="space-y-4">
            <p className="text-[10px] text-muted-foreground">Group your skills by category (e.g., Languages, Core Concepts, Web & Tools).</p>
            {content.skills.map((skill: SkillCategory) => (
                <div key={skill.id} className="p-4 border border-border-subtle rounded-[var(--radius-lg)] space-y-3 relative group bg-muted/30 hover:border-muted-foreground/20 transition-all">
                    <button onClick={() => removeItem('skills', skill.id)} className="absolute top-2 right-2 w-6 h-6 rounded-[var(--radius-sm)] flex items-center justify-center text-muted-foreground/30 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"><RiDeleteBinLine size={12} /></button>
                    <FieldInput label="Category" value={skill.category} onChange={(v) => updateSkill(skill.id, "category", v)} placeholder="Languages" />
                    <FieldTextarea label="Items (comma separated)" value={skill.items} onChange={(v) => updateSkill(skill.id, "items", v)} placeholder="Java, Python, C, SQL" rows={2} />
                </div>
            ))}
            <AddButton label="Add Skill Category" onClick={addSkill} />
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
