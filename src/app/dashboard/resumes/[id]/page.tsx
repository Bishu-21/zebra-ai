import React from "react";
import { ResumeEditor } from "@/components/dashboard/ResumeEditor";
import { db } from "@/lib/db";
import { resumes as resumesTable, resumeVersions as resumeVersionsTable } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";

export default async function ResumeEditorPage(props: { 
    params: Promise<{ id: string }>;
    searchParams: Promise<{ version?: string }>;
}) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) redirect("/login");

    // Skip DB query for "new" — only fetch existing resumes
    let resume = null;
    let isStripeVersion = false;
    let versionTitle = null;

    if (params.id !== "new") {
        try {
            resume = await db.query.resumes.findFirst({
                where: and(
                    eq(resumesTable.id, params.id),
                    eq(resumesTable.userId, session.user.id)
                )
            });
            if (!resume) redirect("/dashboard");

            if (searchParams.version) {
                const version = await db.query.resumeVersions.findFirst({
                    where: and(
                        eq(resumeVersionsTable.id, searchParams.version),
                        eq(resumeVersionsTable.userId, session.user.id)
                    ),
                });
                if (version && version.resumeId === resume.id) {
                    resume.content = version.content;
                    isStripeVersion = true;
                    versionTitle = version.title;
                }
            }
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
                    title: versionTitle || resume.title,
                    content: resume.content || ""
                } : undefined}
                isStripeVersion={isStripeVersion}
                versionTitle={versionTitle}
            />
        </div>
    );
}
