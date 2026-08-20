"use client";

import React, { useState, useEffect, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { DashboardLink } from "./DashboardLink";
import { CreditTopUp } from "./CreditTopUp";
import Link from "next/link";
import { signOut } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import {
    RiHome5Line,
    RiFileTextLine,
    RiBriefcaseLine,
    RiBarChartGroupedLine,
    RiSettings4Line,
    RiLogoutBoxRLine,
    RiCloseLine,
    RiArticleLine,
    RiLineChartLine
} from "react-icons/ri";
import { DASHBOARD_NAV_ITEMS } from "@/lib/constants/navigation";

interface SidebarProps {
    plan: string;
    credits: number;
    userName: string;
    userImage?: string | null;
    isOpen?: boolean;
    onCloseAction?: () => void;
    onOpenProfileAction: () => void;
}

const NAV_ICONS: Record<string, React.ReactNode> = {
    "/dashboard": <RiHome5Line size={18} />,
    "/dashboard/job-tracker": <RiBriefcaseLine size={18} />,
    "/dashboard/resumes": <RiFileTextLine size={18} />,
    "/dashboard/work": <RiFileTextLine size={18} />,
    "/dashboard/cover-letters": <RiArticleLine size={18} />,
    "/dashboard/portfolio": <RiBarChartGroupedLine size={18} />,
    "/dashboard/analytics": <RiLineChartLine size={18} />,
    "/dashboard/settings": <RiSettings4Line size={18} />,
};

export function Sidebar({
    plan,
    credits,
    userName,
    userImage,
    isOpen: controlledIsOpen,
    onCloseAction,
    onOpenProfileAction
}: SidebarProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    const isDrawerOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalOpen;
    const closeDrawer = useCallback(() => {
        if (onCloseAction) {
            onCloseAction();
        } else {
            setInternalOpen(false);
        }
    }, [onCloseAction]);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Close mobile drawer whenever pathname changes
    useEffect(() => {
        closeDrawer();
    }, [pathname, closeDrawer]);

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
            {/* Mobile / Tablet Overlay */}
            <AnimatePresence>
                {isDrawerOpen && (
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                        onClick={closeDrawer}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Desktop & Mobile */}
            <m.aside
                initial={false}
                animate={{
                    x: isMobile ? (isDrawerOpen ? 0 : "-100%") : 0,
                }}
                className="fixed lg:sticky top-0 left-0 h-screen w-[270px] bg-[#FAF9F6] border-r border-neutral-200/70 flex flex-col z-[70] overflow-hidden shadow-xl lg:shadow-none shrink-0"
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
                <div className="flex flex-col h-full">
                    {/* Header Logo + Plan Pill */}
                    <div className="h-16 px-6 border-b border-neutral-200/70 flex items-center justify-between shrink-0">
                        <Link href="/dashboard" className="flex items-center gap-2.5 group" onClick={closeDrawer}>
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
                                onClick={closeDrawer}
                                className="w-8 h-8 rounded-lg bg-neutral-200/60 flex items-center justify-center text-neutral-600 hover:text-[#0A0A0A] transition-colors"
                                aria-label="Close Navigation"
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
                            {DASHBOARD_NAV_ITEMS.map((item) => (
                                <DashboardLink
                                    key={item.href}
                                    href={item.href}
                                    icon={NAV_ICONS[item.href] || <RiFileTextLine size={18} />}
                                    match={item.match}
                                    onClick={closeDrawer}
                                >
                                    {item.label}
                                </DashboardLink>
                            ))}
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
