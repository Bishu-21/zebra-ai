import React from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  const user = session.user;
  const credits = (user as any).credits ?? 0;
  const plan = (user as any).plan ?? "Free";

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex font-sans text-[#0A0A0A] overflow-hidden">
      {/* Sidebar - Handles both mobile and desktop views internaly */}
      <Sidebar plan={plan} credits={credits} />

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col h-screen overflow-hidden relative">
        {/* Top Header */}
        <Header 
            userName={user.name} 
            userImage={user.image} 
            credits={credits} 
        />

        {/* Scrollable Content Area */}
        <main className="flex-grow overflow-y-auto w-full custom-scrollbar">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
