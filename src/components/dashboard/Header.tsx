"use client";

import React from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
    RiSettings4Line, 
    RiArrowRightSLine,
    RiSearchLine
} from "react-icons/ri";

interface HeaderProps {
    credits: number;
    userName: string;
    userImage?: string | null;
    onOpenSettingsAction: () => void;
    onOpenProfileAction: () => void;
}

export function Header({ credits, userName, userImage, onOpenSettingsAction, onOpenProfileAction }: HeaderProps) {
    const [searchValue, setSearchValue] = React.useState("");
    const pathname = usePathname();

    const getBreadcrumbTitle = (path: string) => {
        if (path === "/dashboard") return "Overview";
        if (path.startsWith("/dashboard/work")) return "My Work";
        if (path.startsWith("/dashboard/job-tracker")) return "Applications";
        if (path.startsWith("/dashboard/cover-letters")) return "Cover Letters";
        if (path.startsWith("/dashboard/analytics")) return "Analytics";
        if (path.startsWith("/dashboard/settings")) return "Settings";
        if (path.includes("/resumes/new")) return "New Resume";
        if (path.includes("/resumes/")) return "Resume Editor";
        return "Overview";
    };

    return (
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-neutral-200/70 flex items-center justify-between px-6 md:px-10 sticky top-0 z-40 shrink-0">
            {/* Dynamic Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-500">
                <span className="hover:text-[#0A0A0A] cursor-pointer transition-colors">Zebra AI</span>
                <RiArrowRightSLine size={16} className="text-neutral-400" />
                <span className="text-[#0A0A0A] font-semibold">{getBreadcrumbTitle(pathname)}</span>
            </div>

            <div className="flex items-center gap-3 md:gap-5">
                {/* Search Bar - Desktop Only */}
                <div className="hidden lg:flex items-center gap-2.5 bg-neutral-100/70 border border-neutral-200/80 px-3.5 py-1.5 rounded-xl w-64 group focus-within:bg-white focus-within:border-[#0A0A0A] focus-within:ring-2 focus-within:ring-black/5 transition-all duration-200">
                    <RiSearchLine size={16} className="text-neutral-400 group-focus-within:text-[#0A0A0A]" />
                    <input 
                        type="text" 
                        placeholder="Search resources..." 
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        className="bg-transparent border-none outline-none text-xs font-medium w-full placeholder:text-neutral-400 text-[#0A0A0A]"
                    />
                </div>

                {/* Credits Badge */}
                <div className="bg-neutral-100 px-3 py-1.5 rounded-full flex items-center gap-2 border border-neutral-200/80 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A]"></span>
                    <span className="text-xs font-semibold text-[#0A0A0A]">{credits} Credits</span>
                </div>
                
                {/* Clean Settings Gear Button */}
                <button 
                    onClick={onOpenSettingsAction}
                    className="w-9 h-9 border border-neutral-200/80 rounded-xl flex items-center justify-center text-neutral-600 bg-neutral-50 hover:bg-neutral-100 hover:text-[#0A0A0A] hover:border-neutral-300 transition-all shadow-xs group" 
                    title="Settings"
                    aria-label="Settings"
                >
                    <RiSettings4Line size={18} className="group-hover:rotate-45 transition-transform duration-300" />
                </button>

                {/* Profile Avatar (Removed unnecessary "Active Plan" label) */}
                <div 
                    onClick={onOpenProfileAction}
                    className="flex items-center gap-3 pl-3 border-l border-neutral-200/80 cursor-pointer group"
                >
                    <span className="hidden md:inline text-xs font-semibold text-[#0A0A0A] group-hover:text-neutral-600 transition-colors">
                        {userName}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-[#0A0A0A] border border-neutral-200 flex items-center justify-center text-white overflow-hidden shadow-xs group-hover:scale-105 active:scale-95 transition-all shrink-0">
                        {userImage ? (
                            <Image 
                                src={userImage} 
                                alt={userName} 
                                width={36}
                                height={36}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                                unoptimized
                            />
                        ) : (
                            <span className="text-xs font-bold">{userName?.charAt(0)?.toUpperCase() || "U"}</span>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
