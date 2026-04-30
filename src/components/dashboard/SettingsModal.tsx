import React from "react";
import { m, AnimatePresence } from "framer-motion";
import { useSettings } from "@/context/SettingsContext";
import { 
    RiCloseLine, 
    RiSettings4Line, 
    RiArrowRightSLine,
    RiFontSize,
} from "react-icons/ri";

interface SettingsModalProps {
    isOpen: boolean;
    onCloseAction: () => void;
}

export function SettingsModal({ isOpen, onCloseAction }: SettingsModalProps) {
    const { settings, updateSettingsAction } = useSettings();

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
                <m.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
                    onClick={onCloseAction}
                />
                
                <m.div 
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative bg-[var(--background)] w-full max-w-2xl h-auto max-h-[85vh] rounded-[var(--radius-xl)] shadow-2xl border border-[var(--border-subtle)] flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex p-6 md:p-8 border-b border-[var(--border-subtle)] items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[var(--primary)]/10 rounded-[var(--radius-md)] flex items-center justify-center text-[var(--primary)] shrink-0">
                                <RiSettings4Line size={24} />
                            </div>
                            <h2 className="text-xl font-bold tracking-tight text-[var(--secondary)]">Editor Settings</h2>
                        </div>
                        <button 
                            onClick={onCloseAction}
                            className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--secondary)] transition-all"
                        >
                            <RiCloseLine size={24} />
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-grow overflow-y-auto p-6 md:p-10 custom-scrollbar">
                        <div className="space-y-8 md:space-y-10">
                            <SettingItem 
                                icon={RiFontSize}
                                title="Editor Font Size" 
                                description="Adjust the size of text in the resume editor for comfortable writing."
                                control={<Select options={["12px", "14px", "16px", "18px", "20px"]} value={settings.fontSize} onChange={(v) => updateSettingsAction({ fontSize: v })} />}
                            />
                            
                            <div className="h-px bg-[var(--border-subtle)]" />

                            <div className="space-y-6 md:space-y-8">
                                <SettingToggle 
                                    title="Auto-Save Cloud Sync" 
                                    description="Automatically persist changes to the cloud as you type." 
                                    checked={settings.autoSave}
                                    onChange={(v: boolean) => updateSettingsAction({ autoSave: v })}
                                />
                                <SettingToggle 
                                    title="Enable Spellcheck" 
                                    description="Toggle native browser spellcheck in all editor fields." 
                                    checked={settings.spellcheck}
                                    onChange={(v: boolean) => updateSettingsAction({ spellcheck: v })}
                                />
                                <SettingToggle 
                                    title="Compact Interface" 
                                    description="Optimize the layout for maximum visibility by reducing vertical spacing." 
                                    checked={settings.compactView}
                                    onChange={(v: boolean) => updateSettingsAction({ compactView: v })}
                                />
                                <SettingToggle 
                                    title="Line Wrapping" 
                                    description="Allow long lines of text to wrap to the next line in the editor." 
                                    checked={settings.lineWrapping}
                                    onChange={(v: boolean) => updateSettingsAction({ lineWrapping: v })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-[var(--background)] border-t border-[var(--border-subtle)] flex justify-end">
                        <button 
                            onClick={onCloseAction}
                            className="px-6 py-2 bg-[var(--foreground)] text-[var(--background)] text-sm font-bold rounded-[var(--radius-md)] hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-foreground/10"
                        >
                            Done
                        </button>
                    </div>
                </m.div>
            </div>
        </AnimatePresence>
    );
}

function SettingItem({ title, description, control, icon: Icon }: { title: string; description: string; control: React.ReactNode; icon?: React.ComponentType<{ size?: number }> }) {
    return (
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 md:gap-10">
            <div className="flex gap-3 md:gap-4">
                {Icon && (
                    <div className="mt-1 text-muted-foreground/20 shrink-0">
                        <Icon size={20} />
                    </div>
                )}
                <div className="space-y-1">
                    <h4 className="text-sm font-black text-[var(--secondary)]">{title}</h4>
                    <p className="text-[0.8rem] text-[var(--muted-foreground)] leading-relaxed font-medium">{description}</p>
                </div>
            </div>
            <div className="flex-shrink-0 w-full md:w-auto">
                {control}
            </div>
        </div>
    );
}

function SettingToggle({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <div 
            className="flex items-center justify-between gap-4 md:gap-10 cursor-pointer group"
            onClick={() => onChange(!checked)}
        >
            <div className="space-y-1 pr-4">
                <h4 className="text-sm font-black text-[var(--secondary)] group-hover:text-[var(--primary)] transition-colors">{title}</h4>
                <p className="text-[0.8rem] text-[var(--muted-foreground)] leading-relaxed font-medium">{description}</p>
            </div>
            <button className={`shrink-0 relative w-12 h-6 rounded-full transition-all duration-300 ${checked ? "bg-[var(--primary)]" : "bg-muted"}`}>
                <div className={`absolute top-1 left-1 w-4 h-4 bg-background rounded-full transition-all duration-300 ${checked ? "translate-x-6" : ""}`} />
            </button>
        </div>
    );
}

function Select({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
    return (
        <div className="relative w-full md:w-auto">
            <select 
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-muted border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-4 py-2 text-sm font-black outline-none appearance-none pr-10 hover:bg-muted/80 transition-all cursor-pointer text-[var(--secondary)]"
            >
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/40">
                <RiArrowRightSLine className="rotate-90" />
            </div>
        </div>
    );
}
