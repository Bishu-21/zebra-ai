"use client";

import React from "react";
import { 
    RiNotification3Line, 
    RiUser3Line, 
    RiArrowRightSLine,
    RiSearchLine
} from "react-icons/ri";

interface HeaderProps {
    credits: number;
    userName: string;
    userImage?: string | null;
}

export function Header({ credits, userName, userImage }: HeaderProps) {
    return (
        <header className="h-20 bg-white/30 backdrop-blur-md border-b border-black/5 flex items-center justify-between px-6 md:px-10 sticky top-0 z-40 shrink-0">
            <div className="flex items-center gap-4 text-sm font-semibold text-black/70">
                <div className="hidden md:flex items-center gap-2">
                    <span className="hover:text-black cursor-pointer transition-colors">Zebra AI</span>
                    <RiArrowRightSLine size={18} className="text-black/60" />
                    <span className="text-black italic">Command Center</span>
                </div>
            </div>

            <div className="flex items-center gap-3 md:gap-6">
                {/* Search Bar - Desktop Only */}
                <div className="hidden lg:flex items-center gap-3 bg-black/5 border border-black/5 px-4 py-2 rounded-xl w-64 group focus-within:bg-white/50 focus-within:border-black/10 transition-all duration-300">
                    <RiSearchLine size={18} className="text-black/70 group-focus-within:text-black" />
                    <input 
                        type="text" 
                        placeholder="Search resources..." 
                        className="bg-transparent border-none outline-none text-xs font-medium w-full placeholder:text-black/50 text-black"
                    />
                </div>

                <div className="bg-black/5 px-3 md:px-4 py-1.5 rounded-full flex items-center gap-2 border border-black/5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-black/60 animate-pulse"></span>
                    <span className="text-[0.65rem] font-bold text-black/60 uppercase tracking-[0.1em]">{credits} Credits</span>
                </div>
                
                <button className="w-10 h-10 border border-black/5 rounded-xl flex items-center justify-center text-black/70 hover:text-black hover:bg-white/50 hover:border-black/10 transition-all relative group" aria-label="Notifications">
                    <RiNotification3Line size={20} className="group-hover:scale-110 transition-transform" />
                    <span className="absolute top-2.5 right-2 word-spacing-0 w-2 h-2 bg-black rounded-full border-2 border-white"></span>
                </button>

                <div className="flex items-center gap-3 pl-3 md:pl-6 border-l border-black/5">
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-xs font-bold text-black">{userName}</span>
                        <span className="text-[0.6rem] font-medium text-black/60 uppercase tracking-widest">Active session</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-black/5 border border-black/5 flex items-center justify-center text-black/70 overflow-hidden shadow-sm group cursor-pointer hover:border-black/20 transition-all">
                        {userImage ? (
                            <img src={userImage} alt={userName} className="w-full h-full object-cover" />
                        ) : (
                            <RiUser3Line size={20} className="group-hover:scale-110 transition-transform" />
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
