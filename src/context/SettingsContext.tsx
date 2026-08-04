"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface Settings {
    fontSize: string;
    spellcheck: boolean;
    lineWrapping: boolean;
    compactView: boolean;
    autoSave: boolean;
    resumeFont: string;
    previewScale: number | "auto";
    aiTone: "professional" | "bold" | "technical" | "executive";
    theme: "system" | "light" | "dark";
    autoFormatOnPaste: boolean;
}

interface SettingsContextType {
    settings: Settings;
    updateSettingsAction: (newSettings: Partial<Settings>) => void;
    resetSettingsAction: () => void;
}

const defaultSettings: Settings = {
    fontSize: "14px",
    spellcheck: true,
    lineWrapping: true,
    compactView: false,
    autoSave: true,
    resumeFont: "Latin Modern Roman",
    previewScale: "auto",
    aiTone: "professional",
    theme: "light",
    autoFormatOnPaste: true,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<Settings>(defaultSettings);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("zebra_settings");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Migration logic for old settings keys if necessary
                const migrated: Settings = {
                    fontSize: parsed.fontSize || defaultSettings.fontSize,
                    spellcheck: parsed.spellcheck !== undefined ? parsed.spellcheck : defaultSettings.spellcheck,
                    lineWrapping: parsed.lineWrapping !== undefined ? parsed.lineWrapping : (parsed.wordWrap !== undefined ? parsed.wordWrap : defaultSettings.lineWrapping),
                    compactView: parsed.compactView !== undefined ? parsed.compactView : (parsed.realtimeCompilation !== undefined ? !parsed.realtimeCompilation : defaultSettings.compactView),
                    autoSave: parsed.autoSave !== undefined ? parsed.autoSave : (parsed.autoFormatting !== undefined ? parsed.autoFormatting : defaultSettings.autoSave),
                    resumeFont: parsed.resumeFont || defaultSettings.resumeFont,
                    previewScale: parsed.previewScale || defaultSettings.previewScale,
                    aiTone: parsed.aiTone || defaultSettings.aiTone,
                    theme: parsed.theme || defaultSettings.theme,
                    autoFormatOnPaste: parsed.autoFormatOnPaste !== undefined ? parsed.autoFormatOnPaste : defaultSettings.autoFormatOnPaste,
                };
                setSettings(migrated);
            } catch (e) {
                console.error("Failed to parse settings", e);
            }
        }
    }, []);

    const updateSettingsAction = (newSettings: Partial<Settings>) => {
        setSettings(prev => {
            const updated = { ...prev, ...newSettings };
            localStorage.setItem("zebra_settings", JSON.stringify(updated));
            return updated;
        });
    };

    const resetSettingsAction = () => {
        setSettings(defaultSettings);
        localStorage.removeItem("zebra_settings");
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettingsAction, resetSettingsAction }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
}
