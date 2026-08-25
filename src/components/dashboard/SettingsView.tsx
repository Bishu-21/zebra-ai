"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSettings } from "@/context/SettingsContext";
import { useSession, authClient } from "@/lib/auth-client";
import { useToast } from "@/components/ui/Toast";
import { 
    RiEqualizerLine, 
    RiFileTextLine, 
    RiUser3Line, 
    RiMoneyDollarCircleLine,
    RiArrowDownSLine,
    RiMailLine,
    RiFlashlightLine,
    RiBriefcaseLine
} from "react-icons/ri";
import { CareerProfileForm } from "./CareerProfileForm";

type TabType = "general" | "editor" | "career" | "billing" | "account";

interface TabItem {
    id: TabType;
    label: string;
    description: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
}

const TABS: TabItem[] = [
    { id: "general", label: "General", description: "Editor preferences and defaults", icon: RiEqualizerLine },
    { id: "editor", label: "Editor & Preview", description: "Font selection, zoom and preview controls", icon: RiFileTextLine },
    { id: "career", label: "Career Profile", description: "Career stage used for personalized scoring", icon: RiBriefcaseLine },
    { id: "billing", label: "Billing & Credits", description: "Credit pack balances and plan tier", icon: RiMoneyDollarCircleLine },
    { id: "account", label: "Account & Security", description: "Profile details and security preferences", icon: RiUser3Line },
];

