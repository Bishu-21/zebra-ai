"use client";

import { FieldInput } from "@/components/compiler/FieldInput";
import type { Experience,ResumeContent } from "@/components/compiler/types";
import { RiDeleteBinLine } from "react-icons/ri";
import { AddButton } from "./AddButton";
import { BulletEditor } from "./BulletEditor";

export function ExperienceEditor({ content, updateExperience, addExperience, removeItem, getAiSuggestions }: { content: ResumeContent; updateExperience: (id: number, f: string, v: string | string[]) => void; addExperience: () => void; removeItem: (s: 'experience', id: number) => void; getAiSuggestions: (s: string, t: string, c?: { id: number; idx: number }) => void }) {
    return (
        <div className="space-y-4">
            {content.experience.map((exp: Experience) => (
                <div key={exp.id} className="p-4 border border-border-subtle rounded-[var(--radius-lg)] space-y-3 relative group bg-muted/30 hover:border-muted-foreground/20 transition-all">
                    <button onClick={() => removeItem('experience', exp.id)} className="absolute top-2 right-2 w-6 h-6 rounded-[var(--radius-sm)] flex items-center justify-center text-muted-foreground/30 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"><RiDeleteBinLine size={12} /></button>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FieldInput label="Company" value={exp.company} onChange={(v) => updateExperience(exp.id, "company", v)} placeholder="Perplexity" />
                        <FieldInput label="Location" value={exp.location || ""} onChange={(v) => updateExperience(exp.id, "location", v)} placeholder="Remote" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
