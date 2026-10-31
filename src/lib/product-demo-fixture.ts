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

export const PRODUCT_DEMO_WORK_ITEMS = [
    {
        id: "demo-work-grants-portal",
        title: "Accessible grants portal",
        category: "Project" as const,
        description: "Built React forms with draft saving and clearer validation for civic grant applicants.",
        tools: ["TypeScript", "React", "Next.js"],
        result: "Applicants can save drafts and return without losing work.",
        proofUrl: "https://example.com/jordan/grants-portal",
        isPublic: true,
        createdAt: "2026-10-20T12:00:00.000Z",
    },
];

export const PRODUCT_DEMO_COVER_LETTER = {
    id: "demo-letter-riverbend",
    title: "Frontend Engineer · Riverbend Civic Lab",
    content: "Dear Hiring Team,\n\nI am applying for the Frontend Engineer role at Riverbend Civic Lab. My experience building accessible React interfaces matches the practical focus of your team.\n\nIn my recent work, I rebuilt a grants portal so applicants could save drafts and return to their applications. I worked with designers to make the forms clearer and easier to use.\n\nI would welcome the opportunity to discuss how this experience could support your team.\n\nSincerely,\nJordan Hale",
    createdAt: new Date("2026-10-20T12:00:00.000Z"),
    resumeId: PRODUCT_DEMO_RESUME.id,
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
