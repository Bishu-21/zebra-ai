"use client";

import React, { useEffect, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { signIn, signUp } from "@/lib/auth-client";

export function AuthModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-auth", handleOpen);
    return () => window.removeEventListener("open-auth", handleOpen);
  }, []);

  const onClose = () => {
    setIsOpen(false);
    setError(null);
    setMode("signin");
  };

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === "signup") {
        const { error } = await signUp.email({
          email,
          password,
          name,
          callbackURL: "/dashboard",
        });
        if (error) throw new Error(error.message || "Failed to sign up");
      } else {
        const { error } = await signIn.email({
          email,
          password,
          callbackURL: "/dashboard",
        });
        if (error) throw new Error(error.message || "Failed to sign in");
      }
      // Successful auth - modal will likely be closed by redirect or state
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: "google") => {
    setIsLoading(true);
    try {
      await signIn.social({
        provider,
        callbackURL: "/dashboard",
      });
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 font-sans">
          {/* Backdrop */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0A0A0A]/30 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <m.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-white rounded-[16px] shadow-2xl p-8 sm:p-12 overflow-hidden border-[1px] border-[#EAEAEA]"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-[#6B6B6B] hover:text-[#0A0A0A] transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Content Header */}
            <div className="mb-10 mt-2">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-1 h-6 bg-[#3B82F6]"></span>
                <span className="text-[0.65rem] font-bold tracking-[0.08em] uppercase text-[#6B6B6B]">Zebra Platform</span>
              </div>
              <h2 className="text-[1.75rem] font-bold tracking-[-0.02em] text-[#0A0A0A] leading-tight mb-2">
                {mode === "signin" ? "Welcome back" : "Create account"}
              </h2>
              <p className="text-[#6B6B6B] text-[0.95rem]">
                {mode === "signin" 
                  ? "Precision editing for high-end digital experiences." 
                  : "Join the next generation of job acquisition."}
              </p>
            </div>

            {/* Auth Form */}
            <form onSubmit={handleAuth} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100">
                  {error}
                </div>
              )}

              {mode === "signup" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6B6B6B] mb-1.5 ml-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-[#F9F9F9] border border-[#EAEAEA] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3B82F6] transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B6B6B] mb-1.5 ml-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-[#F9F9F9] border border-[#EAEAEA] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3B82F6] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B6B6B] mb-1.5 ml-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#F9F9F9] border border-[#EAEAEA] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3B82F6] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#0A0A0A] text-white py-4 rounded-xl font-bold text-[0.95rem] hover:bg-[#2A2A2A] transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
              >
                {isLoading ? "Processing..." : mode === "signin" ? "Continue with Email" : "Create Account"}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#EAEAEA]"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-4 text-[#6B6B6B] font-bold tracking-widest">Or</span>
              </div>
            </div>

            {/* Social Auth */}
            <button 
              type="button"
              onClick={() => handleSocialSignIn("google")}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white border-[1.5px] border-[#EAEAEA] py-4 px-6 rounded-xl text-[0.95rem] font-bold text-[#0A0A0A] hover:bg-[#F6F3F2] transition-colors duration-200 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Footer Toggle */}
            <div className="mt-10 text-center pt-6 border-t border-[#EAEAEA]">
              <p className="text-[0.7rem] font-bold tracking-[0.05em] uppercase text-[#6B6B6B]">
                {mode === "signin" ? "New to the precision editor?" : "Already have an account?"}
                <button 
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")} 
                  className="text-[#3B82F6] hover:text-[#2563EB] ml-2 transition-colors uppercase"
                >
                  {mode === "signin" ? "Make an account" : "Sign In"}
                </button>
              </p>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
