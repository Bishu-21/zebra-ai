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
                    <RiArrowRightSLine size={18} className="text-muted-foreground/40" />
                    <span className="text-foreground font-bold">Overview</span>
                </div>
            </div>

            <div className="flex items-center gap-3 md:gap-6">
                {/* Search Bar - Desktop Only */}
                <div className="hidden lg:flex items-center gap-3 bg-[var(--muted)] border border-border-subtle px-4 py-2 rounded-[var(--radius-md)] w-64 group focus-within:bg-[var(--background)] focus-within:border-[var(--primary)]/30 focus-within:shadow-[var(--shadow-lg)] focus-within:shadow-primary/5 transition-all duration-300">
                    <RiSearchLine size={16} className="text-muted-foreground/40 group-focus-within:text-primary" />
                    <input 
                        type="text" 
                        placeholder="Search resources..." 
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        className="bg-transparent border-none outline-none text-xs font-semibold w-full placeholder:text-muted-foreground/40 text-foreground"
                    />
                </div>

                <div className="bg-primary/5 px-3 md:px-4 py-1.5 rounded-full flex items-center gap-2 border border-primary/10 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                    <span className="text-[0.65rem] font-bold text-primary uppercase tracking-wider">{credits} Credits</span>
                </div>
                
                <button 
                    onClick={onOpenSettingsAction}
                    className="w-10 h-10 border border-border-subtle rounded-[var(--radius-md)] flex items-center justify-center text-[var(--primary)] bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 hover:border-[var(--primary)]/20 transition-all relative group shadow-[var(--shadow-sm)]" 
                    aria-label="Diagnostics"
                >
                    <RiPulseLine size={20} className="animate-pulse group-hover:scale-110 transition-transform" />
                    <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-primary rounded-full border-2 border-background shadow-sm"></span>
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
