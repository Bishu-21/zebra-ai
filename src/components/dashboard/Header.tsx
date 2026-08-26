"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    RiSettings4Line,
    RiArrowRightSLine,
    RiMenuLine,
    RiMicLine
} from "react-icons/ri";
import { getBreadcrumbForPath } from "@/lib/constants/navigation";
import { useZebu } from "@/context/ZebuContext";
import { UserAvatar } from "@/components/dashboard/UserAvatar";

interface HeaderProps {
    credits: number;
    userName: string;
    userImage?: string | null;
    isNavOpen?: boolean;
    onOpenNavAction?: () => void;
    onOpenProfileAction: () => void;
}

export function Header({ credits, userName, userImage, isNavOpen = false, onOpenNavAction, onOpenProfileAction }: HeaderProps) {
    const pathname = usePathname();
    const zebu = useZebu();
    const breadcrumbInfo = getBreadcrumbForPath(pathname);

    return (
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-neutral-200/70 flex items-center justify-between px-4 sm:px-6 md:px-10 sticky top-0 z-40 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
                {/* Mobile Menu Toggle Button */}
                {onOpenNavAction && (
                    <button
                        type="button"
                        onClick={onOpenNavAction}
                        className="lg:hidden w-9 h-9 border border-neutral-200/80 rounded-xl flex items-center justify-center text-neutral-700 bg-neutral-50 hover:bg-neutral-100 hover:text-[#0A0A0A] transition-colors shrink-0 shadow-2xs"
                        aria-label="Open Navigation Menu"
                        aria-controls="dashboard-navigation"
                        aria-expanded={isNavOpen}
                    >
                        <RiMenuLine aria-hidden="true" size={18} />
                    </button>
                )}

                {/* Mobile Single Title (< 768px) */}
                <div className="md:hidden flex items-center min-w-0">
                    <span className="text-sm font-bold text-[#0A0A0A] truncate max-w-[150px] xs:max-w-[200px] sm:max-w-xs tracking-tight">
                        {breadcrumbInfo.title}
                    </span>
                </div>

                {/* Desktop & Tablet Dynamic Breadcrumbs (>= 768px) */}
                <nav aria-label="Breadcrumbs" className="hidden md:flex items-center gap-2 text-sm font-medium text-neutral-500 min-w-0">
                    <Link href="/dashboard" className="hover:text-[#0A0A0A] cursor-pointer transition-colors shrink-0">
                        Zebra AI
                    </Link>
                    <RiArrowRightSLine size={16} className="text-neutral-400 shrink-0" />
                    {breadcrumbInfo.parent ? (
                        <>
                            <Link href={breadcrumbInfo.parent.href} className="hover:text-[#0A0A0A] cursor-pointer transition-colors shrink-0">
                                {breadcrumbInfo.parent.label}
                            </Link>
                            <RiArrowRightSLine size={16} className="text-neutral-400 shrink-0" />
                            <span className="text-[#0A0A0A] font-semibold truncate">{breadcrumbInfo.title}</span>
                        </>
                    ) : (
                        <span className="text-[#0A0A0A] font-semibold truncate">{breadcrumbInfo.title}</span>
                    )}
                </nav>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 md:gap-5 shrink-0">
                <button
                    type="button"
                    onClick={() => zebu.open(true)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-800 transition hover:border-neutral-300 hover:bg-neutral-100"
                    title="Talk to Zebu"
                    aria-label="Open Zebu and start listening"
                >
                    <RiMicLine size={18} />
                </button>
                {/* Credits Badge (Hidden on Phone < 768px, available in drawer) */}
                <div className="hidden md:flex bg-neutral-100 px-3 py-1.5 rounded-full items-center border border-neutral-200/80 shadow-xs">
                    <span className="text-xs font-semibold text-[#0A0A0A]">{credits} Credits</span>
                </div>

                {/* Direct Link to Settings Route (Hidden on Phone < 768px, available in drawer) */}
                <Link
                    href="/dashboard/settings"
                    className="hidden md:flex w-9 h-9 border border-neutral-200/80 rounded-xl items-center justify-center text-neutral-600 bg-neutral-50 hover:bg-neutral-100 hover:text-[#0A0A0A] hover:border-neutral-300 transition-all shadow-xs group"
                    title="Settings"
                    aria-label="Settings"
                >
                    <RiSettings4Line size={18} className="group-hover:rotate-45 transition-transform duration-300" />
                </Link>

                {/* Profile Avatar (Visible on all breakpoints) */}
                <button
                    type="button"
                    onClick={onOpenProfileAction}
                    className="flex items-center gap-2.5 rounded-xl sm:gap-3 md:pl-3 md:border-l md:border-neutral-200/80 cursor-pointer group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                    aria-label={`Open profile for ${userName}`}
                >
                    <span className="hidden md:inline text-xs font-semibold text-[#0A0A0A] group-hover:text-neutral-600 transition-colors">
                        {userName}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-[#0A0A0A] border border-neutral-200 flex items-center justify-center text-white overflow-hidden shadow-xs group-hover:scale-105 active:scale-95 transition-all shrink-0">
                        <UserAvatar name={userName} src={userImage} size={36} className="group-hover:scale-110 transition-transform duration-300" fallbackClassName="text-xs" />
                    </div>
                </button>
            </div>
        </header>
    );
}
