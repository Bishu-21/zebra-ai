import React, { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Sign In | Zebra AI",
  description: "Sign in or create an account on Zebra AI to build resumes, tailor them to roles, and track applications.",
};

export default function SignInPage() {
  return (
    <div className="min-h-dvh bg-muted flex flex-col justify-between p-4 sm:p-6 md:p-10 font-sans selection:bg-neutral-200">
      {/* Top Header */}
      <div className="flex items-center justify-between max-w-6xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image
            src="/zebra_star.png"
            alt="Zebra AI"
            width={28}
            height={28}
            className="w-7 h-7 object-contain group-hover:rotate-12 transition-transform duration-300"
          />
          <span className="font-bold text-sm tracking-tight text-foreground">
            Zebra AI
          </span>
        </Link>
        <Link
          href="/"
          className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full hover:bg-neutral-100/80"
        >
          ← Back to home
        </Link>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md mx-auto my-8">
        <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-8 border border-neutral-200/80">
          <Suspense fallback={<div className="py-20 text-center text-xs text-neutral-400">Loading authentication...</div>}>
            <AuthForm showHeader={true} />
          </Suspense>
        </div>
      </div>

    </div>
  );
}
