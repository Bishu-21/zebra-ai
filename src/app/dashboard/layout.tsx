import { getSafeSession } from "@/lib/auth-helpers";
import { redirect, unstable_rethrow } from "next/navigation";
import { db, sanitizeSecretText } from "@/lib/db";
import { user as userTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    let session = null;
    
    try {
        session = await getSafeSession();
    } catch (error) {
        unstable_rethrow(error);
        const msg = sanitizeSecretText(error instanceof Error ? error.message : String(error));
        console.error("Dashboard Session Check Failed:", msg);
        return redirect("/");
    }

    if (!session) {
        return redirect("/");
    }

    const { user } = session;
    let credits = 0;
    let plan = "Free";
    
    try {
        // Fetch fresh user data from DB with fallback for transient DB outages
        const currentUser = await db.query.user.findFirst({
            where: eq(userTable.id, user.id)
        });
        if (currentUser) {
            credits = currentUser.credits ?? 0;
            plan = currentUser.plan ?? "Free";
        }
    } catch (error) {
        const msg = sanitizeSecretText(error instanceof Error ? error.message : String(error));
        console.warn("[Dashboard Layout] DB query degraded mode:", msg);
    }

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
