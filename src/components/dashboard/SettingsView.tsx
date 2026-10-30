"use client";

import { FeatureIcon } from "@/components/dashboard/FeatureIcon";
import { featureChrome } from "@/components/dashboard/feature-chrome";
import { AppIcon } from "@/components/ui/AppIcon";
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
import { AiUsageHistory } from "./AiUsageHistory";
import { ConnectedAccounts } from "./ConnectedAccounts";

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

export function SettingsView({ connectionProviders, githubAppConfigured }: { connectionProviders: { linkedin: boolean; github: boolean }; githubAppConfigured: boolean }) {
    const searchParams = useSearchParams();
    const { settings, updateSettingsAction, resetSettingsAction } = useSettings();
    const { data: session } = useSession();
    const { showToast } = useToast();

    const initialTab = (searchParams.get("tab") as TabType) || "general";
    const [activeTab, setActiveTab] = useState<TabType>(
        TABS.some(t => t.id === initialTab) ? initialTab : "general"
    );
    const [savedNotice, setSavedNotice] = useState<string | null>(null);
    const [noticeIsError, setNoticeIsError] = useState(false);

    useEffect(() => {
        const tab = searchParams.get("tab") as TabType;
        if (tab && TABS.some(t => t.id === tab) && tab !== activeTab) {
            queueMicrotask(() => setActiveTab(tab));
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

    const triggerNotice = (ok: boolean, success: string) => {
        setNoticeIsError(!ok);
        setSavedNotice(ok ? success : "Could not save preferences on this device.");
        window.setTimeout(() => setSavedNotice(null), 2500);
    };

    const persist = (patch: Parameters<typeof updateSettingsAction>[0], success: string) => {
        triggerNotice(updateSettingsAction(patch), success);
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
        <div className="mx-auto w-full max-w-7xl space-y-6 px-5 py-6 pb-32 font-sans text-sm leading-6 sm:px-6 md:px-10 md:py-10">
            <div>
                <h1 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight text-foreground">
                    <FeatureIcon feature="Settings" size={18} className="text-muted-foreground" />
                    Settings
                </h1>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Workspace preferences, editor settings, billing, and account details.
                </p>
            </div>

            <div className="flex flex-col overflow-visible rounded-2xl border border-neutral-200/70 bg-white md:flex-row md:overflow-hidden">
                {/* Left Tab Navigation */}
                <div className="sticky top-0 z-20 w-full md:static md:w-64 bg-neutral-50 border-b md:border-b-0 md:border-r border-neutral-200/70 p-2.5 md:p-3 shrink-0">
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
                                    className={`flex min-h-11 w-auto shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black group md:w-full md:gap-3 md:px-4 md:py-3 ${
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
                    className="flex-grow p-4 sm:p-6 flex flex-col min-w-0"
                >
                    <div>
                        {savedNotice && (
                            <div
                                role="status"
                                aria-live="polite"
                                className={`mb-4 rounded-xl border p-3 text-xs font-semibold ${
                                    noticeIsError
                                        ? "border-red-200 bg-red-50 text-red-800"
                                        : "border-neutral-200/60 bg-neutral-100 text-neutral-600"
                                }`}
                            >
                                {savedNotice}
                            </div>
                        )}

                        {/* Tab Title Banner */}
                        <div className="border-b border-neutral-200/60 pb-4 mb-5">
                            <h2 className="text-base font-semibold tracking-tight text-foreground">
                                {activeTabMeta.label}
                            </h2>
                            <p className="mt-0.5 text-sm leading-6 text-muted-foreground">
                                {activeTabMeta.description}
                            </p>
                        </div>

                        {/* General Tab */}
                        {activeTab === "general" && (
                            <div className="space-y-4 w-full">
                                <SettingRow
                                    title="Editor font size"
                                    description="Text size used across input fields and text editors."
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
                                    description="Automatically save changes as you draft and compile."
                                    checked={settings.autoSave}
                                    onChange={(v) => persist({ autoSave: v }, v ? "Auto-save enabled" : "Auto-save disabled")}
                                />
                                <Divider />
                                <SettingToggle
                                    title="Compact mode"
                                    description="Reduce padding for tighter spacing in editor panels."
                                    checked={settings.compactView}
                                    onChange={(v) => persist({ compactView: v }, "Compact mode saved")}
                                />
                                <Divider />
                                <SettingToggle
                                    title="Spellcheck"
                                    description="Enable browser spellchecking across content fields."
                                    checked={settings.spellcheck}
                                    onChange={(v) => persist({ spellcheck: v }, "Spellcheck saved")}
                                />
                            </div>
                        )}

                        {/* Editor Tab */}
                        {activeTab === "editor" && (
                            <div className="space-y-4 w-full">
                                <SettingRow
                                    title="Default resume font"
                                    description="Primary font family used for resume previews and PDF generation."
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
                                    description="Default zoom level for the live resume preview pane."
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

                        {/* Billing Tab */}
                        {activeTab === "career" && <CareerProfileSettings />}

                        {/* Billing Tab */}
                        {activeTab === "billing" && (
                            <div className="space-y-4 w-full">
                                <div className="p-6 bg-[#FAF9F6] border border-neutral-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-12 h-12 bg-[#0A0A0A] text-white rounded-2xl flex items-center justify-center shadow-2xs shrink-0">
                                            <RiFlashlightLine size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-semibold tracking-tight text-foreground">
                                                {user?.plan ? `${user.plan} plan` : "Plan unavailable"}
                                            </h3>
                                            <p className="mt-0.5 text-sm text-muted-foreground">
                                                Credit balance:{" "}
                                                <span className="font-medium text-foreground">
                                                    {typeof user?.credits === "number" ? user.credits : "Unknown"}
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleOpenCredits}
                                        className={`${featureChrome.primaryButton} shrink-0`}
                                    >
                                        Get more credits
                                    </button>
                                </div>

                                <div className="rounded-2xl border border-neutral-200/70 bg-neutral-50 p-4 text-sm leading-6 text-muted-foreground">
                                    Credits are used for resume reviews, job matching, and cover letter generation. Unused paid credits remain on the account until they are spent.
                                </div>

                                <AiUsageHistory />
                            </div>
                        )}

                        {/* Account Tab */}
                        {activeTab === "account" && (
                            <div className="space-y-4 w-full">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className={featureChrome.label}>Full name</label>
                                        <div className="rounded-xl border border-neutral-200/80 bg-neutral-50 p-3 text-sm font-medium text-foreground">
                                            {user?.name || "Name unavailable"}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className={featureChrome.label}>Email</label>
                                        <div className="rounded-xl border border-neutral-200/80 bg-neutral-50 p-3 text-sm font-medium text-foreground">
                                            {user?.email || "Email unavailable"}
                                        </div>
                                    </div>
                                </div>

                                <Divider />

                                <ConnectedAccounts available={connectionProviders} githubAppConfigured={githubAppConfigured} />

                                <Divider />

                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-foreground">Account security</h4>
                                    <button
                                        type="button"
                                        onClick={handleResetPassword}
                                        className={featureChrome.secondaryButton}
                                    >
                                        <AppIcon icon={RiMailLine} size={16} />
                                        <span>Send password reset email</span>
                                    </button>
                                </div>

                                <Divider />

                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-foreground">Reset workspace preferences</h4>
                                    <p className="text-sm leading-6 text-muted-foreground">Restore editor and styling settings to their defaults.</p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const reset = resetSettingsAction();
                                            triggerNotice(reset, "Preferences reset to defaults");
                                            showToast(
                                                reset ? "Preferences reset to defaults" : "Could not reset preferences on this device.",
                                                reset ? "success" : "error"
                                            );
                                        }}
                                        className={featureChrome.secondaryButton}
                                    >
                                        Reset to defaults
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 border-t border-neutral-200/60 pt-4 text-xs leading-5 text-neutral-600">
                        <span>
                            {savedNotice
                                ? savedNotice
                                : "Preference changes are saved on this device when the browser allows it."}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CareerProfileSettings() {
    const [profile, setProfile] = useState<{ careerStage: string | null; professionalExperienceYears: number | null } | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        fetch("/api/profile/career")
            .then(async (response) => {
                if (!response.ok) throw new Error("Could not load career profile");
                return response.json();
            })
            .then((value) => {
                if (!active) return;
                setProfile(value);
                setLoadError(null);
            })
            .catch(() => {
                if (!active) return;
                setProfile(null);
                setLoadError("Could not load career profile. You can still try saving a new selection.");
            })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    if (loading) return <p className="text-sm text-muted-foreground">Loading career profile...</p>;

    return (
        <div className="max-w-2xl space-y-4">
            {loadError && (
                <p role="status" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800">
                    {loadError}
                </p>
            )}
            <p className="text-sm leading-6 text-muted-foreground">
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
            <div className="min-w-0 space-y-1 max-w-xl">
                <h4 className="text-sm font-semibold text-foreground">{title}</h4>
                <p className="text-sm font-normal leading-6 text-muted-foreground">{description}</p>
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
            className="group flex min-h-11 w-full cursor-pointer items-center justify-between gap-4 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
            onClick={() => onChange(!checked)}
        >
            <div className="min-w-0 space-y-1">
                <h4 className="text-sm font-semibold text-foreground group-hover:text-neutral-700 transition-colors">{title}</h4>
                <p className="text-sm font-normal leading-6 text-muted-foreground">{description}</p>
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
                className={`${featureChrome.select} w-full sm:w-auto pr-9`}
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
