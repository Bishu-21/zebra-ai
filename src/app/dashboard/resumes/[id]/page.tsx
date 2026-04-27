import React from "react";
import { ResumeEditor } from "@/components/dashboard/ResumeEditor";
import { db } from "@/lib/db";
import { resumes as resumesTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";

export default async function ResumeEditorPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = await paramsPromise;
    let session;
    try {
        session = await auth.api.getSession({
            headers: await headers(),
        });
    } catch (error) {
        unstable_rethrow(error);
        console.error("Resume Editor Session Check Failed:", error);
        return redirect("/dashboard");
    }

    if (!session) redirect("/login");

    // Skip DB query for "new" — only fetch existing resumes
    let resume = null;
    if (params.id !== "new") {
        try {
            resume = await db.query.resumes.findFirst({
                where: eq(resumesTable.id, params.id),
            });
            if (!resume) redirect("/dashboard");
        } catch (error) {
            unstable_rethrow(error);
            redirect("/dashboard");
        }
    }

    return (
        <div className="h-screen overflow-hidden bg-[#F8F9FA]">
            <ResumeEditor 
                initialData={resume ? {
                    id: resume.id,
                    title: resume.title,
                    content: resume.content || ""
                } : undefined} 
            />
        </div>
    );
}
