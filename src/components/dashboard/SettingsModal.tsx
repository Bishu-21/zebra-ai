import React, { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { useSettings } from "@/context/SettingsContext";
import { 
    RiCloseLine, 
    RiSettings4Line, 
    RiCodeSSlashLine, 
    RiFilePdfLine, 
    RiArrowRightSLine,
    RiFontSize,
    RiTranslate2,
    RiMagicLine,
    RiLayout4Line
} from "react-icons/ri";

interface SettingsModalProps {
    isOpen: boolean;
    onCloseAction: () => void;
}

type SettingsSection = "General" | "Display";

export function SettingsModal({ isOpen, onCloseAction }: SettingsModalProps) {
    const [activeSection, setActiveSection] = useState<SettingsSection>("General");
    const { settings, updateSettingsAction } = useSettings();

    const sections: { id: SettingsSection; icon: any }[] = [
        { id: "General", icon: RiCodeSSlashLine },
        { id: "Display", icon: RiFilePdfLine },
    ];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
                <m.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onCloseAction}
                />
                
                <m.div 
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative bg-white w-full max-w-4xl h-[70vh] rounded-[2.5rem] shadow-2xl border border-black/5 flex overflow-hidden"
                >
                    {/* Settings Sidebar */}
                    <div className="w-[240px] bg-[#FAFAFA] border-r border-[#F5F5F5] flex flex-col p-8">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-10 h-10 bg-[#3B82F6]/10 rounded-xl flex items-center justify-center text-[#3B82F6]">
                                <RiSettings4Line size={24} />
                            </div>
                            <h2 className="text-xl font-bold tracking-tight text-[#171717]">Settings</h2>
                        </div>

                        <div className="space-y-2 flex-grow">
                            {sections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                                        activeSection === section.id 
                                            ? "bg-white border border-black/5 shadow-sm text-[#3B82F6]" 
                                            : "text-[#737373] hover:text-[#171717] hover:bg-black/5"
                                    }`}
                                >
                                    <section.icon size={20} className={activeSection === section.id ? "text-[#3B82F6]" : "text-[#A3A3A3]"} />
                                    {section.id}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-grow flex flex-col min-w-0 bg-white">
                        <div className="p-8 border-b border-[#F5F5F5] flex items-center justify-between">
                            <h3 className="text-lg font-bold text-[#171717]">{activeSection} Preferences</h3>
                            <button 
                                onClick={onCloseAction}
                                className="w-10 h-10 rounded-full hover:bg-black/5 flex items-center justify-center text-[#A3A3A3] hover:text-[#171717] transition-all"
                            >
                                <RiCloseLine size={24} />
                            </button>
                        </div>

                        <div className="flex-grow overflow-y-auto p-10 custom-scrollbar">
                            <div className="max-w-2xl mx-auto space-y-10">
                                {activeSection === "General" && (
                                    <>
                                        <SettingItem 
                                            icon={RiTranslate2}
                                            title="Interface Language" 
                                            description="Choose the language for the Zebra AI dashboard and tools."
                                            control={<Select options={["English (US)", "English (UK)", "Hindi", "Bengali"]} value={settings.interfaceLanguage} onChange={(v) => updateSettingsAction({ interfaceLanguage: v })} />}
                                        />
                                        <SettingItem 
                                            icon={RiFontSize}
                                            title="Editor Font Size" 
                                            description="Adjust the size of text in the resume editor for comfortable writing."
                                            control={<Select options={["12px", "14px", "16px", "18px", "20px"]} value={settings.fontSize} onChange={(v) => updateSettingsAction({ fontSize: v })} />}
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
                                    </>
                                )}

                                {activeSection === "Display" && (
                                    <>
                                        <SettingItem 
                                            icon={RiLayout4Line}
                                            title="PDF Preview Theme" 
                                            description="Switch between light and high-contrast dark themes for the document viewer."
                                            control={<Select options={["light", "dark"]} value={settings.pdfTheme} onChange={(v) => updateSettingsAction({ pdfTheme: v as any })} />}
                                        />
                                        <SettingToggle 
                                            title="Auto-Save Cloud Sync" 
                                            description="Automatically persist changes to the cloud as you type." 
                                            checked={settings.autoSave}
                                            onChange={(v: boolean) => updateSettingsAction({ autoSave: v })}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </m.div>
            </div>
        </AnimatePresence>
    );
}

function SettingItem({ title, description, control, icon: Icon }: any) {
    return (
        <div className="flex items-start justify-between gap-10">
            <div className="flex gap-4">
                {Icon && (
                    <div className="mt-1 text-black/20">
                        <Icon size={20} />
                    </div>
                )}
                <div className="space-y-1">
                    <h4 className="text-sm font-black text-[#171717]">{title}</h4>
                    <p className="text-[0.8rem] text-[#737373] leading-relaxed font-medium">{description}</p>
                </div>
            </div>
            <div className="flex-shrink-0">
                {control}
            </div>
        </div>
    );
}

function SettingToggle({ title, description, checked, onChange }: any) {
    return (
        <div 
            className="flex items-start justify-between gap-10 cursor-pointer group"
            onClick={() => onChange(!checked)}
        >
            <div className="space-y-1">
                <h4 className="text-sm font-black text-[#171717] group-hover:text-[#3B82F6] transition-colors">{title}</h4>
                <p className="text-[0.8rem] text-[#737373] leading-relaxed font-medium">{description}</p>
            </div>
            <button className={`relative w-12 h-6 rounded-full transition-all duration-300 ${checked ? "bg-[#3B82F6]" : "bg-black/10"}`}>
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${checked ? "translate-x-6" : ""}`} />
            </button>
        </div>
    );
}

function Select({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
    return (
        <div className="relative">
            <select 
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="bg-black/5 border border-black/5 rounded-xl px-4 py-2 text-sm font-black outline-none appearance-none pr-10 hover:bg-black/10 transition-all cursor-pointer text-[#171717]"
            >
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#A3A3A3]">
                <RiArrowRightSLine className="rotate-90" />
            </div>
        </div>
    );
}
