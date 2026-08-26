"use client";

import { useSession } from "@/lib/auth-client";
import { AuthTrigger } from "./AuthTrigger";
import { useHydrated } from "@/hooks/useHydrated";

export function NavAuth() {
  const { data: session, isPending } = useSession();
  const mounted = useHydrated();

  // Use skeleton during hydration or while session is pending
  if (!mounted || isPending) {
    return <div className="w-28 h-10 bg-black/5 rounded-xl" />;
  }

  return (
    <AuthTrigger
      isLoggedIn={!!session}
      className="bg-[#0A0A0A] text-white font-bold text-xs uppercase tracking-widest px-8 py-3 rounded-xl hover:bg-[#2A2A2A] active:scale-[0.98] transition-all duration-200 shadow-xl shadow-black/10"
    >
      {session ? "Dashboard" : "Sign In"}
    </AuthTrigger>
  );
}
