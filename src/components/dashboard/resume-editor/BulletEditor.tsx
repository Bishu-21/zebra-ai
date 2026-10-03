"use client";

import { useSettings } from "@/context/SettingsContext";
import { RiAddLine,RiMagicLine } from "react-icons/ri";

export function BulletEditor({ highlights, onUpdate, getAiSuggestions }: { highlights: string[]; onUpdate: (nh: string[]) => void; getAiSuggestions: (idx: number, text: string) => void }) {
    const { settings } = useSettings();
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-muted-foreground tracking-wide uppercase">Highlights</label>
            {highlights.map((h, idx) => (
                <div key={idx} className="flex gap-2 items-start group/bullet">
                    <span className="text-muted-foreground/60 text-xs mt-2 shrink-0">•</span>
                    <div className="flex-grow relative">
                        <textarea
                            value={h}
                            wrap={settings.lineWrapping ? "soft" : "off"}
                            spellCheck={settings.spellcheck}
                            style={{
                                fontSize: settings.fontSize,
                                whiteSpace: settings.lineWrapping ? "pre-wrap" : "pre",
                                overflowX: settings.lineWrapping ? "hidden" : "auto"
                            }}
                            onChange={(e) => { const nh = [...highlights]; nh[idx] = e.target.value; onUpdate(nh); }}
                            placeholder="Quantify your impact..."
                            className={`w-full ${settings.compactView ? 'min-h-[28px]' : 'min-h-[36px]'} pr-8 bg-muted rounded-[var(--radius-md)] p-2 text-foreground border border-border-subtle focus:border-primary outline-none resize-none placeholder:text-foreground/20 custom-scrollbar`}
                        />
                        <button
                            onClick={() => getAiSuggestions(idx, h)}
                            className="absolute right-1.5 top-1.5 w-6 h-6 rounded-[var(--radius-sm)] flex items-center justify-center text-primary hover:bg-background shadow-sm opacity-0 group-hover/bullet:opacity-100 transition-all border border-border-subtle"
                        >
                            <RiMagicLine size={10} />
                        </button>
                    </div>
                </div>
            ))}
            <button onClick={() => onUpdate([...highlights, ""])} className="text-[10px] font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 ml-4"><RiAddLine size={10} /> Add bullet</button>
        </div>
    );
}
