"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

interface DashboardLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  match?: (pathname: string) => boolean;
  onClick?: () => void;
}

export function DashboardLink({
  href,
  icon,
  children,
  match,
  onClick,
}: DashboardLinkProps) {
  const pathname = usePathname();
  const isActive = match
    ? match(pathname)
    : href === "/dashboard"
    ? pathname === "/dashboard"
    : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={`flex min-h-11 items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 relative group ${
        isActive
          ? "bg-primary text-white shadow-sm font-semibold"
          : "text-neutral-600 hover:text-foreground hover:bg-neutral-100"
      }`}
    >
      <span
        className={`transition-transform duration-200 ${
          isActive
            ? "text-white"
            : "text-muted-foreground group-hover:text-foreground"
        }`}
      >
        {icon}
      </span>
      <span className="tracking-tight">{children}</span>
    </Link>
  );
}
