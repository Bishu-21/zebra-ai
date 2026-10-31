"use client";

import React from "react";
import { usePathname } from "next/navigation";
import {
    RiSettings4Line,
    RiArrowRightSLine,
    RiMenuLine
} from "react-icons/ri";
import { getBreadcrumbForPath } from "@/lib/constants/navigation";
import { UserAvatar } from "@/components/dashboard/UserAvatar";
import { DashboardHref } from "@/components/dashboard/DashboardLink";
import { useDemoWorkspace } from "@/context/DemoWorkspaceContext";

interface HeaderProps {
    credits: number;
    userName: string;
    userImage?: string | null;
    isNavOpen?: boolean;
    onOpenNavAction?: () => void;
    onOpenProfileAction: () => void;
    onOpenSettingsAction: () => void;
}

export function Header({ credits, userName, userImage, isNavOpen = false, onOpenNavAction, onOpenProfileAction, onOpenSettingsAction }: HeaderProps) {
    const demo = useDemoWorkspace();
    const livePath = usePathname();
    const pathname = demo?.pathname ?? livePath;
    const breadcrumbInfo = getBreadcrumbForPath(pathname);

    return (
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-neutral-200/70 flex items-center justify-between px-4 sm:px-6 md:px-10 sticky top-0 z-40 shrink-0">
            <div className="flex flex-1 items-center gap-2 min-w-0">
                {/* Mobile Menu Toggle Button */}
                {onOpenNavAction && (
                    <button
                        type="button"
                        onClick={onOpenNavAction}
                        className="lg:hidden w-11 h-11 border border-neutral-200/80 rounded-xl flex items-center justify-center text-neutral-700 bg-neutral-50 hover:bg-neutral-100 hover:text-foreground transition-colors shrink-0 shadow-2xs"
                        aria-label="Open Navigation Menu"
                        aria-controls="dashboard-navigation"
                        aria-expanded={isNavOpen}
                    >
                        <RiMenuLine aria-hidden="true" size={18} />
                    </button>
                )}

                {/* Mobile Single Title (< 768px) */}
                <div className="md:hidden flex items-center min-w-0">
                    <span className="text-sm font-bold text-foreground truncate max-w-[150px] xs:max-w-[200px] sm:max-w-xs tracking-tight">
                        {breadcrumbInfo.title}
                    </span>
                </div>

                {/* Desktop & Tablet Dynamic Breadcrumbs (>= 768px) */}
                <nav aria-label="Breadcrumbs" className="hidden md:flex items-center gap-2 text-sm font-medium text-muted-foreground min-w-0">
                    <DashboardHref href="/dashboard" className="hover:text-foreground cursor-pointer transition-colors shrink-0">
                        Zebra AI
                    </DashboardHref>
                    <RiArrowRightSLine size={16} aria-hidden="true" className="text-muted-foreground shrink-0" />
                    {breadcrumbInfo.parent ? (
                        <>
                            <DashboardHref href={breadcrumbInfo.parent.href} className="hover:text-foreground cursor-pointer transition-colors shrink-0">
                                {breadcrumbInfo.parent.label}
                            </DashboardHref>
                            <RiArrowRightSLine size={16} aria-hidden="true" className="text-muted-foreground shrink-0" />
                            <span className="text-foreground font-semibold truncate">{breadcrumbInfo.title}</span>
                        </>
                    ) : (
                        <span className="text-foreground font-semibold truncate">{breadcrumbInfo.title}</span>
                    )}
                </nav>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 md:gap-5 shrink-0">
                {/* Credits Badge (Hidden on Phone < 768px, available in drawer) */}
                <div className="hidden md:flex bg-neutral-100 px-3 py-1.5 rounded-full items-center border border-neutral-200/80 shadow-xs">
                    <span className="text-xs font-semibold text-foreground">{credits} Credits</span>
                </div>

                <button
                    type="button"
                    onClick={onOpenSettingsAction}
                    className="hidden md:flex w-11 h-11 border border-neutral-200/80 rounded-xl items-center justify-center text-neutral-600 bg-neutral-50 hover:bg-neutral-100 hover:text-foreground hover:border-neutral-300 transition-all shadow-xs group"
                    title="Preferences"
                    aria-label="Open preferences"
                    aria-haspopup="dialog"
                >
                    <RiSettings4Line size={18} aria-hidden="true" className="group-hover:rotate-45 transition-transform duration-300" />
                </button>

                {/* Profile Avatar (Visible on all breakpoints) */}
                <button
                    type="button"
                    onClick={onOpenProfileAction}
                    className="flex min-h-11 min-w-11 items-center gap-2.5 rounded-xl sm:gap-3 md:pl-3 md:border-l md:border-neutral-200/80 cursor-pointer group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                    aria-label={`Open profile for ${userName}`}
                >
                    <span className="hidden md:inline max-w-32 truncate text-sm font-semibold text-foreground group-hover:text-neutral-600 transition-colors">
                        {userName}
                    </span>
                    <div className="w-11 h-11 rounded-xl bg-primary border border-neutral-200 flex items-center justify-center text-white overflow-hidden shadow-xs group-hover:scale-105 active:scale-95 transition-all shrink-0">
                        <UserAvatar name={userName} src={userImage} size={36} className="group-hover:scale-110 transition-transform duration-300" fallbackClassName="text-xs" />
                    </div>
                </button>
            </div>
        </header>
    );
}
