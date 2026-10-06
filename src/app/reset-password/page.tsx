import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = { title: "Reset Password | Zebra AI" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token, error } = await searchParams;
  return <main className="flex min-h-dvh items-center justify-center bg-[#FAF9F6] p-5"><div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-8 shadow-xl"><ResetPasswordForm token={token} invalid={Boolean(error)} /></div></main>;
}
