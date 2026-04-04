"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

interface DashboardLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardLink({ href, icon, children }: DashboardLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link 
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[0.8rem] font-black transition-all duration-300 relative group ${
        isActive 
          ? "bg-black/5 text-black shadow-inner shadow-black/5" 
          : "text-black/40 hover:text-black hover:bg-black/5"
      }`}
    >
      <span className={`transition-all duration-300 ${isActive ? "text-black scale-110" : "text-black/30 group-hover:text-black/60 group-hover:scale-110"}`}>
        {icon}
      </span>
      <span className="tracking-tight">{children}</span>
      
      {isActive && (
        <span className="absolute left-0 w-1 h-4 bg-black rounded-r-full" />
      )}
    </Link>
  );
}
