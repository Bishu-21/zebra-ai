"use client";

import React, { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { DashboardLink } from "./DashboardLink";
import { CreditTopUp } from "./CreditTopUp";
import Link from "next/link";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

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
const AddIcon = () => (
    <SidebarIcon><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></SidebarIcon>
);
const LogoutIcon = () => (
    <SidebarIcon><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></SidebarIcon>
);
const MenuIcon = () => (
    <SidebarIcon><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></SidebarIcon>
);
const CloseIcon = () => (
    <SidebarIcon><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="12" y2="12" /><line x1="12" y1="12" x2="18" y2="18" /></SidebarIcon>
);

interface SidebarProps {
    plan: string;
    credits: number;
}

export function Sidebar({ plan, credits }: SidebarProps) {
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

    const handleSignOut = async () => {
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
            <button 
                onClick={toggleSidebar}
                className="lg:hidden fixed top-5 left-6 z-[70] w-10 h-10 bg-white/60 backdrop-blur-md border border-[#F5F5F5] rounded-xl flex items-center justify-center text-[#171717] shadow-sm"
                aria-label="Toggle Menu"
            >
                {isOpen ? <CloseIcon /> : <MenuIcon />}
            </button>

            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <m.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="lg:hidden fixed inset-0 bg-white/20 backdrop-blur-sm z-[60]"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Desktop & Mobile */}
            <m.aside 
                initial={false}
                animate={{ 
                    x: isMobile ? (isOpen ? 0 : "-100%") : 0,
                    width: 280
                }}
                className="fixed lg:sticky top-0 left-0 h-screen bg-[#FAFAFA] border-r border-[#F5F5F5] flex flex-col z-[50] overflow-y-auto no-scrollbar"
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
                <div className="pt-12 px-10 flex flex-col h-full">
                    <Link href="/dashboard" className="flex items-center gap-3 mb-16 group" onClick={() => setIsOpen(false)}>
                        <img 
                            src="/zebra_star.svg" 
                            alt="Zebra AI" 
                            className="w-10 h-10 object-contain group-hover:rotate-12 transition-transform duration-300"
                        />
                        <span className="text-2xl font-bold tracking-tight text-[#171717]">Zebra AI</span>
                    </Link>

                    <div className="space-y-1 flex-grow">
                        <p className="text-[0.6rem] font-bold tracking-[0.2em] uppercase text-[#A3A3A3] mb-8 ml-4">Command Menu</p>
                        
                        <div className="space-y-2">
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
                            <DashboardLink href="/dashboard/settings" icon={<SettingsIcon />}>
                                Settings
                            </DashboardLink>
                        </div>

                        <div className="mt-12 pt-10 border-t border-[#F5F5F5]">
                             <p className="text-[0.6rem] font-bold tracking-[0.2em] uppercase text-[#A3A3A3] mb-6 ml-4">Subscription</p>
                             <div className="bg-white border border-[#F5F5F5] rounded-[2rem] p-6 group/card shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex flex-col">
                                        <span className="text-[0.6rem] font-bold text-[#A3A3A3] uppercase tracking-[0.1em] mb-1">Tier</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full animate-pulse" />
                                            <span className="text-base font-bold text-[#171717] tracking-tight">{plan}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-xl font-bold text-[#3B82F6] tracking-tight leading-none mb-1">{credits}</span>
                                        <span className="text-[0.6rem] font-bold text-[#A3A3A3] uppercase tracking-[0.1em]">Units</span>
                                    </div>
                                </div>
                                <div className="w-full bg-[#3B82F6]/5 h-1.5 rounded-full overflow-hidden mb-6">
                                     <div className="bg-[#3B82F6] h-full transition-all duration-1000" style={{ width: plan === "Pro" ? "100%" : "20%" }}></div>
                                </div>
                                <CreditTopUp />
                             </div>
                        </div>
                    </div>

                    <div className="pt-8 pb-12 lg:pb-12 border-t border-[#F5F5F5] space-y-5 text-center">
                        <Link href="/dashboard/resumes/new" onClick={() => setIsOpen(false)} className="w-full bg-[#3B82F6] text-white py-4 rounded-2xl font-bold text-[0.7rem] uppercase tracking-widest transition-all shadow-lg shadow-blue-500/10 hover:bg-[#2563EB] active:scale-95 flex items-center justify-center gap-2">
                            <AddIcon />
                            Provision
                        </Link>
                        
                        <button 
                            onClick={handleSignOut}
                            className="w-full flex items-center justify-center gap-3 px-5 py-3 text-[#A3A3A3] hover:text-red-500 transition-all font-bold text-[0.6rem] uppercase tracking-widest"
                        >
                            <LogoutIcon />
                            Log Out
                        </button>
                    </div>
                </div>
            </m.aside>
        </>
    );
}
