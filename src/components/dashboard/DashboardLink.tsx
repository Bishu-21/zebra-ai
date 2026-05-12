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
      className={`flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] text-[0.8rem] font-bold transition-all duration-300 relative group ${
        isActive 
          ? "bg-primary/10 text-primary shadow-sm" 
          : "text-[#737373] hover:text-[#0A0A0A] hover:bg-black/[0.03]"
      }`}
    >
      <span className={`transition-all duration-300 ${isActive ? "text-primary scale-110" : "text-[#737373]/50 group-hover:text-[#0A0A0A] group-hover:scale-110"}`}>
        {icon}
      </span>
      <span className="tracking-tight">{children}</span>
      
      {isActive && (
        <span className="absolute left-0 w-1 h-4 bg-primary rounded-r-full" />
      )}
    </Link>
  );
}
