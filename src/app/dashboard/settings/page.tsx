import React from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { User, Notification, Setting2, ShieldTick } from "iconsax-react";

export default async function SettingsPage() {
  let session;
  try {
      session = await auth.api.getSession({
          headers: await headers(),
      });
  } catch (error) {
      console.error("Settings Session Check Failed:", error);
      return (
        <div className="p-12 text-center">
            <h1 className="text-2xl font-bold mb-4">Connection Issue</h1>
            <p className="text-sm text-[#737373]">Connecting to the terminal. Please wait or refresh.</p>
        </div>
      );
  }

  const user = session?.user;

  return (
    <div className="p-10 max-w-4xl space-y-12">
      <div className="max-w-2xl">
        <h1 className="text-[2.5rem] font-bold tracking-[-0.03em] leading-tight mb-4">Settings</h1>
        <p className="text-[#6B6B6B] text-[1.05rem] leading-relaxed">
          Manage your account, plan billing, and AI preferences.
        </p>
      </div>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl border border-[#EAEAEA] p-8">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
            <User size={20} className="text-[#3B82F6]" />
            Profile Information
          </h3>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[0.65rem] font-bold uppercase tracking-wider text-[#6B6B6B]">Full Name</label>
              <div className="p-4 bg-[#F9F9F9] rounded-xl border border-[#EAEAEA] font-medium">{user?.name}</div>
            </div>
            <div className="space-y-2">
              <label className="text-[0.65rem] font-bold uppercase tracking-wider text-[#6B6B6B]">Email Address</label>
              <div className="p-4 bg-[#F9F9F9] rounded-xl border border-[#EAEAEA] font-medium">{user?.email}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#EAEAEA] p-8">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
            <ShieldTick size={20} className="text-[#3B82F6]" />
            Preferences
          </h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between py-4 border-b border-[#F9F9F9]">
              <div>
                <p className="font-bold text-sm">Automatic ATS Optimization</p>
                <p className="text-xs text-[#6B6B6B]">Automatically adjust keywords for your resumes.</p>
              </div>
              <div className="w-12 h-6 bg-[#3B82F6] rounded-full relative">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex items-center justify-between py-4">
              <div>
                <p className="font-bold text-sm">Marketing Emails</p>
                <p className="text-xs text-[#6B6B6B]">Get tips on career growth and AI trends.</p>
              </div>
              <div className="w-12 h-6 bg-[#EAEAEA] rounded-full relative">
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
