"use client";

import React, { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { DashboardLink } from "./DashboardLink";
import { CreditTopUp } from "./CreditTopUp";
import Link from "next/link";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Image from "next/image";

// --- INLINED SIDEBAR ICONS (Performance & Hydration Safe) ---
const SidebarIcon = ({ children }: { children: React.ReactNode }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {children}
    </svg>
);

const HomeIcon = () => (
    <SidebarIcon><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></SidebarIcon>
);
const DocsIcon = () => (
    <SidebarIcon><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></SidebarIcon>
);
const BriefcaseIcon = () => (
    <SidebarIcon><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></SidebarIcon>
);
const AnalyticsIcon = () => (
    <SidebarIcon><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></SidebarIcon>
);
const SettingsIcon = () => (
    <SidebarIcon><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></SidebarIcon>
);
const LogoutIcon = () => (
    <SidebarIcon><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></SidebarIcon>
);
const MenuIcon = () => (
    <SidebarIcon><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></SidebarIcon>
);
const CloseIcon = () => (
    <SidebarIcon>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </SidebarIcon>
);

interface SidebarProps {
    plan: string;
    credits: number;
    userName: string;
    userImage?: string | null;
    onOpenSettingsAction: () => void;
    onOpenProfileAction: () => void;
}

export function Sidebar({ plan, credits, userName, userImage, onOpenSettingsAction, onOpenProfileAction }: SidebarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = React.useState(false);
    const router = useRouter();

    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const toggleSidebar = () => setIsOpen(!isOpen);

    const handleSignOut = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening profile when clicking logout
        await signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/");
                },
            },
        });
    };

    return (
        <>
            {/* Mobile Toggle Button */}
            {!isOpen && (
                <button 
                    onClick={toggleSidebar}
                    className="lg:hidden fixed top-5 left-6 z-[70] w-10 h-10 bg-background/80 backdrop-blur-md border border-border-subtle rounded-xl flex items-center justify-center text-foreground shadow-sm hover:bg-background transition-colors"
                    aria-label="Open Menu"
                >
                    <MenuIcon />
                </button>
            )}

            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <m.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-md z-[60]"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Desktop & Mobile */}
            <m.aside 
                initial={false}
                animate={{ 
                    x: isMobile ? (isOpen ? 0 : "-100%") : 0,
                }}
                className="fixed lg:sticky top-0 left-0 h-screen w-[280px] bg-background border-r border-border-subtle flex flex-col z-[70] overflow-hidden shadow-2xl lg:shadow-none"
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
                <div className="pt-10 px-8 flex flex-col h-full">
                    <div className="flex flex-col items-center justify-center mb-10 text-center relative">
                        <Link href="/dashboard" className="flex flex-col items-center gap-3 group" onClick={() => setIsOpen(false)}>
                            <div className="relative">
                                <div className="absolute inset-0 bg-[var(--primary)]/30 blur-3xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-all duration-700" />
                                <Image 
                                    src="/zebra_star.svg" 
                                    alt="Zebra AI" 
                                    width={64}
                                    height={64}
                                    className="w-16 h-16 object-contain relative z-10 group-hover:scale-110 group-hover:rotate-[5deg] transition-all duration-500 ease-out"
                                />
                            </div>
                            <div className="flex flex-col items-center relative z-10">
                                <h1 className="text-2xl font-black tracking-[-0.06em] text-[var(--foreground)] leading-none">Zebra AI</h1>
                                <div className="h-1 w-6 bg-[var(--primary)] rounded-full mt-2 transform origin-center scale-x-0 group-hover:scale-x-100 transition-all duration-500 ease-out" />
                            </div>
                        </Link>
                        
                        {isMobile && (
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="absolute -top-2 -right-4 w-10 h-10 bg-border-subtle rounded-[var(--radius-md)] flex items-center justify-center text-secondary/40 hover:text-secondary hover:bg-muted transition-all"
                            >
                                <CloseIcon />
                            </button>
                        )}
                    </div>

                    <div className="space-y-1 flex-grow overflow-y-auto custom-scrollbar pr-1">
                        <p className="text-[0.6rem] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-4 ml-4 opacity-60">Navigation</p>
                        
                        <div className="space-y-1">
                            <DashboardLink href="/dashboard" icon={<HomeIcon />}>
                                Resumes
                            </DashboardLink>
                            <DashboardLink href="/dashboard/cover-letters" icon={<DocsIcon />}>
                                Cover Letters
                            </DashboardLink>
                            <DashboardLink href="/dashboard/job-tracker" icon={<BriefcaseIcon />}>
                                Job Tracker
                            </DashboardLink>
                            <DashboardLink href="/dashboard/analytics" icon={<AnalyticsIcon />}>
                                Analytics
                            </DashboardLink>
                             <button 
                                onClick={onOpenSettingsAction}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] transition-all hover:bg-muted text-muted-foreground hover:text-secondary font-bold text-sm group"
                            >
                                <SettingsIcon />
                                <span>Settings</span>
                            </button>
                        </div>

                        <div className="mt-8 pt-8 border-t border-border-subtle">
                             <p className="text-[0.6rem] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-4 ml-4 opacity-60">Subscription</p>
                             <div className="relative bg-background border border-border-subtle rounded-[var(--radius-lg)] p-5 group/card shadow-sm hover:shadow-md transition-all overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-[2rem] -mr-4 -mt-4 transition-transform group-hover/card:scale-110" />
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex flex-col">
                                        <span className="text-[0.6rem] font-bold text-muted-foreground uppercase tracking-[0.1em] mb-1">Tier</span>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_var(--primary)]" />
                                            <span className="text-xs font-black text-secondary tracking-tight">{plan} Plan</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-base font-black text-primary tracking-tighter leading-none mb-0.5">{credits}</span>
                                        <span className="text-[0.55rem] font-black text-muted-foreground uppercase tracking-[0.1em]">Credits</span>
                                    </div>
                                </div>
                                <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mb-5">
                                     <m.div 
                                        className="bg-primary h-full" 
                                        initial={{ width: 0 }}
                                        animate={{ width: plan === "Pro" ? "100%" : `${Math.min((credits / 10) * 100, 100)}%` }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                     />
                                </div>
                                <CreditTopUp />
                             </div>
                        </div>
                    </div>

                    {/* Bottom Section: Integrated Profile & Logout */}
                    <div className="pt-6 pb-8 mt-auto border-t border-border-subtle">
                        <div 
                            onClick={onOpenProfileAction}
                            className="group flex items-center gap-3 p-2 pr-4 rounded-[var(--radius-lg)] bg-[var(--background)] border border-[var(--border-subtle)] hover:border-[var(--primary)]/20 hover:shadow-lg hover:shadow-[var(--foreground)]/5 transition-all cursor-pointer"
                        >
                            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] p-0.5 shadow-md group-hover:scale-105 transition-transform">
                                <div className="w-full h-full rounded-[0.55rem] bg-background overflow-hidden flex items-center justify-center">
                                    {userImage ? (
                                        <Image 
                                            src={userImage} 
                                            alt={userName} 
                                            width={40} 
                                            height={40} 
                                            className="w-full h-full object-cover" 
                                            unoptimized
                                        />
                                    ) : (
                                        <span className="text-xs font-black text-primary">{userName.charAt(0).toUpperCase()}</span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex-grow min-w-0">
                                <p className="text-[0.7rem] font-black text-secondary truncate tracking-tight">{userName}</p>
                                <p className="text-[0.55rem] font-bold text-muted-foreground uppercase tracking-widest">{plan} Member</p>
                            </div>

                            <button 
                                onClick={handleSignOut}
                                className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-muted-foreground/30 hover:text-red-500 hover:bg-red-500/10 transition-all shadow-sm active:scale-95"
                                title="Sign Out"
                            >
                                <LogoutIcon />
                            </button>
                        </div>
                    </div>
                </div>
            </m.aside>
        </>
    );
}
