import React, { Suspense } from "react";
import { SettingsView } from "@/components/dashboard/SettingsView";
import { Metadata } from "next";
import { ZebraLoader } from "@/components/ui/ZebraLoader";

export const metadata: Metadata = {
  title: "Settings | Zebra AI",
  description: "Manage workspace preferences, editor settings, billing, and account details.",
};

export default function SettingsPage() {
  return (
    <Suspense
      fallback={(
        <ZebraLoader
          variant="inline"
          label="Loading settings"
          detail="Checking your workspace preferences."
        />
      )}
    >
      <SettingsView />
    </Suspense>
  );
}
