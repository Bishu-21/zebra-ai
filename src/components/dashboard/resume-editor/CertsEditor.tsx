"use client";

import { FieldInput,FieldTextarea } from "@/components/compiler/FieldInput";
import type { Achievement,ResumeContent } from "@/components/compiler/types";
import { RiDeleteBinLine } from "react-icons/ri";
import { AddButton } from "./AddButton";

export function CertsEditor({ content, updateCert, addCert, removeItem }: { content: ResumeContent; updateCert: (id: number, f: string, v: string) => void; addCert: () => void; removeItem: (s: 'certifications', id: number) => void }) {
    return (
        <div className="space-y-4">
            <p className="text-[10px] text-muted-foreground">Group by type (e.g., Certifications, Hackathons).</p>
            {(content.certifications || []).map((cert: Achievement) => (
                <div key={cert.id} className="p-4 border border-border-subtle rounded-[var(--radius-lg)] space-y-3 relative group bg-muted/30 hover:border-muted-foreground/20 transition-all">
                    <button onClick={() => removeItem('certifications', cert.id)} className="absolute top-2 right-2 w-6 h-6 rounded-[var(--radius-sm)] flex items-center justify-center text-muted-foreground/30 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"><RiDeleteBinLine size={12} /></button>
                    <FieldInput label="Category" value={cert.category} onChange={(v) => updateCert(cert.id, "category", v)} placeholder="Certifications" />
                    <FieldTextarea label="Items (semicolon separated)" value={cert.items} onChange={(v) => updateCert(cert.id, "items", v)} placeholder="IBM Data Science Professional Certificate; Oracle OCI Foundations" rows={3} />
                </div>
            ))}
            <AddButton label="Add Category" onClick={addCert} />
        </div>
    );
}
