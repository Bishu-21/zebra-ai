import React from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { applications as applicationsTable, resumes as resumesTable, workItems as workItemsTable, certifications as certificationsTable } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";
import { ApplicationWorkspace } from "@/components/dashboard/ApplicationWorkspace";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        redirect(`/signin?returnTo=${encodeURIComponent(`/dashboard/applications/${id}`)}`);
    }

    const application = await db.query.applications.findFirst({
        where: and(eq(applicationsTable.id, id), eq(applicationsTable.userId, session.user.id)),
        with: {
            selectedResume: true,
            resumeVersion: true,
            changes: true,
        }
    });

    if (!application) {
        notFound();
    }

    const userResumes = await db.query.resumes.findMany({
        where: eq(resumesTable.userId, session.user.id),
        orderBy: [desc(resumesTable.updatedAt)],
        columns: { id: true, title: true, updatedAt: true },
    });

    const userWorkItems = await db.query.workItems.findMany({
        where: eq(workItemsTable.userId, session.user.id),
        orderBy: [desc(workItemsTable.createdAt)],
        columns: { id: true, title: true, category: true, description: true },
    });

    const userCertifications = await db.query.certifications.findMany({
        where: eq(certificationsTable.userId, session.user.id),
        orderBy: [desc(certificationsTable.createdAt)],
        columns: { id: true, title: true, issuer: true, credentialUrl: true },
    });

    const formattedResumes = userResumes.map(r => ({
        id: r.id,
        title: r.title,
        updatedAt: r.updatedAt.toISOString(),
    }));

    const formattedApplication = {
        ...application,
        selectedWorkIds: (application.selectedWorkIds as string[]) || [],
        selectedCertIds: (application.selectedCertIds as string[]) || [],
        deadline: application.deadline ? application.deadline.toISOString() : null,
        selectedResume: application.selectedResume ? {
            id: application.selectedResume.id,
            title: application.selectedResume.title,
            updatedAt: application.selectedResume.updatedAt.toISOString(),
            content: application.selectedResume.content,
        } : null,
        resumeVersion: application.resumeVersion ? {
            id: application.resumeVersion.id,
            title: application.resumeVersion.title,
            updatedAt: application.resumeVersion.updatedAt.toISOString(),
            content: application.resumeVersion.content,
        } : null,
    };


    return (
        <ApplicationWorkspace
            initialApplication={formattedApplication}
            resumes={formattedResumes}
            workItems={userWorkItems}
            certifications={userCertifications}
        />
    );
}
