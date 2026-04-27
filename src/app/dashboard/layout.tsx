import React from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

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
        unstable_rethrow(error);
        console.error("Dashboard Session Check Failed:", error);
        return redirect("/");
    }

    if (!session) {
        return redirect("/");
    }

    const { user } = session;
    
    // Fetch fresh user data from DB
    const currentUser = await db.query.user.findFirst({
        where: eq(userTable.id, user.id)
    });

    const credits = currentUser?.credits ?? 0;
    const plan = currentUser?.plan ?? "Free";

    return (
        <DashboardShell 
            plan={plan} 
            credits={credits} 
            userName={user.name} 
            userImage={user.image}
        >
            {children}
        </DashboardShell>
    );
}
