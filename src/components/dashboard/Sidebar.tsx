"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    RiHome5Line, 
    RiFileTextLine, 
    RiChat3Line, 
    RiBriefcase4Line, 
    RiBarChartGroupedLine, 
    RiSettings4Line, 
    RiAddLine,
    RiCloseCircleLine,
    RiMenu3Line,
    RiLogoutCircleLine,
    RiCheckboxCircleLine
} from "react-icons/ri";
import { DashboardLink } from "./DashboardLink";
import { CreditTopUp } from "./CreditTopUp";
import Link from "next/link";

interface SidebarProps {
    plan: string;
    credits: number;
}

export function Sidebar({ plan, credits }: SidebarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const toggleSidebar = () => setIsOpen(!isOpen);

    return (
        <>
            {/* Mobile Toggle Button */}
            <button 
                onClick={toggleSidebar}
                className="lg:hidden fixed top-5 left-6 z-[110] w-10 h-10 bg-white/60 backdrop-blur-md border border-white/50 rounded-xl flex items-center justify-center text-black shadow-sm"
                aria-label="Toggle Menu"
            >
                {isOpen ? <RiCloseCircleLine size={24} /> : <RiMenu3Line size={24} />}
            </button>

            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="lg:hidden fixed inset-0 bg-black/5 backdrop-blur-md z-[100]"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Desktop & Mobile */}
            <motion.aside 
                initial={false}
                animate={{ 
                    x: isMobile ? (isOpen ? 0 : "-100%") : 0,
                    width: 280
                }}
                className="fixed lg:sticky top-0 left-0 h-screen bg-white/20 backdrop-blur-xl border-r border-white/40 flex flex-col z-[105] overflow-y-auto no-scrollbar"
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
                <div className="pt-12 px-10 flex flex-col h-full">
                    <Link href="/dashboard" className="flex items-center gap-3 mb-16 group" onClick={() => setIsOpen(false)}>
                        <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center text-white font-black italic shadow-2xl transition-all group-hover:scale-110 group-hover:rotate-6">
                            Z
                        </div>
                        <span className="text-2xl font-black tracking-tighter text-black">Zebra AI</span>
                    </Link>

                    <div className="space-y-1 flex-grow">
                        <p className="text-[0.7rem] font-bold tracking-[0.2em] uppercase text-black/60 mb-8 ml-4">Command Menu</p>
                        
                        <div className="space-y-2">
                            <DashboardLink href="/dashboard" icon={<RiFileTextLine size={20} />}>
                                Resumes
                            </DashboardLink>
                            <DashboardLink href="/dashboard/cover-letters" icon={<RiChat3Line size={20} />}>
                                Cover Letters
                            </DashboardLink>
                            <DashboardLink href="/dashboard/job-tracker" icon={<RiBriefcase4Line size={20} />}>
                                Job Tracker
                            </DashboardLink>
                            <DashboardLink href="/dashboard/analytics" icon={<RiBarChartGroupedLine size={20} />}>
                                Analytics
                            </DashboardLink>
                            <DashboardLink href="/dashboard/settings" icon={<RiSettings4Line size={20} />}>
                                Settings
                            </DashboardLink>
                        </div>

                        <div className="mt-12 pt-10 border-t border-black/5">
                             <p className="text-[0.7rem] font-bold tracking-[0.2em] uppercase text-black/60 mb-6 ml-4">Subscription</p>
                             <div className="bg-white/40 backdrop-blur-md rounded-[2rem] p-5 border border-white/60 group/card shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex flex-col">
                                        <span className="text-[0.7rem] font-bold text-black/50 uppercase tracking-[0.1em] mb-1">System Tier</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />
                                            <span className="text-base font-black text-black tracking-tight">{plan}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-xl font-black text-black tracking-tighter leading-none mb-1">{credits}</span>
                                        <span className="text-[0.7rem] font-bold text-black/50 uppercase tracking-widest leading-none">Units</span>
                                    </div>
                                </div>
                                <div className="w-full bg-black/[0.03] h-1 rounded-full overflow-hidden mb-6">
                                     <div className="bg-black h-full transition-all duration-1000" style={{ width: plan === "Pro" ? "100%" : "20%" }}></div>
                                </div>
                                <CreditTopUp />
                             </div>
                        </div>
                    </div>

                    <div className="pt-8 pb-12 lg:pb-12 border-t border-black/5 space-y-5 text-center">
                        <button className="w-full bg-black text-white py-4 rounded-xl font-bold text-[0.85rem] transition-all shadow-xl hover:shadow-black/20 hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 group/btn uppercase tracking-widest">
                            <RiAddLine size={20} className="group-hover/btn:rotate-90 transition-transform" />
                            New Resume
                        </button>
                        
                        <button className="w-full flex items-center justify-center lg:justify-start gap-4 px-5 py-3 text-black/50 hover:text-red-500 transition-all font-bold text-[0.7rem] uppercase tracking-widest group">
                            <RiLogoutCircleLine size={18} className="group-hover:translate-x-1 transition-transform" />
                            Log Out
                        </button>
                    </div>
                </div>
            </motion.aside>
        </>
    );
}
