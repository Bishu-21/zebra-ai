"use client";

import { usePathname } from "next/navigation";
import { ZebraLoader } from "./ZebraLoader";

const routeCopy: Array<{ match: (pathname: string) => boolean; label: string; detail: string }> = [
    { match: (path) => /^\/dashboard\/applications\/[^/]+$/.test(path), label: "Opening application", detail: "Loading the role, resume, and saved evidence." },
    { match: (path) => /^\/dashboard\/resumes\/[^/]+$/.test(path), label: "Opening resume", detail: "Preparing your document and latest changes." },
    { match: (path) => path === "/dashboard/job-tracker", label: "Opening applications", detail: "Refreshing your application pipeline." },
    { match: (path) => path === "/dashboard/resumes", label: "Opening resumes", detail: "Gathering your saved resumes." },
    { match: (path) => path === "/dashboard/work", label: "Opening work", detail: "Gathering your projects and evidence." },
    { match: (path) => path === "/dashboard/cover-letters", label: "Opening cover letters", detail: "Loading your saved letters." },
    { match: (path) => path === "/dashboard/portfolio", label: "Opening portfolio", detail: "Checking your public profile and proof." },
    { match: (path) => path === "/dashboard/analytics", label: "Opening analytics", detail: "Calculating scores and application activity." },
    { match: (path) => path === "/dashboard/settings", label: "Opening settings", detail: "Checking your workspace preferences." },
    { match: (path) => path === "/dashboard", label: "Opening home", detail: "Finding the most useful next step." },
];

export function ZebraRouteLoader() {
    const pathname = usePathname();
    const copy = routeCopy.find((item) => item.match(pathname)) ?? {
        label: "Loading your workspace",
        detail: "Zebra is moving things into place.",
    };

    return <ZebraLoader label={copy.label} detail={copy.detail} />;
}
