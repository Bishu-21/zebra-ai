"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ProfileModal } from "./ProfileModal";
import { ToastProvider } from "../ui/Toast";
import { SettingsProvider } from "@/context/SettingsContext";
import { CareerProfilePrompt } from "./CareerProfilePrompt";
import { ZebuAssistant } from "./ZebuAssistant";
import { ZebuProvider } from "@/context/ZebuContext";

interface DashboardShellProps {
    plan: string;
    credits: number;
    userName: string;
    userImage?: string | null;
    shouldPromptCareerProfile: boolean;
    children: React.ReactNode;
}

export function DashboardShell({ plan, credits, userName, userImage, shouldPromptCareerProfile, children }: DashboardShellProps) {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNavOpen, setIsNavOpen] = useState(false);

    const openNav = useCallback(() => setIsNavOpen(true), []);
    const closeNav = useCallback(() => setIsNavOpen(false), []);
    const openProfile = useCallback(() => setIsProfileOpen(true), []);
    const closeProfile = useCallback(() => setIsProfileOpen(false), []);

    useEffect(() => {
        if (!isNavOpen) return;

        const previousOverflow = document.body.style.overflow;
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") closeNav();
        };

        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", closeOnEscape);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", closeOnEscape);
        };
    }, [closeNav, isNavOpen]);

    return (
        <SettingsProvider>
            <ZebuProvider>
              <ToastProvider>
                <div className="min-h-screen bg-background flex font-sans text-foreground overflow-hidden">
                    <Sidebar
                        plan={plan}
                        credits={credits}
                        userName={userName}
                        userImage={userImage}
                        isOpen={isNavOpen}
                        onCloseAction={closeNav}
                        onOpenProfileAction={openProfile}
                    />
                    <div className="flex-grow flex flex-col h-screen overflow-hidden relative">
                        <Header
                            userName={userName}
                            userImage={userImage}
                            credits={credits}
                            isNavOpen={isNavOpen}
                            onOpenNavAction={openNav}
                            onOpenProfileAction={openProfile}
                        />
                        <main className="flex-grow overflow-y-auto w-full custom-scrollbar">
                            <div className="mx-auto max-w-7xl">
                                {children}
                            </div>
                        </main>
                    </div>

                    <ProfileModal
                        isOpen={isProfileOpen}
                        onCloseAction={closeProfile}
                        userName={userName}
                        userImage={userImage}
                    />
                    <CareerProfilePrompt shouldPrompt={shouldPromptCareerProfile} />
                    <ZebuAssistant />
                </div>
              </ToastProvider>
            </ZebuProvider>
        </SettingsProvider>
    );
}
