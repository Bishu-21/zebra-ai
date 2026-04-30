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
          ? "bg-[var(--primary)]/10 text-[var(--primary)] shadow-sm" 
          : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
      }`}
    >
      <span className={`transition-all duration-300 ${isActive ? "text-[var(--primary)] scale-110" : "text-[var(--muted-foreground)]/50 group-hover:text-[var(--foreground)] group-hover:scale-110"}`}>
        {icon}
      </span>
      <span className="tracking-tight">{children}</span>
      
      {isActive && (
        <span className="absolute left-0 w-1 h-4 bg-[var(--primary)] rounded-r-full" />
      )}
    </Link>
  );
}
