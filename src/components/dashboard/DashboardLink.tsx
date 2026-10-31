"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { type ReactNode } from "react";
import { useDemoWorkspace } from "@/context/DemoWorkspaceContext";

interface DashboardLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  match?: (pathname: string) => boolean;
  onClick?: () => void;
}

const navClassName = (isActive: boolean) =>
  `flex min-h-11 items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 relative group ${
    isActive
      ? "bg-primary text-white shadow-sm font-semibold"
      : "text-neutral-600 hover:text-foreground hover:bg-neutral-100"
  }`;

export function DashboardHref({
  href,
  className,
  children,
  onClick,
  "aria-label": ariaLabel,
}: {
  href: string;
  className?: string;
  children?: ReactNode;
  onClick?: () => void;
  "aria-label"?: string;
}) {
  const demo = useDemoWorkspace();
  if (demo) {
    return (
      <button
        type="button"
        className={className}
        aria-label={ariaLabel}
        onClick={() => {
          onClick?.();
          demo.navigate(href);
        }}
      >
        {children}
      </button>
    );
  }
  return (
    <Link href={href} className={className} onClick={onClick} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

export function DashboardLink({
  href,
  icon,
  children,
  match,
  onClick,
}: DashboardLinkProps) {
  const demo = useDemoWorkspace();
  const livePath = usePathname();
  const pathname = demo?.pathname ?? livePath;
  const isActive = match
    ? match(pathname)
    : href === "/dashboard"
    ? pathname === "/dashboard"
    : pathname.startsWith(href);

  const content = (
    <>
      <span
        aria-hidden="true"
        className={`shrink-0 transition-transform duration-200 ${
          isActive
            ? "text-white"
            : "text-muted-foreground group-hover:text-foreground"
        }`}
      >
        {icon}
      </span>
      <span className="tracking-tight">{children}</span>
    </>
  );

  if (demo) {
    return (
      <button
        type="button"
        onClick={() => {
          onClick?.();
          demo.navigate(href);
        }}
        aria-current={isActive ? "page" : undefined}
        className={navClassName(isActive)}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={navClassName(isActive)}
    >
      {content}
    </Link>
  );
}
