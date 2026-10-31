"use client";

import React, { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ToastProvider } from "../ui/Toast";
import { SettingsProvider } from "@/context/SettingsContext";
import { CareerProfilePrompt } from "./CareerProfilePrompt";
import { ZebuProvider } from "@/context/ZebuContext";
import { CreditsProvider } from "@/context/CreditsContext";

const ProfileModal = dynamic(() => import("./ProfileModal").then((module) => module.ProfileModal), { ssr: false });
const SettingsModal = dynamic(() => import("./SettingsModal").then((module) => module.SettingsModal), { ssr: false });
const ZebuAssistant = dynamic(() => import("./ZebuAssistant").then((module) => module.ZebuAssistant), { ssr: false });

interface DashboardShellProps {
    plan: string;
    credits: number;
    userName: string;
    userImage?: string | null;
    shouldPromptCareerProfile: boolean;
    checkoutAvailable: boolean;
    children: React.ReactNode;
}

export function DashboardShell({ plan, credits, userName, userImage, shouldPromptCareerProfile, checkoutAvailable, children }: DashboardShellProps) {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isNavOpen, setIsNavOpen] = useState(false);

    const openNav = useCallback(() => setIsNavOpen(true), []);
    const closeNav = useCallback(() => setIsNavOpen(false), []);
    const openProfile = useCallback(() => setIsProfileOpen(true), []);
    const closeProfile = useCallback(() => setIsProfileOpen(false), []);
    const openSettings = useCallback(() => setIsSettingsOpen(true), []);
    const closeSettings = useCallback(() => setIsSettingsOpen(false), []);

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
              <CreditsProvider credits={credits} plan={plan}>
              <ToastProvider>
                <>
                    <Sidebar
                        plan={plan}
                        credits={credits}
                        userName={userName}
                        userImage={userImage}
                        isOpen={isNavOpen}
                        onCloseAction={closeNav}
                        onOpenProfileAction={openProfile}
                        checkoutAvailable={checkoutAvailable}
                    />
                    <div className="min-w-0 flex-grow flex flex-col h-dvh overflow-hidden relative">
                        <Header
                            userName={userName}
                            userImage={userImage}
                            credits={credits}
                            isNavOpen={isNavOpen}
                            onOpenNavAction={openNav}
                            onOpenProfileAction={openProfile}
                            onOpenSettingsAction={openSettings}
                        />
                        <main className="flex-grow overflow-y-auto w-full custom-scrollbar">
                            <div className="mx-auto max-w-7xl">
                                {children}
                            </div>
                        </main>
                    </div>

                    {isProfileOpen && (
                        <ProfileModal
                            isOpen={isProfileOpen}
                            onCloseAction={closeProfile}
                            userName={userName}
                            userImage={userImage}
                        />
                    )}
                    <SettingsModal
                        isOpen={isSettingsOpen}
                        onCloseAction={closeSettings}
                    />
                    <CareerProfilePrompt shouldPrompt={shouldPromptCareerProfile} />
                    <ZebuAssistant />
                </>
              </ToastProvider>
              </CreditsProvider>
            </ZebuProvider>
        </SettingsProvider>
    );
}
