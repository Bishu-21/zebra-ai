import type { ApplicationData, UserResume, UserWorkItem } from "@/components/dashboard/ApplicationWorkspace";

/** Synthetic Applications workspace fixture. Do not use real accounts. */
export const APPLICATION_WORKSPACE_FIXTURE = {
    application: {
        id: "demo-application-riverbend",
        company: "Riverbend Civic Lab",
        position: "Frontend Engineer",
        jobDescription: "Build accessible React interfaces for civic grants. TypeScript, Next.js, and documented evidence required.",
        url: "https://example.com/jobs/frontend-engineer",
        status: "Preparing",
        selectedResumeId: "demo-resume-jordan-hale",
        selectedWorkIds: ["demo-work-grants-portal"],
        selectedCertIds: [],
        resumeVersionId: null,
        deadline: "2026-11-14",
        notes: "Synthetic follow-up note for layout review.",
        outcome: null,
        selectedResume: {
            id: "demo-resume-jordan-hale",
            title: "Jordan Hale — Frontend",
            updatedAt: "2026-10-20T12:00:00.000Z",
            content: "Jordan Hale, Frontend Engineer, Portland OR.",
        },
        resumeVersion: null,
        changes: [
            {
                id: "demo-change-1",
                section: "Experience",
                changeType: "rewrite",
                originalText: "Worked on the grants portal.",
                suggestedText: "Rebuilt the grants portal in React so applicants can save drafts.",
                userEdits: null,
                status: "pending",
            },
            {
                id: "demo-change-2",
                section: "Skills",
                changeType: "add",
                originalText: null,
                suggestedText: "Add TypeScript and accessible form patterns.",
                userEdits: null,
                status: "pending",
            },
        ],
    } satisfies ApplicationData,
    resumes: [
        {
            id: "demo-resume-jordan-hale",
            title: "Jordan Hale — Frontend",
            updatedAt: "2026-10-20T12:00:00.000Z",
        },
    ] satisfies UserResume[],
    workItems: [
        {
            id: "demo-work-grants-portal",
            title: "Grants portal rebuild",
            category: "Project",
            description: "Accessible draft-and-submit flow for civic grant applicants.",
        },
    ] satisfies UserWorkItem[],
};
