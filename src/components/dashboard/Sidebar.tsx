"use client";

import React, { useState, useEffect, useCallback } from "react";
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
    RiFolder2Line,
    RiSettings4Line,
    RiLogoutBoxRLine,
    RiCloseLine,
    RiArticleLine,
    RiLineChartLine,
    RiLinkedinLine,
    RiGlobalLine
} from "react-icons/ri";
import { DASHBOARD_NAV_ITEMS } from "@/lib/constants/navigation";
import { UserAvatar } from "@/components/dashboard/UserAvatar";
import { useDialogFocus } from "@/hooks/useDialogFocus";

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
    "/dashboard": <RiHome5Line size={18} aria-hidden="true" />,
    "/dashboard/job-tracker": <RiBriefcaseLine size={18} aria-hidden="true" />,
    "/dashboard/resumes": <RiFileTextLine size={18} aria-hidden="true" />,
    "/dashboard/work": <RiFolder2Line size={18} aria-hidden="true" />,
    "/dashboard/cover-letters": <RiArticleLine size={18} aria-hidden="true" />,
    "/dashboard/portfolio": <RiGlobalLine size={18} aria-hidden="true" />,
    "/dashboard/linkedin": <RiLinkedinLine size={18} aria-hidden="true" />,
    "/dashboard/analytics": <RiLineChartLine size={18} aria-hidden="true" />,
    "/dashboard/settings": <RiSettings4Line size={18} aria-hidden="true" />,
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
    const navigationRef = useDialogFocus<HTMLElement>(isMobile && isDrawerOpen, closeDrawer);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Close mobile drawer whenever pathname changes
    useEffect(() => {
        queueMicrotask(closeDrawer);
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

    const hideOffCanvas = isMobile && !isDrawerOpen;

    return (
        <>
            {isDrawerOpen ? (
                <div
                    className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                    onClick={closeDrawer}
                />
            ) : null}

            {/* Native aside: m.aside SSR'd as a hidden Suspense slot and failed hydration. */}
            <aside
                ref={navigationRef}
                id="dashboard-navigation"
                inert={isMobile && !isDrawerOpen ? true : undefined}
                aria-hidden={isMobile && !isDrawerOpen ? true : undefined}
                className={`fixed lg:sticky top-0 left-0 h-dvh w-[270px] max-w-[calc(100vw-2rem)] lg:max-w-none bg-muted border-r border-neutral-200/70 flex flex-col z-[70] overflow-hidden shadow-xl lg:shadow-none shrink-0 motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out ${hideOffCanvas ? "-translate-x-full" : "translate-x-0"}`}
            >
                <div className="flex flex-col h-full">
                    {/* Header Logo */}
                    <div className="h-16 px-6 border-b border-neutral-200/70 flex items-center justify-between shrink-0">
                        <Link href="/dashboard" className="flex items-center gap-2.5 group" onClick={closeDrawer}>
                            <Image
                                src="/zebra_star.svg"
                                alt="Zebra AI"
                                width={28}
                                height={28}
                                className="w-7 h-7 object-contain group-hover:scale-105 transition-transform"
                            />
                            <h1 className="text-lg font-bold tracking-tight text-foreground">Zebra AI</h1>
                        </Link>

                        {isMobile && (
                            <button
                                onClick={closeDrawer}
                                className="w-11 h-11 rounded-lg bg-neutral-200/60 flex items-center justify-center text-neutral-600 hover:text-foreground transition-colors"
                                aria-label="Close Navigation"
                            >
                                <RiCloseLine size={18} aria-hidden="true" />
                            </button>
                        )}
                    </div>

                    {/* Menu Navigation Links */}
                    <div className="p-6 space-y-1 flex-grow overflow-y-auto custom-scrollbar">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
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
                                    <span className="text-xs font-semibold text-foreground">{plan} Plan</span>
                                    <span className="text-xs font-bold text-muted-foreground">{credits} Credits</span>
                                </div>
                                <p className="text-xs font-normal text-muted-foreground leading-relaxed">
                                    Use credits for resume reviews, tailoring, and cover letters.
                                </p>
                                <CreditTopUp />
                             </div>
                        </div>
                    </div>

                    {/* Bottom User Profile Section */}
                    <div className="px-6 py-4 mt-auto border-t border-neutral-200/60 shrink-0">
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-neutral-200">
                          <button
                            type="button"
                            onClick={onOpenProfileAction}
                            aria-label={`Open profile for ${userName}`}
                            className="group flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg text-left hover:bg-muted transition-colors"
                          >
                            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center overflow-hidden shadow-xs shrink-0">
                                <UserAvatar name={userName} src={userImage} size={32} fallbackClassName="text-xs" />
                            </div>

                            <div className="flex-grow min-w-0">
                                <p className="text-xs font-semibold text-foreground truncate">{userName}</p>
                                <p className="text-xs font-medium text-muted-foreground">{plan} Tier</p>
                            </div>
                          </button>
                            <button
                                type="button"
                                onClick={handleSignOut}
                                className="w-11 h-11 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                                title="Sign Out"
                                aria-label="Sign out"
                            >
                                <RiLogoutBoxRLine size={16} aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
