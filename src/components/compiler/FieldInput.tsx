import React, { useId } from "react";
import { useSettings } from "@/context/SettingsContext";
import { RiMagicLine } from "react-icons/ri";

/** Reusable branded field input for the compiler editor */
export function FieldInput({ label, value, onChange, placeholder, name, type = "text", onMagicAction }: { 
    label: string; 
    value: string; 
    onChange: (v: string) => void; 
    placeholder?: string;
    name?: string;
    type?: string;
    onMagicAction?: () => void;
}) {
    const { settings } = useSettings();
    const generatedId = useId();
    const fieldId = name || `input-${label.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${generatedId}`;
    const fieldName = name || `name-${label.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${generatedId}`;

    return (
        <div className={settings.compactView ? "space-y-0.5" : "space-y-1"}>
            <label htmlFor={fieldId} className="text-[10px] font-bold text-[#737373] tracking-wide uppercase opacity-80">{label}</label>
            <div className="relative group">
                <input 
                    id={fieldId}
                    name={fieldName}
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    style={{ fontSize: settings.fontSize }}
                    spellCheck={settings.spellcheck}
                    className={`w-full ${settings.compactView ? 'h-9' : 'h-11'} bg-[#F7F7F7] rounded-xl px-3.5 pr-10 text-[#0A0A0A] font-semibold border border-neutral-200 focus:border-[#0A0A0A] focus:bg-white focus:ring-2 focus:ring-black/10 outline-none transition-all duration-200 placeholder:text-neutral-400/70 shadow-sm hover:border-neutral-300`}
                />
                {onMagicAction && (
                    <button 
                        type="button"
                        onClick={onMagicAction}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-all shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="AI Magic Suggestion"
                    >
                        <RiMagicLine size={13} />
                    </button>
                )}
            </div>
        </div>
    );
}

/** Reusable branded textarea for the compiler editor */
export function FieldTextarea({ label, value, onChange, placeholder, name, rows = 3, onMagicAction }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    name?: string;
    rows?: number;
    onMagicAction?: () => void;
}) {
    const { settings } = useSettings();
    const generatedId = useId();
    const fieldId = name || `textarea-${label.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${generatedId}`;
    const fieldName = name || `name-${label.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${generatedId}`;

    return (
        <div className={settings.compactView ? "space-y-0.5" : "space-y-1"}>
            <label htmlFor={fieldId} className="text-[10px] font-bold text-[#737373] tracking-wide uppercase opacity-80">{label}</label>
            <div className="relative group">
                <textarea 
                    id={fieldId}
                    name={fieldName}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    rows={settings.compactView ? Math.max(1, rows - 1) : rows}
                    wrap={settings.lineWrapping ? "soft" : "off"}
                    style={{ 
                        fontSize: settings.fontSize,
                        whiteSpace: settings.lineWrapping ? "pre-wrap" : "pre",
                        overflowX: settings.lineWrapping ? "hidden" : "auto"
                    }}
                    spellCheck={settings.spellcheck}
                    className={`w-full bg-[#F7F7F7] rounded-xl ${settings.compactView ? 'p-2.5' : 'p-3.5'} pr-10 text-[#0A0A0A] font-semibold border border-neutral-200 focus:border-[#0A0A0A] focus:bg-white focus:ring-2 focus:ring-black/10 outline-none transition-all duration-200 resize-none leading-relaxed placeholder:text-neutral-400/70 shadow-sm hover:border-neutral-300 custom-scrollbar`}
                />
                {onMagicAction && (
                    <button 
                        type="button"
                        onClick={onMagicAction}
                        className="absolute right-3 top-3 w-7 h-7 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-all shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="AI Magic Suggestion"
                    >
                        <RiMagicLine size={13} />
                    </button>
                )}
            </div>
        </div>
    );
}
