"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { clearSettingsRecord, readSettingsRecord, writeSettingsRecord } from "@/lib/settings-storage";

export interface Settings {
    fontSize: string;
    spellcheck: boolean;
    lineWrapping: boolean;
    compactView: boolean;
    autoSave: boolean;
    resumeFont: string;
    previewScale: number | "auto";
    aiTone: "professional" | "bold" | "technical" | "executive";
    autoFormatOnPaste: boolean;
}

interface SettingsContextType {
    settings: Settings;
    updateSettingsAction: (newSettings: Partial<Settings>) => boolean;
    resetSettingsAction: () => boolean;
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
    autoFormatOnPaste: true,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<Settings>(defaultSettings);

    useEffect(() => {
        const saved = readSettingsRecord();
        if (!saved) return;
        try {
            const parsed = JSON.parse(saved);
            const migrated: Settings = {
                fontSize: parsed.fontSize || defaultSettings.fontSize,
                spellcheck: parsed.spellcheck !== undefined ? parsed.spellcheck : defaultSettings.spellcheck,
                lineWrapping: parsed.lineWrapping !== undefined ? parsed.lineWrapping : (parsed.wordWrap !== undefined ? parsed.wordWrap : defaultSettings.lineWrapping),
                compactView: parsed.compactView !== undefined ? parsed.compactView : (parsed.realtimeCompilation !== undefined ? !parsed.realtimeCompilation : defaultSettings.compactView),
                autoSave: parsed.autoSave !== undefined ? parsed.autoSave : (parsed.autoFormatting !== undefined ? parsed.autoFormatting : defaultSettings.autoSave),
                resumeFont: parsed.resumeFont || defaultSettings.resumeFont,
                previewScale: parsed.previewScale || defaultSettings.previewScale,
                aiTone: parsed.aiTone || defaultSettings.aiTone,
                autoFormatOnPaste: parsed.autoFormatOnPaste !== undefined ? parsed.autoFormatOnPaste : defaultSettings.autoFormatOnPaste,
            };
            queueMicrotask(() => setSettings(migrated));
        } catch (e) {
            console.error("Failed to parse settings", e);
        }
    }, []);

    const updateSettingsAction = (newSettings: Partial<Settings>): boolean => {
        const updated = { ...settings, ...newSettings };
        const persisted = writeSettingsRecord(updated);
        if (!persisted) return false;
        setSettings(updated);
        return true;
    };

    const resetSettingsAction = (): boolean => {
        const cleared = clearSettingsRecord();
        if (!cleared) return false;
        setSettings(defaultSettings);
        return true;
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
