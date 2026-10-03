export function resolveResumeVersionContent(
    submittedContent: unknown,
    storedContent: unknown,
): string | null {
    if (typeof submittedContent === "string" && submittedContent.trim()) return submittedContent;
    if (typeof storedContent === "string" && storedContent.trim()) return storedContent;
    return null;
}
