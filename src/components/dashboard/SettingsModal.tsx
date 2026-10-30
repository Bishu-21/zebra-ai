"use client";

import React, { useState } from "react";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { useSettings } from "@/context/SettingsContext";
import {
    RiCloseLine,
    RiEqualizerLine,
    RiFileTextLine,
    RiUser3Line,
    RiArrowDownSLine,
    RiArrowRightLine,
} from "react-icons/ri";
import { AppIcon } from "@/components/ui/AppIcon";
import { featureChrome } from "@/components/dashboard/feature-chrome";
import { useDialogFocus } from "@/hooks/useDialogFocus";

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
    { id: "editor", label: "Editor and preview", description: "Font, wrapping, and zoom", icon: RiFileTextLine },
    { id: "account", label: "Reset", description: "Restore defaults or open full settings", icon: RiUser3Line },
];

const PERSIST_ERROR = "Could not save preferences on this device.";

export function SettingsModal({ isOpen, onCloseAction }: SettingsModalProps) {
    const { settings, updateSettingsAction, resetSettingsAction } = useSettings();
    const [activeTab, setActiveTab] = useState<TabType>("general");
    const [savedNotice, setSavedNotice] = useState<string | null>(null);
    const [noticeIsError, setNoticeIsError] = useState(false);
    const dialogRef = useDialogFocus<HTMLDivElement>(isOpen, onCloseAction);

    const triggerNotice = (ok: boolean, success: string) => {
        setNoticeIsError(!ok);
        setSavedNotice(ok ? success : PERSIST_ERROR);
        window.setTimeout(() => setSavedNotice(null), 2500);
    };

    const persist = (patch: Parameters<typeof updateSettingsAction>[0], success: string) => {
        triggerNotice(updateSettingsAction(patch), success);
    };

    const activeTabMeta = TABS.find((t) => t.id === activeTab) || TABS[0];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center p-3 sm:items-center sm:p-6">
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={featureChrome.backdrop}
                        onClick={onCloseAction}
                    />

                    <m.div
                        ref={dialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="settings-panel-title"
                        initial={{ scale: 0.98, opacity: 0, y: 12 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.98, opacity: 0, y: 12 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={`${featureChrome.dialog} z-10 max-w-3xl md:flex-row`}
                    >
                        <div className="flex w-full shrink-0 flex-col border-b border-neutral-200/70 bg-neutral-50 p-3 md:w-56 md:border-b-0 md:border-r">
                            <div className="mb-3 px-2">
                                <h2 id="settings-panel-title" className="text-sm font-semibold tracking-tight text-foreground">
                                    Preferences
                                </h2>
                                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                                    Saved on this device.
                                </p>
                            </div>
                            <nav
                                className="no-scrollbar flex gap-2 overflow-x-auto scroll-smooth md:block md:space-y-1.5"
                                aria-label="Preference sections"
                                role="tablist"
                            >
                                {TABS.map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            id={`settings-panel-tab-${tab.id}`}
                                            role="tab"
                                            aria-selected={isActive}
                                            aria-controls={`settings-panel-section-${tab.id}`}
                                            tabIndex={isActive ? 0 : -1}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex min-h-11 w-auto shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black md:w-full ${
                                                isActive
                                                    ? "bg-[#0A0A0A] text-white shadow-2xs"
                                                    : "text-neutral-600 hover:bg-neutral-200/60 hover:text-[#0A0A0A]"
                                            }`}
                                        >
                                            <Icon size={16} className={isActive ? "text-white" : "text-neutral-400"} />
                                            <span>{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
                            <div className={featureChrome.dialogHeader}>
                                <div className="min-w-0">
                                    <h3 className="text-base font-semibold tracking-tight text-foreground">{activeTabMeta.label}</h3>
                                    <p className="mt-0.5 text-sm leading-6 text-muted-foreground">{activeTabMeta.description}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={onCloseAction}
                                    className={featureChrome.iconButton}
                                    aria-label="Close settings"
                                >
                                    <AppIcon icon={RiCloseLine} size={18} />
                                </button>
                            </div>

                            <div
                                id={`settings-panel-section-${activeTab}`}
                                role="tabpanel"
                                aria-labelledby={`settings-panel-tab-${activeTab}`}
                                className={`${featureChrome.dialogBody} space-y-4`}
                            >
                                {savedNotice && (
                                    <div
                                        role="status"
                                        aria-live="polite"
                                        className={`rounded-xl border p-3 text-xs font-semibold ${
                                            noticeIsError
                                                ? "border-red-200 bg-red-50 text-red-800"
                                                : "border-neutral-200/60 bg-neutral-100 text-neutral-600"
                                        }`}
                                    >
                                        {savedNotice}
                                    </div>
                                )}

                                {activeTab === "general" && (
                                    <div className="space-y-4">
                                        <SettingRow
                                            title="Editor font size"
                                            description="Text size used in input fields and editors."
                                            control={
                                                <Select
                                                    options={["12px", "14px", "16px", "18px", "20px"]}
                                                    value={settings.fontSize}
                                                    onChange={(v) => persist({ fontSize: v }, "Font size saved")}
                                                />
                                            }
                                        />
                                        <Divider />
                                        <SettingToggle
                                            title="Auto-save"
                                            description="Automatically save resume drafts as you type."
                                            checked={settings.autoSave}
                                            onChange={(v) => persist({ autoSave: v }, v ? "Auto-save enabled" : "Auto-save disabled")}
                                        />
                                        <Divider />
                                        <SettingToggle
                                            title="Compact mode"
                                            description="Reduce padding in editor forms."
                                            checked={settings.compactView}
                                            onChange={(v) => persist({ compactView: v }, "Compact mode saved")}
                                        />
                                        <Divider />
                                        <SettingToggle
                                            title="Spellcheck"
                                            description="Use the browser spellchecker in input areas."
                                            checked={settings.spellcheck}
                                            onChange={(v) => persist({ spellcheck: v }, "Spellcheck saved")}
                                        />
                                    </div>
                                )}

                                {activeTab === "editor" && (
                                    <div className="space-y-4">
                                        <SettingRow
                                            title="Default resume font"
                                            description="Primary font for resume previews and PDF export."
                                            control={
                                                <Select
                                                    options={["Latin Modern Roman", "Computer Modern", "Helvetica", "Georgia", "TeX Gyre Pagella"]}
                                                    value={settings.resumeFont}
                                                    onChange={(v) => persist({ resumeFont: v }, "Default font saved")}
                                                />
                                            }
                                        />
                                        <Divider />
                                        <SettingToggle
                                            title="Line wrapping"
                                            description="Wrap long text lines inside input areas."
                                            checked={settings.lineWrapping}
                                            onChange={(v) => persist({ lineWrapping: v }, "Line wrapping saved")}
                                        />
                                        <Divider />
                                        <SettingRow
                                            title="Preview scale"
                                            description="Default zoom for the live resume preview."
                                            control={
                                                <Select
                                                    options={["Auto", "100%", "85%", "75%"]}
                                                    value={settings.previewScale === "auto" ? "Auto" : `${Math.round((settings.previewScale as number) * 100)}%`}
                                                    onChange={(v) => {
                                                        const scale = v === "Auto" ? "auto" : parseInt(v, 10) / 100;
                                                        persist({ previewScale: scale }, "Preview scale saved");
                                                    }}
                                                />
                                            }
                                        />
                                    </div>
                                )}

                                {activeTab === "account" && (
                                    <div className="space-y-4">
                                        <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200/80 bg-neutral-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="min-w-0">
                                                <h4 className="text-sm font-semibold text-foreground">Reset preferences</h4>
                                                <p className="mt-0.5 text-sm leading-6 text-muted-foreground">
                                                    Restore editor and preview settings to their defaults.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => triggerNotice(resetSettingsAction(), "Preferences reset to defaults")}
                                                className={`${featureChrome.secondaryButton} shrink-0`}
                                            >
                                                Reset defaults
                                            </button>
                                        </div>
                                        <Link
                                            href="/dashboard/settings"
                                            onClick={onCloseAction}
                                            className={`${featureChrome.secondaryButton} w-full sm:w-auto`}
                                        >
                                            <span>Open full settings</span>
                                            <AppIcon icon={RiArrowRightLine} size={16} />
                                        </Link>
                                    </div>
                                )}
                            </div>

                            <div className={featureChrome.dialogFooter}>
                                <span className={`text-xs leading-5 ${noticeIsError && savedNotice ? "font-medium text-red-700" : "text-muted-foreground"}`}>
                                    {savedNotice || "Changes are saved on this device when the browser allows it."}
                                </span>
                                <button
                                    type="button"
                                    onClick={onCloseAction}
                                    className={featureChrome.primaryButton}
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </m.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function SettingRow({ title, description, control }: { title: string; description: string; control: React.ReactNode }) {
    return (
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-6">
            <div className="max-w-md space-y-0.5">
                <h4 className="text-sm font-semibold text-foreground">{title}</h4>
                <p className="text-sm font-normal leading-6 text-muted-foreground">{description}</p>
            </div>
            <div className="shrink-0">{control}</div>
        </div>
    );
}

function SettingToggle({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            className="group flex min-h-11 w-full cursor-pointer items-center justify-between gap-4 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
            onClick={() => onChange(!checked)}
        >
            <div className="min-w-0 space-y-0.5 pr-4">
                <h4 className="text-sm font-semibold text-foreground">{title}</h4>
                <p className="text-sm font-normal leading-6 text-muted-foreground">{description}</p>
            </div>
            <span
                aria-hidden="true"
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${checked ? "bg-[#0A0A0A]" : "bg-neutral-200"}`}
            >
                <span className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow-2xs transition-transform duration-200 ${checked ? "translate-x-5" : ""}`} />
            </span>
        </button>
    );
}

function Select({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
    return (
        <div className="relative inline-block w-full sm:w-auto">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`${featureChrome.select} w-full pr-9 sm:w-auto`}
            >
                {options.map((opt) => (
                    <option key={opt} value={opt}>
                        {opt}
                    </option>
                ))}
            </select>
            <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400">
                <RiArrowDownSLine size={16} />
            </div>
        </div>
    );
}

function Divider() {
    return <div className="h-px w-full bg-neutral-200/60" />;
}
