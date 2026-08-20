// Resume compiler data parser with deterministic, lossless legacy handling.

import type { ResumeData } from "./types";
import { createEmptyResumeContent, parseStoredResumeContent } from "@/lib/resume-content";

/**
 * Parse stored resume data into the editor model.
 *
 * Raw/invalid legacy content is preserved in `_ingestionMeta.sourceText` and
 * never inserted into a visible field. Stable array IDs keep SSR and client
 * hydration deterministic.
 */
export function parseResumeData(initialData?: {
    id: string;
    title: string;
    content: string;
}): ResumeData {
    if (!initialData) {
        return {
            id: "new",
            title: "Untitled Resume",
            content: createEmptyResumeContent(),
        };
    }

    return {
        id: initialData.id,
        title: initialData.title || "Imported Document",
        content: parseStoredResumeContent(initialData.content),
    };
}
