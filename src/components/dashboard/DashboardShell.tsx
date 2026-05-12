"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { SettingsModal } from "./SettingsModal";
import { ProfileModal } from "./ProfileModal";
import { ToastProvider } from "../ui/Toast";
import { SettingsProvider } from "@/context/SettingsContext";

interface DashboardShellProps {
    plan: string;
    credits: number;
    userName: string;
    userImage?: string | null;
    children: React.ReactNode;
}

export function DashboardShell({ plan, credits, userName, userImage, children }: DashboardShellProps) {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    return (
        <SettingsProvider>
            <ToastProvider>
                <div className="min-h-screen bg-background flex font-sans text-foreground overflow-hidden">
                    <Sidebar 
                        plan={plan} 
                        credits={credits} 
                        userName={userName}
                        userImage={userImage}
                        onOpenSettingsAction={() => setIsSettingsOpen(true)} 
                        onOpenProfileAction={() => setIsProfileOpen(true)}
                    />
                    <div className="flex-grow flex flex-col h-screen overflow-hidden relative">
                        <Header 
                            userName={userName} 
                            userImage={userImage} 
                            credits={credits} 
                            onOpenSettingsAction={() => setIsSettingsOpen(true)}
                            onOpenProfileAction={() => setIsProfileOpen(true)}
                        />
                        <main className="flex-grow overflow-y-auto w-full custom-scrollbar">
                            <div className="mx-auto max-w-7xl">
                                {children}
                            </div>
                        </main>
                    </div>

                    <SettingsModal 
                        isOpen={isSettingsOpen} 
                        onCloseAction={() => setIsSettingsOpen(false)} 
                    />

                    <ProfileModal 
                        isOpen={isProfileOpen}
                        onCloseAction={() => setIsProfileOpen(false)}
                        userName={userName}
                        userImage={userImage}
                    />
                </div>
            </ToastProvider>
        </SettingsProvider>
    );
}