export function SettingsView() {
    const searchParams = useSearchParams();
    const { settings, updateSettingsAction, resetSettingsAction } = useSettings();
    const { data: session } = useSession();
    const { showToast } = useToast();

    const initialTab = (searchParams.get("tab") as TabType) || "general";
    const [activeTab, setActiveTab] = useState<TabType>(
        TABS.some(t => t.id === initialTab) ? initialTab : "general"
    );
    const [savedNotice, setSavedNotice] = useState<string | null>(null);

    useEffect(() => {
        const tab = searchParams.get("tab") as TabType;
        if (tab && TABS.some(t => t.id === tab) && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [searchParams, activeTab]);

    const handleTabChange = (tabId: TabType, trigger?: HTMLButtonElement) => {
        setActiveTab(tabId);
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", tabId);
        window.history.replaceState(null, "", `/dashboard/settings?${params.toString()}`);
        trigger?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    };

    const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
        const lastIndex = TABS.length - 1;
        let nextIndex: number | null = null;

        if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = index === lastIndex ? 0 : index + 1;
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = index === 0 ? lastIndex : index - 1;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = lastIndex;
        if (nextIndex === null) return;

        event.preventDefault();
        const nextTab = document.getElementById(`settings-tab-${TABS[nextIndex].id}`) as HTMLButtonElement | null;
        nextTab?.focus();
        nextTab?.click();
    };

    const triggerNotice = (msg: string) => {
        setSavedNotice(msg);
        setTimeout(() => setSavedNotice(null), 2500);
    };

    const handleResetPassword = async () => {
        if (!session?.user?.email) {
            showToast("No email associated with account", "error");
            return;
        }
        try {
            const { error } = await authClient.requestPasswordReset({
                email: session.user.email,
                redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/signin`,
            });
            if (error) throw new Error(error.message);
            showToast("Password reset link sent to your email", "success");
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to send reset link", "error");
        }
    };

    const handleOpenCredits = () => {
        window.dispatchEvent(new CustomEvent("open-credits"));
    };

    const activeTabMeta = TABS.find(t => t.id === activeTab) || TABS[0];
    const user = session?.user as { plan?: string | null; credits?: number | null; email?: string | null; name?: string | null } | undefined;

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 pb-32">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#0A0A0A] mb-1">
                    Settings
                </h1>
                <p className="text-xs font-normal text-neutral-500 leading-relaxed">
                    Configure your workspace, editor ergonomics, billing, and account preferences.
                </p>
            </div>

            {/* Main Settings Container */}
            <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs flex flex-col md:flex-row overflow-visible md:overflow-hidden min-h-[500px]">
                {/* Left Tab Navigation */}
                <div className="sticky top-0 z-20 w-full md:static md:w-64 bg-[#FAF9F6] border-b md:border-b-0 md:border-r border-neutral-200/70 p-2.5 md:p-5 shrink-0">
                    <nav
                        className="no-scrollbar flex gap-2 overflow-x-auto scroll-smooth md:block md:space-y-1.5"
                        aria-label="Settings sections"
                        role="tablist"
                    >
                        {TABS.map((tab, index) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    id={`settings-tab-${tab.id}`}
                                    type="button"
                                    role="tab"
                                    aria-selected={isActive}
                                    aria-controls={`settings-panel-${tab.id}`}
                                    tabIndex={isActive ? 0 : -1}
                                    onClick={(event) => handleTabChange(tab.id, event.currentTarget)}
                                    onKeyDown={(event) => handleTabKeyDown(event, index)}
                                    className={`flex min-h-10 w-auto shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all text-left group md:w-full md:gap-3 md:rounded-2xl md:px-4 md:py-3 ${
                                        isActive
                                            ? "bg-[#0A0A0A] text-white shadow-2xs"
                                            : "text-neutral-600 hover:text-[#0A0A0A] hover:bg-neutral-200/60"
                                    }`}
                                >
                                    <Icon size={18} className={isActive ? "text-white" : "text-neutral-400 group-hover:text-[#0A0A0A] transition-colors"} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Right Content Panel */}
                <div
                    id={`settings-panel-${activeTab}`}
                    role="tabpanel"
                    aria-labelledby={`settings-tab-${activeTab}`}
                    className="flex-grow p-5 sm:p-8 flex flex-col justify-between min-w-0"
                >
                    <div>
                        {savedNotice && (
                            <div
                                role="status"
                                aria-live="polite"
                                className="mb-4 rounded-xl border border-neutral-200/60 bg-neutral-100 p-3 text-xs font-semibold text-neutral-600"
                            >
                                {savedNotice}
                            </div>
                        )}

                        {/* Tab Title Banner */}
                        <div className="border-b border-neutral-200/60 pb-4 mb-6">
                            <h2 className="text-base font-bold text-[#0A0A0A] tracking-tight">
                                {activeTabMeta.label}
                            </h2>
                            <p className="text-xs font-normal text-neutral-500 mt-0.5">
                                {activeTabMeta.description}
                            </p>
                        </div>

                        {/* General Tab */}
                        {activeTab === "general" && (
                            <div className="space-y-6 max-w-2xl">
                                <SettingRow 
                                    title="Editor Font Size"
                                    description="Text size used across input fields and text editors."
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
                                    description="Automatically save changes as you draft and compile."
                                    checked={settings.autoSave}
                                    onChange={(v) => {
                                        updateSettingsAction({ autoSave: v });
                                        triggerNotice(v ? "Auto-save enabled" : "Auto-save disabled");
                                    }}
                                />
                                <Divider />
                                <SettingToggle 
                                    title="Compact Mode"
                                    description="Reduce padding for tighter spacing in editor panels."
                                    checked={settings.compactView}
                                    onChange={(v) => {
                                        updateSettingsAction({ compactView: v });
                                        triggerNotice("Compact mode updated");
                                    }}
                                />
                                <Divider />
                                <SettingToggle 
                                    title="Spellcheck"
                                    description="Enable browser spellchecking across content fields."
                                    checked={settings.spellcheck}
                                    onChange={(v) => {
                                        updateSettingsAction({ spellcheck: v });
                                        triggerNotice("Spellcheck updated");
                                    }}
                                />
                            </div>
                        )}

                        {/* Editor Tab */}
                        {activeTab === "editor" && (
                            <div className="space-y-6 max-w-2xl">
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

                        {/* Billing Tab */}
                        {activeTab === "career" && <CareerProfileSettings />}

                        {/* Billing Tab */}
                        {activeTab === "billing" && (
                            <div className="space-y-6 max-w-2xl">
                                <div className="p-6 bg-[#FAF9F6] border border-neutral-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-12 h-12 bg-[#0A0A0A] text-white rounded-2xl flex items-center justify-center shadow-2xs shrink-0">
                                            <RiFlashlightLine size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-[#0A0A0A]">
                                                {user?.plan ? `${user.plan} Plan` : "Starter Plan"}
                                            </h3>
                                            <p className="text-xs text-neutral-500 mt-0.5">
                                                Active credit balance: <span className="font-bold text-[#0A0A0A]">{user?.credits ?? 0} Credits</span>
                                            </p>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={handleOpenCredits}
                                        className="px-5 py-2.5 bg-[#0A0A0A] text-white rounded-full text-xs font-bold shadow-2xs hover:bg-neutral-800 active:scale-95 transition-all shrink-0"
                                    >
                                        Get More Credits
                                    </button>
                                </div>

                                <div className="p-4 bg-neutral-50 border border-neutral-200/70 rounded-2xl text-xs text-neutral-500 leading-relaxed">
                                    Credits are utilized whenever you run deep ATS scans, tailor resumes to specific job requirements, or generate AI cover letters. Credits do not expire.
                                </div>
                            </div>
                        )}

                        {/* Account Tab */}
                        {activeTab === "account" && (
                            <div className="space-y-6 max-w-2xl">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Full Name</label>
                                        <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 text-xs font-semibold text-[#0A0A0A]">
                                            {user?.name || "User"}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Email Address</label>
                                        <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 text-xs font-semibold text-[#0A0A0A]">
                                            {user?.email || "user@example.com"}
                                        </div>
                                    </div>
                                </div>

                                <Divider />

                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-[#0A0A0A]">Account Security</h4>
                                    <button 
                                        onClick={handleResetPassword}
                                        className="py-2.5 px-4 bg-neutral-50 border border-neutral-200/80 hover:bg-neutral-100 rounded-full text-xs font-bold text-[#0A0A0A] transition-all inline-flex items-center gap-2"
                                    >
                                        <RiMailLine size={16} />
                                        <span>Send Password Reset Email</span>
                                    </button>
                                </div>

                                <Divider />

                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-[#0A0A0A]">Reset Workspace Preferences</h4>
                                    <p className="text-xs text-neutral-500">Restore all editor and styling settings back to factory defaults.</p>
                                    <button 
                                        onClick={() => {
                                            resetSettingsAction();
                                            triggerNotice("Preferences reset to defaults");
                                            showToast("Settings reset to defaults", "success");
                                        }}
                                        className="py-2.5 px-4 bg-white border border-neutral-200/80 hover:bg-neutral-100 rounded-full text-xs font-bold text-[#0A0A0A] transition-all shadow-2xs"
                                    >
                                        Reset to Defaults
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-6 border-t border-neutral-200/60 mt-8 flex justify-between items-center text-xs text-neutral-400">
                        <span>Settings are persisted automatically across sessions.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CareerProfileSettings() {
    const [profile, setProfile] = useState<{ careerStage: string | null; professionalExperienceYears: number | null } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        fetch("/api/profile/career")
            .then(async (response) => {
                if (!response.ok) throw new Error("Could not load career profile");
                return response.json();
            })
            .then((value) => { if (active) setProfile(value); })
            .catch(() => { if (active) setProfile(null); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    if (loading) return <p className="text-xs text-neutral-500">Loading career profile...</p>;

    return (
        <div className="max-w-2xl space-y-4">
            <p className="text-xs leading-5 text-neutral-500">
                Zebra uses this profile to apply fair expectations to students, freelancers, and experienced professionals. Resume evidence still takes priority when it shows internships or employment.
            </p>
            <CareerProfileForm
                initialStage={profile?.careerStage}
                initialYears={profile?.professionalExperienceYears}
                onSaved={(saved) => setProfile(saved)}
            />
        </div>
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
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            className="group flex w-full cursor-pointer items-center justify-between gap-4 text-left"
            onClick={() => onChange(!checked)}
        >
            <div className="space-y-0.5 pr-4">
                <h4 className="text-xs font-bold text-[#0A0A0A] group-hover:text-neutral-700 transition-colors">{title}</h4>
                <p className="text-xs font-normal text-neutral-500 leading-relaxed">{description}</p>
            </div>
            <span
                aria-hidden="true"
                className={`shrink-0 relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? "bg-[#0A0A0A]" : "bg-neutral-200"}`}
            >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 shadow-2xs ${checked ? "translate-x-5" : ""}`} />
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
