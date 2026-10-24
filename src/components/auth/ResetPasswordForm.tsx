"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export function ResetPasswordForm({ token, invalid }: { token?: string; invalid?: boolean }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await authClient.resetPassword({ token, newPassword: password });
      if (result.error) throw new Error(result.error.message || "Could not reset password.");
      setDone(true);
      setPassword("");
      setConfirm("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not reset password.");
    } finally {
      setLoading(false);
    }
  };

  if (done) return <div className="space-y-4"><h1 className="text-2xl font-bold">Password updated</h1><p>Your password has been reset. Sign in with your new password.</p><Link href="/signin" className="inline-block rounded-full bg-black px-5 py-3 text-sm font-semibold text-white">Sign in</Link></div>;
  if (invalid || !token) return <div className="space-y-4"><h1 className="text-2xl font-bold">Reset link unavailable</h1><p>This link is invalid or expired. Request a new one from the sign-in page.</p><Link href="/signin" className="inline-block rounded-full bg-black px-5 py-3 text-sm font-semibold text-white">Request a new link</Link></div>;

  return <form onSubmit={submit} className="space-y-5">
    <div><h1 className="text-2xl font-bold">Choose a new password</h1><p className="mt-2 text-sm text-neutral-600">Use at least eight characters.</p></div>
    <label className="block text-sm font-semibold">New password<input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={event => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3" /></label>
    <label className="block text-sm font-semibold">Confirm new password<input type="password" autoComplete="new-password" required minLength={8} value={confirm} onChange={event => setConfirm(event.target.value)} className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3" /></label>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <button type="submit" disabled={loading} className="w-full rounded-full bg-black px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{loading ? "Updating password..." : "Reset password"}</button>
  </form>;
}
