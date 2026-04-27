"use client";

import React from "react";
import { 
    RiPulseLine, 
    RiUser3Line, 
    RiArrowRightSLine,
    RiSearchLine,
    RiSettings3Line
} from "react-icons/ri";

interface HeaderProps {
    credits: number;
    userName: string;
    userImage?: string | null;
    onOpenSettingsAction: () => void;
    onOpenProfileAction: () => void;
}

export function Header({ credits, userName, userImage, onOpenSettingsAction, onOpenProfileAction }: HeaderProps) {
    return (
        <header className="h-20 bg-white/30 backdrop-blur-md border-b border-black/5 flex items-center justify-between px-6 md:px-10 sticky top-0 z-40 shrink-0">
            <div className="flex items-center gap-4 text-sm font-semibold text-black/70">
                <div className="hidden md:flex items-center gap-2">
                    <span className="hover:text-[#3B82F6] cursor-pointer transition-colors">Zebra AI</span>
                    <RiArrowRightSLine size={18} className="text-[#A3A3A3]" />
                    <span className="text-[#0A0A0A] font-bold">Overview</span>
                </div>
            </div>

            <div className="flex items-center gap-3 md:gap-6">
                {/* Search Bar - Desktop Only */}
                <div className="hidden lg:flex items-center gap-3 bg-black/[0.03] border border-black/5 px-4 py-2 rounded-xl w-64 group focus-within:bg-white focus-within:border-[#3B82F6] focus-within:shadow-lg focus-within:shadow-blue-500/10 transition-all duration-300">
                    <RiSearchLine size={18} className="text-[#A3A3A3] group-focus-within:text-[#3B82F6]" />
                    <input 
                        type="text" 
                        placeholder="Search resources..." 
                        className="bg-transparent border-none outline-none text-xs font-semibold w-full placeholder:text-[#A3A3A3] text-[#0A0A0A]"
                    />
                </div>

                <div className="bg-[#3B82F6]/10 px-3 md:px-4 py-1.5 rounded-full flex items-center gap-2 border border-[#3B82F6]/10 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse"></span>
                    <span className="text-[0.65rem] font-bold text-[#3B82F6] uppercase tracking-[0.1em]">{credits} Credits</span>
                </div>
                
                <button 
                    onClick={onOpenSettingsAction}
                    className="w-10 h-10 border border-black/5 rounded-xl flex items-center justify-center text-[#3B82F6] bg-[#3B82F6]/5 hover:bg-[#3B82F6]/10 hover:border-[#3B82F6]/20 transition-all relative group shadow-sm" 
                    aria-label="Diagnostics"
                >
                    <RiPulseLine size={22} className="animate-pulse group-hover:scale-110 transition-transform" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#3B82F6] rounded-full border-2 border-white shadow-sm"></span>
                </button>

                <div className="flex items-center gap-3 pl-3 md:pl-6 border-l border-black/5">
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-xs font-bold text-black">{userName}</span>
                        <span className="text-[0.6rem] font-medium text-black/60 uppercase tracking-widest">Status: Active</span>
                    </div>
                    <div 
                        onClick={onOpenProfileAction}
                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 border border-black/5 flex items-center justify-center text-white overflow-hidden shadow-sm group cursor-pointer hover:shadow-lg hover:shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        {userImage ? (
                            <img 
                                src={userImage} 
                                alt={userName} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                referrerPolicy="no-referrer"
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
