interface ParsedResume {
    basics?: { name?: string; email?: string; phone?: string; summary?: string; location?: string };
    experience?: Array<{ id?: number; role?: string; company?: string; period?: string; highlights?: string[] }>;
    skills?: Array<{ id?: number; category?: string; items?: string }>;
    projects?: Array<{ id?: number; title?: string; techStack?: string; highlights?: string[] }>;
}

interface ApprovedChange {
    section: string;
    changeType: string;
    originalText: string | null;
    suggestedText: string;
    userEdits: string | null;
}

export function compileTailoredResumeContent(baseResumeContent: string, approvedChanges: ApprovedChange[]): string {
    let isJson = false;
    let parsed: ParsedResume = {};
    try {
        if (baseResumeContent && baseResumeContent.trim().startsWith("{")) {
            parsed = JSON.parse(baseResumeContent);
            isJson = true;
        }
    } catch {
        isJson = false;
    }

    if (!isJson) {
        let updatedText = baseResumeContent || "";
        for (const change of approvedChanges) {
            const appliedText = (change.userEdits || change.suggestedText).trim();
            const changeType = (change.changeType || "modify").toLowerCase();
            const originalText = change.originalText?.trim() || "";
            if (originalText && updatedText.includes(originalText)) {
                updatedText = changeType === "remove"
                    ? updatedText.replace(originalText, "")
                    : updatedText.replace(originalText, appliedText);
            } else if (changeType !== "remove" && !updatedText.includes(appliedText)) {
                updatedText += `\n\n% Tailored ${change.section || "Improvement"}:\n${appliedText}`;
            }
        }
        return updatedText;
    }

    if (!parsed.basics) parsed.basics = { name: "", email: "", phone: "", summary: "", location: "" };

    for (const change of approvedChanges) {
        const appliedText = (change.userEdits || change.suggestedText).trim();
        const section = (change.section || "General").toLowerCase();
        const changeType = (change.changeType || "modify").toLowerCase();
        const originalText = change.originalText?.trim() || "";

        if (section.includes("summary")) {
            parsed.basics.summary = changeType === "remove" ? "" : appliedText;
        } else if (section.includes("experience")) {
            if (!Array.isArray(parsed.experience)) parsed.experience = [];
            if (parsed.experience.length === 0) {
                if (changeType !== "remove") parsed.experience.push({ id: 1, role: "Relevant Role", company: "Company", period: "Present", highlights: [appliedText] });
            } else {
                let replaced = false;
                if (originalText) {
                    for (const exp of parsed.experience) {
                        const idx = exp.highlights?.findIndex((item) => item.trim() === originalText || item === originalText) ?? -1;
                        if (idx !== -1 && exp.highlights) {
                            if (changeType === "remove") exp.highlights.splice(idx, 1);
                            else exp.highlights[idx] = appliedText;
                            replaced = true;
                            break;
                        }
                    }
                }
                if (!replaced && changeType !== "remove") {
                    const highlights = parsed.experience[0].highlights ||= [];
                    if (!highlights.includes(appliedText)) highlights.push(appliedText);
                }
            }
        } else if (section.includes("skill")) {
            if (!Array.isArray(parsed.skills)) parsed.skills = [];
            if (parsed.skills.length === 0) {
                if (changeType !== "remove") parsed.skills.push({ id: 1, category: "Technical Skills", items: appliedText });
            } else {
                const existingItems = parsed.skills[0].items || "";
                if (changeType === "remove") {
                    parsed.skills[0].items = existingItems.split(",").map((item) => item.trim()).filter((item) => item !== originalText && item !== appliedText).join(", ");
                } else if (originalText && existingItems.includes(originalText)) {
                    parsed.skills[0].items = existingItems.replace(originalText, appliedText);
                } else if (!existingItems.split(",").map((item) => item.trim()).includes(appliedText)) {
                    parsed.skills[0].items = existingItems ? `${existingItems}, ${appliedText}` : appliedText;
                }
            }
        } else if (section.includes("project")) {
            if (!Array.isArray(parsed.projects)) parsed.projects = [];
            if (parsed.projects.length === 0) {
                if (changeType !== "remove") parsed.projects.push({ id: 1, title: "Featured Project", techStack: "", highlights: [appliedText] });
            } else {
                let replaced = false;
                if (originalText) {
                    for (const project of parsed.projects) {
                        const idx = project.highlights?.findIndex((item) => item.trim() === originalText || item === originalText) ?? -1;
                        if (idx !== -1 && project.highlights) {
                            if (changeType === "remove") project.highlights.splice(idx, 1);
                            else project.highlights[idx] = appliedText;
                            replaced = true;
                            break;
                        }
                    }
                }
                if (!replaced && changeType !== "remove") {
                    const highlights = parsed.projects[0].highlights ||= [];
                    if (!highlights.includes(appliedText)) highlights.push(appliedText);
                }
            }
        }
    }

    return JSON.stringify(parsed, null, 2);
}
