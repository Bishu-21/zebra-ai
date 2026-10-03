import React, { Suspense } from "react";
import { SettingsView } from "@/components/dashboard/SettingsView";
import { isGitHubAppConfigured } from "@/lib/env";
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
      <SettingsView connectionProviders={{ linkedin: Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET), github: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) }} githubAppConfigured={isGitHubAppConfigured()} />
    </Suspense>
  );
}
