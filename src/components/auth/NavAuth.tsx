"use client";

import { useSession } from "@/lib/auth-client";
import { AuthTrigger } from "./AuthTrigger";
import { useState, useEffect } from "react";

export function NavAuth() {
  const { data: session, isPending } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use skeleton during hydration or while session is pending
  if (!mounted || isPending) {
    return <div className="w-28 h-10 bg-black/5 animate-pulse rounded-xl" />;
  }

  return (
    <AuthTrigger 
      isLoggedIn={!!session}
      className="bg-[#0A0A0A] text-white font-bold text-xs uppercase tracking-widest px-8 py-3 rounded-xl hover:bg-[#2A2A2A] active:scale-[0.98] transition-all duration-200 shadow-xl shadow-black/10"
    >
      {session ? "Command Center" : "Sign In"}
    </AuthTrigger>
  );
}
