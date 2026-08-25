import { getSafeSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
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
        if (isRedirectError(error)) throw error;
        const msg = sanitizeSecretText(error instanceof Error ? error.message : String(error));
        console.error("Dashboard Session Check Failed:", msg);
        return (
            <main className="min-h-screen bg-[#FAF9F6] px-6 py-20 text-center">
                <div className="mx-auto max-w-md rounded-3xl border border-amber-200 bg-white p-8 shadow-sm">
                    <h1 className="text-2xl font-bold text-[#0A0A0A]">Session service unavailable</h1>
                    <p className="mt-3 text-sm leading-6 text-neutral-600">
                        Zebra AI could not verify your session. Your data is safe; wait a moment and try again.
                    </p>
                    <a
                        href="/dashboard"
                        className="mt-6 inline-flex rounded-xl bg-[#0A0A0A] px-5 py-3 text-sm font-semibold text-white"
                    >
                        Try again
                    </a>
                </div>
            </main>
        );
    }

    if (!session) {
        return redirect("/signin?returnTo=/dashboard");
    }

    const { user } = session;
    let credits = 0;
    let plan = "Free";
    let shouldPromptCareerProfile = false;

    try {
        // Fetch fresh user data from DB with fallback for transient DB outages
        const currentUser = await db.query.user.findFirst({
            where: eq(userTable.id, user.id)
        });
        if (currentUser) {
            credits = currentUser.credits ?? 0;
            plan = currentUser.plan ?? "Free";
            shouldPromptCareerProfile = currentUser.careerProfileStatus === "pending";
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
            shouldPromptCareerProfile={shouldPromptCareerProfile}
        >
            {children}
        </DashboardShell>
    );
}
