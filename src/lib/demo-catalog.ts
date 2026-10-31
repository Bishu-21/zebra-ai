export const DEMO_FEATURES = [
    { id: "resumes", title: "Resumes", headline: "Resumes", description: "Import or create a resume, review it, and save versions for specific roles.", steps: ["Import a PDF, Word file, or pasted text.", "Review the mapped fields.", "Preview, then export a PDF."] },
    { id: "applications", title: "Applications", headline: "Applications", description: "Track each opportunity, its documents, and the next stage from one workspace.", steps: ["Review the role and job description.", "Open the suggestions workflow.", "Compare the master resume and application version."] },
    { id: "work", title: "Work", headline: "Work", description: "Organize your projects, internships, courses, and proof in one place.", steps: ["Add a project or experience.", "Describe your contribution and a supporting link.", "Select work for an application."] },
    { id: "cover-letters", title: "Cover letters", headline: "Cover letters", description: "Draft a letter for a role, review the wording, and export a PDF.", steps: ["Start from the role and your experience.", "Edit the draft.", "Check the letter before PDF export."] },
    { id: "portfolio", title: "Portfolio", headline: "Portfolio", description: "Choose which work and credentials appear on your public portfolio.", steps: ["Select work to include.", "Review what is public.", "Publish only when you choose."] },
    { id: "linkedin", title: "LinkedIn review", headline: "LinkedIn review", description: "Review pasted profile text and suggested wording. Zebra does not scrape or post to LinkedIn.", steps: ["Paste profile text and a target role.", "Compare a draft with its source.", "Copy the wording. Posting is on LinkedIn."] },
    { id: "analytics", title: "Analytics", headline: "Analytics", description: "Counts of resumes, applications, and reviews already saved in your workspace. This is not employer or ATS performance.", steps: ["See saved resumes and applications.", "Read recent workspace activity.", "Pick what to work on next."] },
    { id: "settings", title: "Settings", headline: "Settings", description: "Manage workspace preferences, editor settings, billing, and account details.", steps: ["Open workspace preferences.", "Set editor and preview options.", "Review account details."] },
    { id: "zebu", title: "Zebu", headline: "Zebu", description: "Ask Zebu to open a workspace page or find a saved record. It does not apply, post, or spend credits.", steps: ["Type a request to open a page.", "See the matching destination.", "Open it yourself."] },
] as const;

export type DemoFeatureId = (typeof DEMO_FEATURES)[number]["id"];
export type DemoId = "overview" | DemoFeatureId;
export const FEATURE_PHASE_SECONDS = 10;
export const FEATURE_DEMO_SECONDS = FEATURE_PHASE_SECONDS * 3;
export const OVERVIEW_FEATURE_SECONDS = 15;
export const OVERVIEW_DEMO_SECONDS = OVERVIEW_FEATURE_SECONDS * DEMO_FEATURES.length;
export const DEMO_DISCLOSURE = "Sample workspace with Jordan Hale data. No account writes or AI requests.";
export const DEMO_SAMPLE_MESSAGE = "Sample workspace. Sign in to save, review, or buy credits.";
export const COMPLETE_FEATURE_DEMO_IDS = ["resumes"] as const satisfies readonly DemoFeatureId[];

export const DEMO_HREF: Record<DemoFeatureId, string> = {
    resumes: "/dashboard/resumes",
    applications: "/dashboard/job-tracker",
    work: "/dashboard/work",
    "cover-letters": "/dashboard/cover-letters",
    portfolio: "/dashboard/portfolio",
    linkedin: "/dashboard/linkedin",
    analytics: "/dashboard/analytics",
    settings: "/dashboard/settings",
    zebu: "/dashboard",
};

export function hrefForDemoId(id: DemoId): string {
    return id === "overview" ? "/dashboard" : DEMO_HREF[id];
}

export function demoIdFromHref(href: string): DemoId {
    const path = href.split("?")[0];
    if (path.startsWith("/dashboard/resumes")) return "resumes";
    if (path.startsWith("/dashboard/job-tracker") || path.startsWith("/dashboard/applications")) return "applications";
    if (path.startsWith("/dashboard/work")) return "work";
    if (path.startsWith("/dashboard/cover-letters")) return "cover-letters";
    if (path.startsWith("/dashboard/portfolio")) return "portfolio";
    if (path.startsWith("/dashboard/linkedin")) return "linkedin";
    if (path.startsWith("/dashboard/analytics")) return "analytics";
    if (path.startsWith("/dashboard/settings")) return "settings";
    return "overview";
}

export function isPlayableDemoId(id: DemoId): boolean {
    return id === "overview" || (COMPLETE_FEATURE_DEMO_IDS as readonly string[]).includes(id);
}

export function isDemoId(value: string | null | undefined): value is DemoId {
    return value === "overview" || DEMO_FEATURES.some(feature => feature.id === value);
}

export function getDemoMoment(id: DemoId, seconds: number) {
    const duration = id === "overview" ? OVERVIEW_DEMO_SECONDS : FEATURE_DEMO_SECONDS;
    const time = Math.max(0, Math.min(duration - 0.001, Number.isFinite(seconds) ? seconds : 0));
    const feature = id === "overview"
        ? DEMO_FEATURES[Math.min(DEMO_FEATURES.length - 1, Math.floor(time / OVERVIEW_FEATURE_SECONDS))]
        : DEMO_FEATURES.find(feature => feature.id === id)!;
    const phase = id === "overview"
        ? Math.min(2, Math.floor((time % OVERVIEW_FEATURE_SECONDS) / (OVERVIEW_FEATURE_SECONDS / 3)))
        : Math.min(2, Math.floor(time / FEATURE_PHASE_SECONDS));
    return { feature, phase, duration, time, caption: feature.steps[phase] };
}
