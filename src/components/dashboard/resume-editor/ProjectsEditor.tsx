"use client";

import { FieldInput } from "@/components/compiler/FieldInput";
import type { Project,ResumeContent } from "@/components/compiler/types";
import { RiDeleteBinLine } from "react-icons/ri";
import { AddButton } from "./AddButton";
import { BulletEditor } from "./BulletEditor";

export function ProjectsEditor({ content, updateProject, addProject, removeItem, getAiSuggestions }: { content: ResumeContent; updateProject: (id: number, f: string, v: string | string[]) => void; addProject: () => void; removeItem: (s: 'projects', id: number) => void; getAiSuggestions: (s: string, t: string, c?: { id: number; idx: number }) => void }) {
    return (
        <div className="space-y-4">
            {(content.projects || []).map((proj: Project) => (
                <div key={proj.id} className="p-4 border border-border-subtle rounded-[var(--radius-lg)] space-y-3 relative group bg-muted/30 hover:border-muted-foreground/20 transition-all">
                    <button onClick={() => removeItem('projects', proj.id)} className="absolute top-2 right-2 w-6 h-6 rounded-[var(--radius-sm)] flex items-center justify-center text-muted-foreground/30 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"><RiDeleteBinLine size={12} /></button>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
