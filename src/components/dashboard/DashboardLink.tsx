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
      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group ${
        isActive 
          ? "bg-[#0A0A0A] text-white shadow-sm font-semibold" 
          : "text-neutral-600 hover:text-[#0A0A0A] hover:bg-neutral-100"
      }`}
    >
      <span className={`transition-transform duration-200 ${isActive ? "text-white" : "text-neutral-400 group-hover:text-[#0A0A0A]"}`}>
        {icon}
      </span>
      <span className="tracking-tight">{children}</span>
    </Link>
  );
}
