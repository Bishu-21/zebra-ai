import React from "react";

/** Reusable branded field input for the compiler editor */
export function FieldInput({ label, value, onChange, placeholder, name, type = "text" }: { 
    label: string; 
    value: string; 
    onChange: (v: string) => void; 
    placeholder?: string;
    name?: string;
    type?: string;
}) {
    return (
        <div className="space-y-1">
            <label className="text-[10px] font-semibold text-[#737373] tracking-wide uppercase">{label}</label>
            <input 
                name={name}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full h-9 bg-[#F5F5F5] rounded-lg px-3 text-sm text-[#0A0A0A] font-medium border border-[#E5E5E5] focus:border-[#3B82F6] focus:bg-white outline-none transition-all placeholder:text-black/20"
            />
        </div>
    );
}

/** Reusable branded textarea for the compiler editor */
export function FieldTextarea({ label, value, onChange, placeholder, name, rows = 3 }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    name?: string;
    rows?: number;
}) {
    return (
        <div className="space-y-1">
            <label className="text-[10px] font-semibold text-[#737373] tracking-wide uppercase">{label}</label>
            <textarea 
                name={name}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className="w-full bg-[#F5F5F5] rounded-lg p-3 text-sm text-[#0A0A0A] font-medium border border-[#E5E5E5] focus:border-[#3B82F6] focus:bg-white outline-none transition-all resize-none leading-relaxed placeholder:text-black/20"
            />
        </div>
    );
}
