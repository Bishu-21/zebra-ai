import React from "react";
import { FieldInput } from "@/components/compiler/FieldInput";
import type { ResumeContent } from "@/components/compiler/types";

interface BasicsEditorProps {
    content: ResumeContent;
    updateBasics: (field: string, value: string) => void;
}

export function BasicsEditor({ content, updateBasics }: BasicsEditorProps) {
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldInput name="basics.name" label="Full Name" value={content.basics.name} onChange={(v) => updateBasics("name", v)} placeholder="Alex Webb" />
                <FieldInput name="basics.location" label="Location" value={content.basics.location} onChange={(v) => updateBasics("location", v)} placeholder="Howrah, West Bengal" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldInput name="basics.email" label="Email" value={content.basics.email} onChange={(v) => updateBasics("email", v)} placeholder="alex@email.com" />
                <FieldInput name="basics.phone" label="Phone" value={content.basics.phone} onChange={(v) => updateBasics("phone", v)} placeholder="+91-9330199312" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldInput name="basics.linkedin" label="LinkedIn" value={content.basics.linkedin || ""} onChange={(v) => updateBasics("linkedin", v)} placeholder="linkedin.com/in/..." />
                <FieldInput name="basics.portfolio" label="Portfolio" value={content.basics.portfolio || ""} onChange={(v) => updateBasics("portfolio", v)} placeholder="yoursite.com" />
            </div>
        </div>
    );
}
