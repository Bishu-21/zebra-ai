// Prism-Style Resume Compiler — Data Parser
// Handles backward compatibility: old flat skills → categorized, missing certifications, etc.

import type { ResumeContent, ResumeData, SkillCategory, Experience, Project, Education, Achievement } from './types';

const emptyContent: ResumeContent = {
    basics: { name: "", email: "", phone: "", summary: "", location: "", linkedin: "", portfolio: "" },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
};

/**
 * Parse initial resume data into normalized ResumeData.
 * Handles: raw text, legacy JSON (flat skills), new JSON (categorized skills).
 */
export function parseResumeData(initialData?: { id: string; title: string; content: string }): ResumeData {
    if (!initialData) {
        return { id: "new", title: "Untitled Resume", content: { ...emptyContent } };
    }

    try {
        const isJson = initialData.content?.trim().startsWith('{');
        if (isJson) {
            const parsed = JSON.parse(initialData.content || "{}");
            return {
                id: initialData.id,
                title: initialData.title || "Untitled Resume",
                content: normalizeContent(parsed),
            };
        } else {
            // Raw text (PDF imports) — put into summary
            return {
                id: initialData.id,
                title: initialData.title || "Imported Document",
                content: {
                    ...emptyContent,
                    basics: { ...emptyContent.basics, summary: initialData.content || "" },
                },
            };
        }
    } catch (e) {
        console.error("Failed to parse resume content", e);
        return { id: initialData.id, title: initialData.title || "Untitled Resume", content: { ...emptyContent } };
    }
}

function normalizeContent(parsed: Partial<ResumeContent>): ResumeContent {
    return {
        basics: {
            name: parsed.basics?.name || "",
            email: parsed.basics?.email || "",
            phone: parsed.basics?.phone || "",
            summary: parsed.basics?.summary || "",
            location: parsed.basics?.location || "",
            linkedin: parsed.basics?.linkedin || "",
            portfolio: parsed.basics?.portfolio || "",
        },
        experience: (parsed.experience || []).map((exp) => ({
            id: exp.id || Date.now() + Math.random(),
            company: exp.company || "",
            location: exp.location || "",
            role: exp.role || "",
            period: exp.period || "",
            highlights: exp.highlights || [""],
            techStack: exp.techStack || "",
            link: exp.link || "",
        })) as Experience[],
        education: (parsed.education || []).map((edu) => ({
            id: edu.id || Date.now() + Math.random(),
            school: edu.school || "",
            location: edu.location || "",
            degree: edu.degree || "",
            gpa: edu.gpa || "",
            period: edu.period || "",
            highlights: edu.highlights || [],
        })) as Education[],
        skills: normalizeSkills(parsed.skills),
        projects: (parsed.projects || []).map((proj) => ({
            id: proj.id || Date.now() + Math.random(),
            title: proj.title || "",
            techStack: proj.techStack || "",
            link: proj.link || "",
            highlights: proj.highlights || [""],
        })) as Project[],
        certifications: normalizeCertifications(parsed.certifications),
    };
}

/**
 * Backward compat: old format is string[], new format is SkillCategory[]
 */
function normalizeSkills(skills: unknown): SkillCategory[] {
    if (!Array.isArray(skills)) return [];
    // Old format: string[]
    if (skills.length > 0 && typeof skills[0] === 'string') {
        return [{ id: 1, category: "Technical Skills", items: (skills as string[]).join(', ') }];
    }
    // New format: SkillCategory[]
    return (skills as (string | SkillCategory)[]).map((s, i) => {
        if (typeof s === 'string') return { id: Date.now() + i, category: "Skills", items: s };
        return {
            id: s.id || Date.now() + i,
            category: s.category || "General",
            items: s.items || ""
        };
    });
}

function normalizeCertifications(certs: unknown): Achievement[] {
    if (!Array.isArray(certs)) return [];
    return (certs as Achievement[]).map((c, i) => ({
        id: c.id || Date.now() + i,
        category: c.category || "Certification",
        items: c.items || ""
    }));
}
