import React, { Suspense } from "react";
import { SettingsView } from "@/components/dashboard/SettingsView";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings | Zebra AI",
  description: "Manage workspace preferences, editor settings, billing, and account details.",
};

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-xs text-neutral-400">Loading settings...</div>}>
      <SettingsView />
    </Suspense>
  );
}
