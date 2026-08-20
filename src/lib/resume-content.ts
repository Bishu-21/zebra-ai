import type {
    Achievement,
    Education,
    Experience,
    Project,
    ResumeContent,
    ResumeIngestionMeta,
    SkillCategory,
} from "@/components/compiler/types";

export const RESUME_SCHEMA_VERSION = 2 as const;
export const RESUME_PARSER_VERSION = "azure-structured-v2";

export function createEmptyResumeContent(): ResumeContent {
    return {
        basics: {
            name: "",
            email: "",
            phone: "",
            summary: "",
            location: "",
            linkedin: "",
            portfolio: "",
        },
        experience: [],
        education: [],
        skills: [],
        projects: [],
        certifications: [],
    };
}

function stringValue(value: unknown, separator = ", "): string {
    if (typeof value === "string") return value.trim();
    if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
        return value.map((item) => item.trim()).filter(Boolean).join(separator);
    }
    return "";
}

function stringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
}

function positiveId(value: unknown, fallback: number): number {
    return typeof value === "number" && Number.isFinite(value) && value > 0
        ? Math.trunc(value)
        : fallback;
}

function recordValue(value: unknown): Record<string, unknown> {
    return value && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
}

function normalizeMeta(value: unknown): ResumeIngestionMeta | undefined {
    const meta = recordValue(value);
    if (typeof meta.sourceText !== "string") return undefined;

    const status = meta.parseStatus;
    return {
        schemaVersion: RESUME_SCHEMA_VERSION,
        parserVersion: stringValue(meta.parserVersion) || RESUME_PARSER_VERSION,
        parseStatus:
            status === "verified" || status === "needs_review" || status === "legacy"
                ? status
                : "needs_review",
        sourceText: meta.sourceText,
        parseWarnings: stringArray(meta.parseWarnings),
        parsedAt: stringValue(meta.parsedAt) || undefined,
        originalFileName: stringValue(meta.originalFileName) || undefined,
        mimeType: stringValue(meta.mimeType) || undefined,
        sourceTruncatedForAi: meta.sourceTruncatedForAi === true || undefined,
    };
}

function normalizeSkills(value: unknown): SkillCategory[] {
    if (!Array.isArray(value)) return [];
    if (value.length > 0 && typeof value[0] === "string") {
        return [{ id: 1, category: "Technical Skills", items: stringArray(value).join(", ") }];
    }

    return value.map((item, index) => {
        const skill = recordValue(item);
        return {
            id: positiveId(skill.id, index + 1),
            category: stringValue(skill.category) || "General",
            items: stringValue(skill.items),
        };
    });
}

function normalizeCertifications(value: unknown): Achievement[] {
    if (!Array.isArray(value)) return [];
    return value.map((item, index) => {
        const certification = recordValue(item);
        return {
            id: positiveId(certification.id, index + 1),
            category: stringValue(certification.category) || "Certification",
            items: stringValue(certification.items),
        };
    });
}

export function normalizeResumeContent(value: unknown): ResumeContent {
    const parsed = recordValue(value);
    const basics = recordValue(parsed.basics);

    const experience: Experience[] = Array.isArray(parsed.experience)
        ? parsed.experience.map((item, index) => {
            const entry = recordValue(item);
            return {
                id: positiveId(entry.id, index + 1),
                company: stringValue(entry.company),
                location: stringValue(entry.location),
                role: stringValue(entry.role),
                period: stringValue(entry.period),
                highlights: stringArray(entry.highlights),
                techStack: stringValue(entry.techStack),
                link: stringValue(entry.link),
            };
        })
        : [];

    const education: Education[] = Array.isArray(parsed.education)
        ? parsed.education.map((item, index) => {
            const entry = recordValue(item);
            return {
                id: positiveId(entry.id, index + 1),
                school: stringValue(entry.school),
                location: stringValue(entry.location),
                degree: stringValue(entry.degree),
                gpa: stringValue(entry.gpa),
                period: stringValue(entry.period),
                highlights: stringArray(entry.highlights),
            };
        })
        : [];

    const projects: Project[] = Array.isArray(parsed.projects)
        ? parsed.projects.map((item, index) => {
            const entry = recordValue(item);
            return {
                id: positiveId(entry.id, index + 1),
                title: stringValue(entry.title),
                techStack: stringValue(entry.techStack),
                link: stringValue(entry.link),
                highlights: stringArray(entry.highlights),
            };
        })
        : [];

    const content: ResumeContent = {
        basics: {
            name: stringValue(basics.name),
            email: stringValue(basics.email),
            phone: stringValue(basics.phone),
            summary: stringValue(basics.summary, "\n"),
            location: stringValue(basics.location),
            linkedin: stringValue(basics.linkedin),
            portfolio: stringValue(basics.portfolio),
        },
        experience,
        education,
        skills: normalizeSkills(parsed.skills),
        projects,
        certifications: normalizeCertifications(parsed.certifications),
    };

    const meta = normalizeMeta(parsed._ingestionMeta);
    if (meta) content._ingestionMeta = meta;
    return content;
}

