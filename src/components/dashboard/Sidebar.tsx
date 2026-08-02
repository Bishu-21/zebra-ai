"use client";

import React, { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { DashboardLink } from "./DashboardLink";
import { CreditTopUp } from "./CreditTopUp";
import Link from "next/link";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
    RiHome5Line, 
    RiFileTextLine, 
    RiBriefcaseLine, 
    RiBarChartGroupedLine, 
    RiSettings4Line, 
    RiLogoutBoxRLine,
    RiMenuLine,
    RiCloseLine
} from "react-icons/ri";

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
        e.stopPropagation();
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
                    className="lg:hidden fixed top-3 left-4 z-[70] w-10 h-10 bg-white border border-neutral-200 rounded-xl flex items-center justify-center text-[#0A0A0A] shadow-sm hover:bg-neutral-50 transition-colors"
                    aria-label="Open Menu"
                >
                    <RiMenuLine size={20} />
                </button>
            )}

            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <m.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
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
                className="fixed lg:sticky top-0 left-0 h-screen w-[270px] bg-[#FAF9F6] border-r border-neutral-200/70 flex flex-col z-[70] overflow-hidden shadow-xl lg:shadow-none shrink-0"
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
                <div className="flex flex-col h-full">
                    {/* Collinear Header Logo + Plan Pill */}
                    <div className="h-16 px-6 border-b border-neutral-200/70 flex items-center justify-between shrink-0">
                        <Link href="/dashboard" className="flex items-center gap-2.5 group" onClick={() => setIsOpen(false)}>
                            <Image 
                                src="/zebra_star.svg" 
                                alt="Zebra AI" 
                                width={28}
                                height={28}
                                className="w-7 h-7 object-contain group-hover:scale-105 transition-transform"
                            />
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-bold tracking-tight text-[#0A0A0A]">Zebra AI</h1>
                                <span className="px-2 py-0.5 text-[10px] font-semibold bg-neutral-200/80 text-[#0A0A0A] rounded-full border border-neutral-300">
                                    {plan}
                                </span>
                            </div>
                        </Link>
                        
                        {isMobile && (
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 rounded-lg bg-neutral-200/60 flex items-center justify-center text-neutral-600 hover:text-[#0A0A0A]"
                            >
                                <RiCloseLine size={18} />
                            </button>
                        )}
                    </div>

                    {/* Menu Navigation Links */}
                    <div className="p-6 space-y-1 flex-grow overflow-y-auto custom-scrollbar">
                        <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2 px-3">
                            Workspace
                        </p>
                        
                        <div className="space-y-1">
                            <DashboardLink href="/dashboard" icon={<RiHome5Line size={18} />}>
                                Home
                            </DashboardLink>
                            <DashboardLink href="/dashboard/job-tracker" icon={<RiBriefcaseLine size={18} />}>
                                My Applications
                            </DashboardLink>
                            <DashboardLink href="/dashboard/resumes" icon={<RiFileTextLine size={18} />}>
                                My Resume
                            </DashboardLink>
                            <DashboardLink href="/dashboard/work" icon={<RiFileTextLine size={18} />}>
                                My Work
                            </DashboardLink>
                            <DashboardLink href="/dashboard/portfolio" icon={<RiBarChartGroupedLine size={18} />}>
                                Portfolio
                            </DashboardLink>
                            <button 
                                onClick={onOpenSettingsAction}
                                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-neutral-600 hover:text-[#0A0A0A] hover:bg-neutral-100/80 transition-all group"
                            >
                                <RiSettings4Line size={18} className="text-neutral-400 group-hover:text-[#0A0A0A] transition-colors" />
                                <span>Settings</span>
                            </button>
                        </div>

                        {/* Account Plan Card */}
                        <div className="mt-8 pt-6 border-t border-neutral-200/60">
                             <div className="relative bg-white border border-neutral-200/70 rounded-2xl p-4 flex flex-col space-y-3 shadow-2xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-[#0A0A0A]">{plan} Plan</span>
                                    <span className="text-xs font-bold text-neutral-500">{credits} Credits</span>
                                </div>
                                <p className="text-[11px] font-normal text-neutral-500 leading-relaxed">
                                    Get credits to tailor applications & build proof.
                                </p>
                                <CreditTopUp />
                             </div>
                        </div>
                    </div>

                    {/* Bottom User Profile Section */}
                    <div className="px-6 py-4 mt-auto border-t border-neutral-200/60 shrink-0">
                        <div 
                            onClick={onOpenProfileAction}
                            className="group flex items-center gap-3 p-2 rounded-xl bg-white border border-neutral-200/80 hover:border-neutral-300 hover:shadow-xs transition-all cursor-pointer"
                        >
                            <div className="w-8 h-8 rounded-lg bg-[#0A0A0A] text-white flex items-center justify-center overflow-hidden shadow-xs shrink-0">
                                {userImage ? (
                                    <Image 
                                        src={userImage} 
                                        alt={userName} 
                                        width={32} 
                                        height={32} 
                                        className="w-full h-full object-cover" 
                                        unoptimized
                                    />
                                ) : (
                                    <span className="text-xs font-bold">{userName.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            
                            <div className="flex-grow min-w-0">
                                <p className="text-xs font-semibold text-[#0A0A0A] truncate">{userName}</p>
                                <p className="text-[11px] font-medium text-neutral-400">{plan} Tier</p>
                            </div>

                            <button 
                                onClick={handleSignOut}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                                title="Sign Out"
                            >
                                <RiLogoutBoxRLine size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </m.aside>
        </>
    );
}
