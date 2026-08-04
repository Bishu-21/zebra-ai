"use client";

import React, { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { useSettings } from "@/context/SettingsContext";
import { 
    RiCloseLine, 
    RiSettings4Line, 
    RiEqualizerLine,
    RiFileTextLine,
    RiUser3Line,
    RiArrowDownSLine
} from "react-icons/ri";

interface SettingsModalProps {
    isOpen: boolean;
    onCloseAction: () => void;
}

type TabType = "general" | "editor" | "account";

interface TabItem {
    id: TabType;
    label: string;
    description: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
}

const TABS: TabItem[] = [
    { id: "general", label: "General", description: "Editor preferences and defaults", icon: RiEqualizerLine },
    { id: "editor", label: "Editor & Preview", description: "Font selection, zoom and display controls", icon: RiFileTextLine },
    { id: "account", label: "Account", description: "Subscription and preferences reset", icon: RiUser3Line },
];

export function SettingsModal({ isOpen, onCloseAction }: SettingsModalProps) {
    const { settings, updateSettingsAction, resetSettingsAction } = useSettings();
    const [activeTab, setActiveTab] = useState<TabType>("general");
    const [savedNotice, setSavedNotice] = useState<string | null>(null);

    if (!isOpen) return null;

    const triggerNotice = (msg: string) => {
        setSavedNotice(msg);
        setTimeout(() => setSavedNotice(null), 2500);
    };

    const activeTabMeta = TABS.find(t => t.id === activeTab) || TABS[0];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 md:p-8">
                {/* Backdrop */}
                <m.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/40 backdrop-blur-md"
                    onClick={onCloseAction}
                />
                
                {/* Modal Container */}
                <m.div 
                    initial={{ scale: 0.96, opacity: 0, y: 12 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.96, opacity: 0, y: 12 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="relative bg-white w-full max-w-3xl h-[80vh] max-h-[580px] rounded-3xl shadow-2xl border border-neutral-200/80 flex flex-col md:flex-row overflow-hidden z-10"
                >
                    {/* LEFT SIDEBAR MENU */}
                    <div className="w-full md:w-56 bg-[#FAF9F6] border-b md:border-b-0 md:border-r border-neutral-200/70 p-4 sm:p-5 flex flex-col shrink-0 justify-between">
                        <div className="space-y-4">
                            {/* Sidebar Header */}
                            <div className="flex items-center gap-3 px-2 py-1.5 border-b border-neutral-200/60 pb-3">
                                <div className="w-8 h-8 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center shadow-2xs shrink-0">
                                    <RiSettings4Line size={16} />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-sm font-bold tracking-tight text-[#0A0A0A]">Settings</h2>
                                </div>
                            </div>

                            {/* Sidebar Menu Items */}
                            <nav className="space-y-1">
                                {TABS.map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left group ${
                                                isActive 
                                                    ? "bg-[#0A0A0A] text-white shadow-2xs" 
                                                    : "text-neutral-600 hover:text-[#0A0A0A] hover:bg-neutral-200/50"
                                            }`}
                                        >
                                            <Icon size={16} className={isActive ? "text-white" : "text-neutral-400 group-hover:text-[#0A0A0A] transition-colors"} />
                                            <span>{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>

                    {/* RIGHT CONTENT AREA */}
                    <div className="flex-grow flex flex-col bg-white overflow-hidden min-w-0">
                        {/* Header Bar */}
                        <div className="px-6 py-4 border-b border-neutral-200/60 flex items-center justify-between bg-white shrink-0">
                            <div>
                                <h3 className="text-base font-bold text-[#0A0A0A] tracking-tight">{activeTabMeta.label}</h3>
                                <p className="text-xs font-normal text-neutral-500">{activeTabMeta.description}</p>
                            </div>
                            <button 
                                onClick={onCloseAction}
                                className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-[#0A0A0A] flex items-center justify-center transition-all"
                            >
                                <RiCloseLine size={18} />
                            </button>
                        </div>

                        {/* Content Scroll Area */}
                        <div className="flex-grow overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">
                            {activeTab === "general" && (
                                <div className="space-y-6">
                                    <SettingRow 
                                        title="Editor Font Size"
                                        description="Text size used in input fields and text editors."
                                        control={
                                            <Select 
                                                options={["12px", "14px", "16px", "18px", "20px"]} 
                                                value={settings.fontSize} 
                                                onChange={(v) => {
                                                    updateSettingsAction({ fontSize: v });
                                                    triggerNotice("Font size updated");
                                                }} 
                                            />
                                        }
                                    />
                                    
                                    <Divider />

                                    <SettingToggle 
                                        title="Auto-Save"
                                        description="Automatically save changes as you type."
                                        checked={settings.autoSave}
                                        onChange={(v) => {
                                            updateSettingsAction({ autoSave: v });
                                            triggerNotice(v ? "Auto-save enabled" : "Auto-save disabled");
                                        }}
                                    />

                                    <Divider />

                                    <SettingToggle 
                                        title="Compact Mode"
                                        description="Reduce padding for tighter spacing in editor forms."
                                        checked={settings.compactView}
                                        onChange={(v) => {
                                            updateSettingsAction({ compactView: v });
                                            triggerNotice("Compact mode updated");
                                        }}
                                    />

                                    <Divider />

                                    <SettingToggle 
                                        title="Spellcheck"
                                        description="Enable spellchecking in input areas."
                                        checked={settings.spellcheck}
                                        onChange={(v) => {
                                            updateSettingsAction({ spellcheck: v });
                                            triggerNotice("Spellcheck updated");
                                        }}
                                    />
                                </div>
                            )}

                            {activeTab === "editor" && (
                                <div className="space-y-6">
                                    <SettingRow 
                                        title="Default Resume Font"
                                        description="Primary font family used for resume previews and PDF generation."
                                        control={
                                            <Select 
                                                options={["Latin Modern Roman", "Computer Modern", "Helvetica", "Georgia", "TeX Gyre Pagella"]} 
                                                value={settings.resumeFont} 
                                                onChange={(v) => {
                                                    updateSettingsAction({ resumeFont: v });
                                                    triggerNotice("Default font updated");
                                                }} 
                                            />
                                        }
                                    />

                                    <Divider />

                                    <SettingToggle 
                                        title="Line Wrapping"
                                        description="Wrap long text lines inside input areas."
                                        checked={settings.lineWrapping}
                                        onChange={(v) => {
                                            updateSettingsAction({ lineWrapping: v });
                                            triggerNotice("Line wrapping updated");
                                        }}
                                    />

                                    <Divider />

                                    <SettingRow 
                                        title="Preview Scale"
                                        description="Default zoom level for the live resume preview pane."
                                        control={
                                            <Select 
                                                options={["Auto", "100%", "85%", "75%"]} 
                                                value={settings.previewScale === "auto" ? "Auto" : `${Math.round((settings.previewScale as number) * 100)}%`} 
                                                onChange={(v) => {
                                                    const scale = v === "Auto" ? "auto" : parseInt(v) / 100;
                                                    updateSettingsAction({ previewScale: scale });
                                                    triggerNotice("Preview scale updated");
                                                }} 
                                            />
                                        }
                                    />
                                </div>
                            )}

                            {activeTab === "account" && (
                                <div className="space-y-6">
                                    <div className="p-4 bg-neutral-50 border border-neutral-200/80 rounded-2xl flex items-center justify-between">
                                        <div>
                                            <h4 className="text-xs font-bold text-[#0A0A0A]">Reset Preferences</h4>
                                            <p className="text-xs text-neutral-500">Restore all settings back to default values.</p>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                resetSettingsAction();
                                                triggerNotice("Settings reset to defaults");
                                            }}
                                            className="px-4 py-2 bg-white border border-neutral-200 text-[#0A0A0A] hover:bg-neutral-100 rounded-full text-xs font-bold transition-all shadow-2xs shrink-0"
                                        >
                                            Reset Defaults
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Bar */}
                        <div className="px-6 py-4 border-t border-neutral-200/60 flex items-center justify-between bg-white shrink-0 gap-3">
                            <span className="text-xs font-medium text-neutral-400">
                                {savedNotice || "Changes saved automatically"}
                            </span>

                            <button 
                                onClick={onCloseAction}
                                className="px-6 py-2 bg-[#0A0A0A] text-white rounded-full text-xs font-bold shadow-2xs hover:bg-neutral-800 active:scale-95 transition-all"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </m.div>
            </div>
        </AnimatePresence>
    );
}

function SettingRow({ title, description, control }: { title: string; description: string; control: React.ReactNode }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6">
            <div className="space-y-0.5 max-w-md">
                <h4 className="text-xs font-bold text-[#0A0A0A]">{title}</h4>
                <p className="text-xs font-normal text-neutral-500 leading-relaxed">{description}</p>
            </div>
            <div className="shrink-0">
                {control}
            </div>
        </div>
    );
}

function SettingToggle({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <div 
            className="flex items-center justify-between gap-4 cursor-pointer group"
            onClick={() => onChange(!checked)}
        >
            <div className="space-y-0.5 pr-4">
                <h4 className="text-xs font-bold text-[#0A0A0A] group-hover:text-neutral-700 transition-colors">{title}</h4>
                <p className="text-xs font-normal text-neutral-500 leading-relaxed">{description}</p>
            </div>
            <button className={`shrink-0 relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? "bg-[#0A0A0A]" : "bg-neutral-200"}`}>
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 shadow-2xs ${checked ? "translate-x-5" : ""}`} />
            </button>
        </div>
    );
}

function Select({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
    return (
        <div className="relative inline-block w-full sm:w-auto">
            <select 
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full sm:w-auto bg-neutral-50 border border-neutral-200/80 focus:bg-white focus:border-[#0A0A0A] rounded-full px-4 py-2 pr-9 text-xs font-semibold text-[#0A0A0A] outline-none transition-all appearance-none cursor-pointer"
            >
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                <RiArrowDownSLine size={16} />
            </div>
        </div>
    );
}

function Divider() {
    return <div className="h-px bg-neutral-200/60 w-full" />;
}