export function createLegacyResumeContent(
    sourceText: string,
    options: Pick<ResumeIngestionMeta, "originalFileName" | "mimeType"> = {},
): ResumeContent {
    const content = createEmptyResumeContent();
    content._ingestionMeta = {
        schemaVersion: RESUME_SCHEMA_VERSION,
        parserVersion: "legacy-preservation-v2",
        parseStatus: "legacy",
        sourceText,
        parseWarnings: ["This imported resume has not been mapped into editable sections yet."],
        ...options,
    };
    return content;
}

export function parseStoredResumeContent(storedContent: string | null | undefined): ResumeContent {
    const source = storedContent || "";
    const trimmed = source.trim();
    if (!trimmed) return createEmptyResumeContent();

    try {
        const normalized = normalizeResumeContent(JSON.parse(trimmed));
        if (looksLikeFlattenedLegacyResume(normalized)) {
            const sourceText = normalized._ingestionMeta?.sourceText || normalized.basics.summary;
            const legacy = createLegacyResumeContent(sourceText, {
                originalFileName: normalized._ingestionMeta?.originalFileName,
                mimeType: normalized._ingestionMeta?.mimeType,
            });
            legacy._ingestionMeta!.parseWarnings = [
                "This older import placed the full document in Summary. Run Auto-Structure to map it into editable sections.",
            ];
            return legacy;
        }
        return normalized;
    } catch {
        return createLegacyResumeContent(source);
    }
}

export function looksLikeFlattenedLegacyResume(content: ResumeContent): boolean {
    const summary = content.basics.summary.trim();
    const hasMappedSections = Boolean(
        content.experience.length || content.education.length || content.skills.length ||
        content.projects.length || content.certifications.length
    );
    if (hasMappedSections || summary.length < 500) return false;

    const sectionMarkers = summary.match(
        /\b(?:EDUCATION|EXPERIENCE|PROJECTS?|SKILLS(?:\s*&\s*COMPETENCIES)?|CERTIFICATIONS?|ACHIEVEMENTS)\b/g,
    );
    return (sectionMarkers?.length ?? 0) >= 2;
}

export function stringifyResumeContent(content: ResumeContent): string {
    return JSON.stringify(normalizeResumeContent(content));
}

export function getResumeSourceText(content: ResumeContent): string {
    return content._ingestionMeta?.sourceText || "";
}

export function hasStructuredResumeData(content: ResumeContent): boolean {
    const { basics } = content;
    return Boolean(
        basics.name || basics.email || basics.phone || basics.location || basics.summary ||
        content.experience.length || content.education.length || content.skills.length ||
        content.projects.length || content.certifications.length
    );
}

export function resumeContentToPrompt(storedContent: string | null | undefined): string {
    const content = parseStoredResumeContent(storedContent);
    if (!hasStructuredResumeData(content)) return getResumeSourceText(content);

    const structured = { ...content };
    delete structured._ingestionMeta;
    return JSON.stringify(structured, null, 2);
}
