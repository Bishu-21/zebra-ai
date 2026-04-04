"use client";

import React from "react";

import Link from "next/link";

interface AuthTriggerProps {
  className?: string;
  children: React.ReactNode;
  isLoggedIn?: boolean;
}

export function AuthTrigger({ className, children, isLoggedIn }: AuthTriggerProps) {
  if (isLoggedIn) {
    return (
      <Link href="/dashboard" className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button 
      onClick={() => window.dispatchEvent(new Event("open-auth"))}
      className={className}
    >
      {children}
    </button>
  );
}
