import React from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";

// ZEBRA_AI_DASHBOARD_STABILIZATION_V4
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    let session = null;
    
    try {
        session = await auth.api.getSession({
            headers: await headers(),
        });
    } catch (error) {
        console.error("Dashboard Session Check Failed:", error);
        return redirect("/");
    }

    if (!session) {
        return redirect("/");
    }

    const { user } = session;
    const credits = (user as any).credits ?? 0;
    const plan = (user as any).plan ?? "Free";

    return (
        <div className="min-h-screen bg-[#FDFDFD] flex font-sans text-[#0A0A0A] overflow-hidden">
            <Sidebar plan={plan} credits={credits} />
            <div className="flex-grow flex flex-col h-screen overflow-hidden relative">
                <Header 
                    userName={user.name} 
                    userImage={user.image} 
                    credits={credits} 
                />
                <main className="flex-grow overflow-y-auto w-full custom-scrollbar">
                    <div className="mx-auto max-w-7xl">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
