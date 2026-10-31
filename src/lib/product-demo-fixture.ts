import type { ResumeContent, ResumeData } from "@/components/compiler/types";

/** Clearly synthetic fixture for the public product walkthrough. Do not use real accounts. */
export const PRODUCT_DEMO_NAME = "Jordan Hale";

export const PRODUCT_DEMO_CONTENT: ResumeContent = {
    basics: {
        name: PRODUCT_DEMO_NAME,
        email: "jordan.hale@example.com",
        phone: "+1 (555) 010-0142",
        location: "Portland, OR",
        summary: "Frontend engineer who ships accessible product interfaces and keeps design systems consistent across web apps.",
        linkedin: "https://www.linkedin.com/in/example-jordan-hale",
        portfolio: "https://example.com/jordan-hale",
    },
    experience: [
        {
            id: 1,
            company: "Riverbend Civic Lab",
            location: "Portland, OR",
            role: "Frontend Engineer",
            period: "2022 — Present",
            techStack: "TypeScript, React, Next.js",
            highlights: [
                "Rebuilt the grants portal in React so applicants can save drafts and submit without losing work.",
                "Cut the average form completion time from 12 minutes to 7 minutes by simplifying required fields.",
            ],
        },
    ],
    education: [
        {
            id: 1,
            school: "Cascadia Technical College",
            location: "Portland, OR",
            degree: "B.S. Computer Science",
            period: "2018 — 2022",
            highlights: ["Coursework in human-computer interaction and databases."],
        },
    ],
    skills: [
        { id: 1, category: "Languages", items: "TypeScript, JavaScript, HTML, CSS" },
        { id: 2, category: "Tools", items: "React, Next.js, Git, Playwright" },
    ],
    projects: [
        {
            id: 1,
            title: "Neighborhood tool library",
            techStack: "Next.js, PostgreSQL",
            highlights: [
                "Built a borrowing catalog so neighbors can reserve tools and see pickup hours.",
            ],
        },
    ],
    certifications: [],
};

export const PRODUCT_DEMO_RESUME: ResumeData = {
    id: "demo-jordan-hale",
    title: "Jordan Hale — Frontend engineer",
    content: PRODUCT_DEMO_CONTENT,
};

export const PRODUCT_DEMO_STEPS = [
    {
        id: "import",
        label: "Import",
        src: "/demo/walkthrough-import.jpg",
        caption: "Import a PDF, Word file, or pasted text.",
    },
    {
        id: "review",
        label: "Review",
        src: "/demo/walkthrough-review.jpg",
        caption: "Review the mapped sections before you change anything.",
    },
    {
        id: "edit",
        label: "Edit",
        src: "/demo/walkthrough-edit.jpg",
        caption: "Edit the structured fields. The original import stays in place.",
    },
    {
        id: "preview",
        label: "Preview",
        src: "/demo/walkthrough-preview.jpg",
        caption: "Watch the live preview update as you edit.",
    },
    {
        id: "export",
        label: "Export",
        src: "/demo/walkthrough-export.jpg",
        caption: "Export a PDF when the document is ready.",
    },
] as const;
