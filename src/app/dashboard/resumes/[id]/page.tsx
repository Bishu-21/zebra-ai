import React from "react";
import { ResumeEditor } from "@/components/dashboard/ResumeEditor";
import { db } from "@/lib/db";
import { resumes as resumesTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ResumeEditorPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = await paramsPromise;
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) redirect("/login");

    const resume = await db.query.resumes.findFirst({
        where: eq(resumesTable.id, params.id),
    });

    // If "new", we can handle that by seeding or just rendering an empty editor
    // For now, if not found and not "new", redirect
    if (!resume && params.id !== "new") {
        redirect("/dashboard");
    }

    return (
        <div className="h-screen overflow-hidden bg-[#F8F9FA]">
            <ResumeEditor initialData={resume} />
        </div>
    );
}
