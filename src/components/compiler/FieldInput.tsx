import React from "react";
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
    return (
        <div className={settings.compactView ? "space-y-0.5" : "space-y-1"}>
            <label className="text-[10px] font-bold text-[#737373] tracking-wide uppercase opacity-70">{label}</label>
            <div className="relative group">
                <input 
                    name={name}
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    style={{ fontSize: settings.fontSize }}
                    spellCheck={settings.spellcheck}
                    className={`w-full ${settings.compactView ? 'h-8' : 'h-10'} bg-[#F5F5F5] rounded-lg px-3 pr-10 text-[#0A0A0A] font-bold border border-[#E5E5E5] focus:border-[#3B82F6] focus:bg-white outline-none transition-all placeholder:text-black/20`}
                />
                {onMagicAction && (
                    <button 
                        onClick={onMagicAction}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md bg-white/50 border border-black/5 flex items-center justify-center text-[#3B82F6] hover:bg-[#3B82F6] hover:text-white transition-all shadow-sm opacity-0 group-hover:opacity-100"
                    >
                        <RiMagicLine size={12} />
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
    return (
        <div className={settings.compactView ? "space-y-0.5" : "space-y-1"}>
            <label className="text-[10px] font-bold text-[#737373] tracking-wide uppercase opacity-70">{label}</label>
            <div className="relative group">
                <textarea 
                    name={name}
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
                    className={`w-full bg-[#F5F5F5] rounded-xl ${settings.compactView ? 'p-2' : 'p-3'} pr-10 text-[#0A0A0A] font-bold border border-[#E5E5E5] focus:border-[#3B82F6] focus:bg-white outline-none transition-all resize-none leading-relaxed placeholder:text-black/20 custom-scrollbar`}
                />
                {onMagicAction && (
                    <button 
                        onClick={onMagicAction}
                        className="absolute right-3 top-3 w-7 h-7 rounded-lg bg-white/80 border border-black/10 flex items-center justify-center text-[#3B82F6] hover:bg-[#3B82F6] hover:text-white transition-all shadow-md opacity-0 group-hover:opacity-100"
                    >
                        <RiMagicLine size={14} />
                    </button>
                )}
            </div>
        </div>
    );
}
