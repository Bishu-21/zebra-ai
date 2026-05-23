"use client";

import React from "react";
import Image from "next/image";
import { 
    RiPulseLine, 
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

    return (
        <header className="h-20 bg-background/40 backdrop-blur-md border-b border-border-subtle flex items-center justify-between px-6 md:px-10 sticky top-0 z-40 shrink-0">
            <div className="flex items-center gap-4 text-sm font-semibold text-muted-foreground/70">
                <div className="hidden md:flex items-center gap-2">
                    <span className="hover:text-primary cursor-pointer transition-colors">Zebra AI</span>
                    <RiArrowRightSLine size={18} className="text-[#A3A3A3]" />
                    <span className="text-[#0A0A0A] font-bold">Overview</span>
                </div>
            </div>

            <div className="flex items-center gap-3 md:gap-6">
                {/* Search Bar - Desktop Only */}
                <div className="hidden lg:flex items-center gap-3 bg-black/[0.03] border border-black/5 px-4 py-2 rounded-xl w-64 group focus-within:bg-white focus-within:border-primary focus-within:shadow-lg focus-within:shadow-black/5 transition-all duration-300">
                    <RiSearchLine size={18} className="text-[#A3A3A3] group-focus-within:text-primary" />
                    <input 
                        type="text" 
                        placeholder="Search resources..." 
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        className="bg-transparent border-none outline-none text-xs font-semibold w-full placeholder:text-muted-foreground/40 text-foreground"
                    />
                </div>

                <div className="bg-primary/10 px-3 md:px-4 py-1.5 rounded-full flex items-center gap-2 border border-primary/10 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                    <span className="text-[0.65rem] font-bold text-primary uppercase tracking-[0.1em]">{credits} Credits</span>
                </div>
                
                <button 
                    onClick={onOpenSettingsAction}
                    className="w-10 h-10 border border-black/5 rounded-xl flex items-center justify-center text-primary bg-primary/5 hover:bg-primary/10 hover:border-primary/20 transition-all relative group shadow-sm" 
                    aria-label="Diagnostics"
                >
                    <RiPulseLine size={22} className="animate-pulse group-hover:scale-110 transition-transform" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-white shadow-sm"></span>
                </button>

                <div className="flex items-center gap-3 pl-3 md:pl-6 border-l border-border-subtle">
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-xs font-bold text-foreground">{userName}</span>
                        <span className="text-[0.6rem] font-bold text-muted-foreground uppercase tracking-widest">Status: Active</span>
                    </div>
                    <div 
                        onClick={onOpenProfileAction}
                        className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--secondary)] border border-border-subtle flex items-center justify-center text-white overflow-hidden shadow-[var(--shadow-sm)] group cursor-pointer hover:shadow-[var(--shadow-lg)] hover:shadow-foreground/10 hover:scale-[1.02] active:scale-[0.95] transition-all"
                    >
                        {userImage ? (
                            <Image 
                                src={userImage} 
                                alt={userName} 
                                width={40}
                                height={40}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                unoptimized
                            />
                        ) : (
                            <span className="text-sm font-black">{userName?.charAt(0)?.toUpperCase() || "U"}</span>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
