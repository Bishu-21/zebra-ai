"use client";

import React, { useState } from "react";
import { signIn, signUp, authClient } from "@/lib/auth-client";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

interface AuthFormProps {
  initialMode?: "signin" | "signup" | "forgot";
  callbackURL?: string;
  onSuccess?: () => void;
  showHeader?: boolean;
}

export function AuthForm({
  initialMode = "signin",
  callbackURL,
  onSuccess,
  showHeader = true,
}: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const resolvedCallbackURL =
    callbackURL ||
    searchParams.get("returnTo") ||
    searchParams.get("callbackURL") ||
    "/dashboard";

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (mode === "forgot") {
        const { error } = await authClient.requestPasswordReset({
          email,
          redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/signin`,
        });
        if (error) throw new Error(error.message || "Failed to send reset link");
        setSuccessMessage("Password reset email sent. Please check your inbox.");
        return;
      }

      if (mode === "signup") {
        const { error } = await signUp.email({
          email,
          password,
          name,
          callbackURL: resolvedCallbackURL,
        });
        if (error) throw new Error(error.message || "Failed to sign up");
      } else {
        const { error } = await signIn.email({
          email,
          password,
          callbackURL: resolvedCallbackURL,
        });
        if (error) throw new Error(error.message || "Failed to sign in");
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(resolvedCallbackURL);
      }
    } catch (err) {
      const authErr = err as Error;
      setError(authErr.message || "An authentication error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: "google") => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await signIn.social({
        provider,
        callbackURL: resolvedCallbackURL,
      });
      if (error) throw new Error(error.message || "Social sign-in failed");
    } catch (err) {
      const authErr = err as Error;
      setError(authErr.message || "Social sign-in failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {showHeader && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Image
              src="/zebra_star.png"
              alt="Zebra"
              width={24}
              height={24}
              className="w-6 h-6 object-contain"
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Zebra AI Access
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0A0A0A]">
            {mode === "signin"
              ? "Welcome back"
              : mode === "signup"
              ? "Create your account"
              : "Reset password"}
          </h2>
          <p className="text-xs font-normal text-neutral-500 mt-1">
            {mode === "forgot"
              ? "Enter your email to receive password recovery instructions."
              : "Sign in to manage your resumes and applications."}
          </p>
        </div>
      )}

      {error && (
        <div className="p-3 mb-4 rounded-2xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200/80">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="p-3 mb-4 rounded-2xl bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/80">
          {successMessage}
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleAuth} className="space-y-4">
        {mode === "signup" && (
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider pl-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full bg-neutral-50 border border-neutral-200/80 focus:bg-white focus:border-[#0A0A0A] focus-visible:ring-2 focus-visible:ring-[#0A0A0A] rounded-full px-4 py-2.5 text-base sm:text-xs font-semibold text-[#0A0A0A] outline-none transition-all"
            />
          </div>
        )}

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider pl-1">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            className="w-full bg-neutral-50 border border-neutral-200/80 focus:bg-white focus:border-[#0A0A0A] focus-visible:ring-2 focus-visible:ring-[#0A0A0A] rounded-full px-4 py-2.5 text-base sm:text-xs font-semibold text-[#0A0A0A] outline-none transition-all"
          />
        </div>

        {mode !== "forgot" && (
          <div className="space-y-1">
            <div className="flex items-center justify-between pl-1">
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Password
              </label>
              {mode === "signin" && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="text-[11px] text-neutral-500 hover:text-[#0A0A0A] font-medium transition-colors"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-neutral-50 border border-neutral-200/80 focus:bg-white focus:border-[#0A0A0A] focus-visible:ring-2 focus-visible:ring-[#0A0A0A] rounded-full px-4 py-2.5 text-base sm:text-xs font-semibold text-[#0A0A0A] outline-none transition-all"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-[#0A0A0A] text-white rounded-full text-xs font-bold shadow-2xs hover:bg-neutral-800 active:scale-95 transition-all disabled:opacity-40"
        >
          {isLoading
            ? "Processing..."
            : mode === "signin"
            ? "Continue with Email"
            : mode === "signup"
            ? "Create Account"
            : "Send Reset Link"}
        </button>
      </form>

      {mode !== "forgot" && (
        <>
          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200/60" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-white px-3 text-neutral-400 font-semibold tracking-wider">
                Or
              </span>
            </div>
          </div>

          {/* Social Auth */}
          <button
            type="button"
            onClick={() => handleSocialSignIn("google")}
            disabled={isLoading}
            className="w-full py-3 bg-white border border-neutral-200/80 rounded-full text-xs font-bold text-[#0A0A0A] hover:bg-neutral-100 transition-all flex items-center justify-center gap-2.5 shadow-2xs active:scale-95 disabled:opacity-40"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>
        </>
      )}

      {/* Mode Switcher */}
      <div className="mt-6 text-center pt-4 border-t border-neutral-200/60">
        <p className="text-xs font-normal text-neutral-500">
          {mode === "signin" && (
            <>
              New to Zebra AI?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-[#0A0A0A] font-bold hover:underline ml-1 transition-colors"
              >
                Create an account
              </button>
            </>
          )}
          {mode === "signup" && (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-[#0A0A0A] font-bold hover:underline ml-1 transition-colors"
              >
                Sign In
              </button>
            </>
          )}
          {mode === "forgot" && (
            <>
              Remembered your password?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-[#0A0A0A] font-bold hover:underline ml-1 transition-colors"
              >
                Back to Sign In
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
