import { ApplicationWorkspace } from "@/components/dashboard/ApplicationWorkspace";
import { APPLICATION_WORKSPACE_FIXTURE } from "@/lib/application-workspace-fixture";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default function ApplicationWorkspaceCapturePage() {
    if (process.env.NODE_ENV === "production") notFound();

    return (
        <div className="min-h-screen bg-[#FAF9F6] font-sans text-foreground">
            <Suspense>
                <ApplicationWorkspace
                    initialApplication={APPLICATION_WORKSPACE_FIXTURE.application}
                    resumes={APPLICATION_WORKSPACE_FIXTURE.resumes}
                    workItems={APPLICATION_WORKSPACE_FIXTURE.workItems}
                />
            </Suspense>
        </div>
    );
}
