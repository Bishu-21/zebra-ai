export const DEMO_FEATURES = [
    { id: "resumes", title: "Resumes", headline: "Your experience, clearly presented.", description: "Import a resume, review its fields, edit your experience, and prepare a PDF.", steps: ["Start with the resume you already have.", "Review the fields and refine your experience.", "Preview the document before exporting a PDF."] },
    { id: "applications", title: "Applications", headline: "Every change stays in your hands.", description: "Keep job details together and review proposed changes before using them.", steps: ["Bring the role and your original resume together.", "Read suggestions before approving or rejecting them.", "Keep your original and prepare a separate version."] },
    { id: "work", title: "Work", headline: "Give your work the context it deserves.", description: "Organise projects, experience, and supporting evidence for your applications.", steps: ["Bring your work into one place.", "Describe your contribution and add supporting links.", "Choose the work that fits an application."] },
    { id: "cover-letters", title: "Cover letters", headline: "A letter you can make your own.", description: "Prepare a draft for a role, review the wording, and check the final document.", steps: ["Start with your experience and the target role.", "Review a draft in your own words.", "Check the letter before exporting a PDF."] },
    { id: "portfolio", title: "Portfolio", headline: "Choose what the world gets to see.", description: "Select work for your portfolio and control when it is published.", steps: ["Choose work to include in your portfolio.", "Review the content and public visibility.", "Publish only when you are ready."] },
    { id: "linkedin", title: "LinkedIn", headline: "Your profile, grounded in your work.", description: "Review profile evidence and suggested drafts without posting automatically.", steps: ["Bring profile text and choose a target role.", "Compare a suggested draft with its source evidence.", "Review and copy the wording yourself."] },
    { id: "analytics", title: "Analytics", headline: "Know where your preparation stands.", description: "See saved document and application activity together in your workspace.", steps: ["See the documents and applications you have saved.", "Review your recent activity.", "Use the overview to decide what to work on next."] },
    { id: "settings", title: "Settings", headline: "Make the workspace comfortable for you.", description: "Adjust editor preferences and preview settings from one place.", steps: ["Find your workspace preferences.", "Choose how you want documents to look.", "Keep editor and preview options within reach."] },
    { id: "zebu", title: "Zebu", headline: "A little help finding your next step.", description: "Ask for help navigating your workspace and finding saved work.", steps: ["Ask a question about your workspace.", "See a suggested destination or saved item.", "Open the relevant page and stay in control."] },
] as const;

export type DemoFeatureId = (typeof DEMO_FEATURES)[number]["id"];
export type DemoId = "overview" | DemoFeatureId;
export const FEATURE_DEMO_SECONDS = 12;
export const OVERVIEW_DEMO_SECONDS = 27;
export const DEMO_DISCLOSURE = "Motion showcase with synthetic examples. No live account actions or AI requests are performed.";
/** Feature MP4s that exist on disk. Incomplete recordings stay in public/demo and are not advertised. */
export const COMPLETE_FEATURE_DEMO_IDS = ["resumes"] as const satisfies readonly DemoFeatureId[];

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
        ? DEMO_FEATURES[Math.min(DEMO_FEATURES.length - 1, Math.floor(time / 3))]
        : DEMO_FEATURES.find(feature => feature.id === id)!;
    const phase = id === "overview" ? Math.min(2, Math.floor((time % 3))) : Math.min(2, Math.floor(time / 4));
    return { feature, phase, duration, time, caption: feature.steps[phase] };
}
