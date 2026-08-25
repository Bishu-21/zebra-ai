export const RESUME_AUDIT_RUBRIC_VERSION = "suman-bera-45-v2";

export const RESUME_AUDIT_STATUSES = [
    "Pass",
    "Partial",
    "Fail",
    "Not Applicable",
    "Not Assessed",
] as const;

export type ResumeAuditStatus = typeof RESUME_AUDIT_STATUSES[number];

export const RESUME_AUDIT_CATEGORIES = [
    "document",
    "contact",
    "targeting",
    "experience",
    "projects",
    "skillsEducation",
    "writing",
] as const;

export type ResumeAuditCategory = typeof RESUME_AUDIT_CATEGORIES[number];

export interface ResumeAuditCriterion {
    id: string;
    category: ResumeAuditCategory;
    checkpoint: string;
    weight: 2 | 3;
    assessability: "text" | "rendered" | "external";
    applicability?: "always" | "candidate-dependent" | "target-dependent" | "content-dependent";
}

export interface ResumeAuditContext {
    hasProfessionalExperience?: boolean;
}

export const RESUME_AUDIT_RUBRIC: readonly ResumeAuditCriterion[] = [
    { id: "DOC-01", category: "document", checkpoint: "Resume is one page for a student or early-career candidate", weight: 3, assessability: "rendered", applicability: "candidate-dependent" },
    { id: "DOC-02", category: "document", checkpoint: "Layout uses one ATS-safe reading column", weight: 3, assessability: "rendered", applicability: "always" },
    { id: "DOC-03", category: "document", checkpoint: "No tables, text boxes, graphics, photos, icons, or word art carry essential information", weight: 2, assessability: "rendered", applicability: "always" },
    { id: "DOC-04", category: "document", checkpoint: "Name and contact information are outside headers and footers", weight: 2, assessability: "rendered", applicability: "always" },
    { id: "DOC-05", category: "document", checkpoint: "Sections use conventional, clearly recognizable headings", weight: 2, assessability: "text", applicability: "always" },
    { id: "DOC-06", category: "document", checkpoint: "Section order prioritizes the strongest role-relevant evidence", weight: 2, assessability: "text", applicability: "target-dependent" },

    { id: "CON-01", category: "contact", checkpoint: "Full name is present and professionally formatted", weight: 2, assessability: "text", applicability: "always" },
    { id: "CON-02", category: "contact", checkpoint: "A professional email address is present", weight: 2, assessability: "text", applicability: "always" },
    { id: "CON-03", category: "contact", checkpoint: "A usable phone number is present", weight: 2, assessability: "text", applicability: "always" },
    { id: "CON-04", category: "contact", checkpoint: "Location is concise and does not expose a full street address", weight: 2, assessability: "text", applicability: "always" },
    { id: "CON-05", category: "contact", checkpoint: "LinkedIn, GitHub, or portfolio links are relevant and clearly labeled", weight: 2, assessability: "text", applicability: "content-dependent" },

    { id: "TAR-01", category: "targeting", checkpoint: "Professional summary is omitted unless it adds essential senior-level or career-transition evidence", weight: 3, assessability: "text", applicability: "candidate-dependent" },
    { id: "TAR-02", category: "targeting", checkpoint: "Content is tailored to a clear target role rather than written generically", weight: 3, assessability: "text", applicability: "target-dependent" },
    { id: "TAR-03", category: "targeting", checkpoint: "Role-relevant keywords appear naturally in evidence-bearing sections", weight: 2, assessability: "text", applicability: "target-dependent" },
    { id: "TAR-04", category: "targeting", checkpoint: "Irrelevant, redundant, or low-value sections and details are removed", weight: 3, assessability: "text", applicability: "always" },
    { id: "TAR-05", category: "targeting", checkpoint: "The first third of the resume surfaces the strongest qualifications", weight: 2, assessability: "rendered", applicability: "always" },

    { id: "EXP-01", category: "experience", checkpoint: "Experience is presented in reverse chronological order", weight: 2, assessability: "text", applicability: "content-dependent" },
    { id: "EXP-02", category: "experience", checkpoint: "Every role includes employer, title, and a consistent date range", weight: 2, assessability: "text", applicability: "content-dependent" },
    { id: "EXP-03", category: "experience", checkpoint: "Bullets begin with specific action verbs", weight: 2, assessability: "text", applicability: "content-dependent" },
    { id: "EXP-04", category: "experience", checkpoint: "Bullets describe achievements or contributions rather than routine duties", weight: 3, assessability: "text", applicability: "content-dependent" },
    { id: "EXP-05", category: "experience", checkpoint: "Claims include truthful scale, outcome, or measurable context where the source supports it", weight: 3, assessability: "text", applicability: "content-dependent" },
    { id: "EXP-06", category: "experience", checkpoint: "Bullets connect action, method or tooling, and result without inventing evidence", weight: 2, assessability: "text", applicability: "content-dependent" },
    { id: "EXP-07", category: "experience", checkpoint: "Recent and relevant roles receive more detail than older or less relevant roles", weight: 2, assessability: "text", applicability: "content-dependent" },
    { id: "EXP-08", category: "experience", checkpoint: "No first-person pronouns, vague filler, or unsupported superlatives weaken the evidence", weight: 2, assessability: "text", applicability: "content-dependent" },

    { id: "PRJ-01", category: "projects", checkpoint: "A dedicated projects section is present when projects are important proof for the target role", weight: 2, assessability: "text", applicability: "target-dependent" },
    { id: "PRJ-02", category: "projects", checkpoint: "Each project has a descriptive, specific title", weight: 2, assessability: "text" },
    { id: "PRJ-03", category: "projects", checkpoint: "The technology stack appears beside or immediately with each project heading", weight: 3, assessability: "text" },
    { id: "PRJ-04", category: "projects", checkpoint: "Each deployable project includes a clearly labeled live link", weight: 3, assessability: "text", applicability: "content-dependent" },
    { id: "PRJ-05", category: "projects", checkpoint: "Project live links are reachable and point to the claimed work", weight: 2, assessability: "external" },
    { id: "PRJ-06", category: "projects", checkpoint: "A repository link is included when source code can be shared", weight: 2, assessability: "text", applicability: "content-dependent" },
    { id: "PRJ-07", category: "projects", checkpoint: "Project bullets explain the candidate's contribution, technical decisions, and outcome", weight: 2, assessability: "text" },
    { id: "PRJ-08", category: "projects", checkpoint: "Projects are relevant, non-duplicative, and ordered by hiring value", weight: 2, assessability: "text", applicability: "target-dependent" },

    { id: "SE-01", category: "skillsEducation", checkpoint: "Technical skills are grouped into clear, useful categories", weight: 2, assessability: "text" },
    { id: "SE-02", category: "skillsEducation", checkpoint: "Listed skills are supported by experience, projects, or education evidence", weight: 2, assessability: "text" },
    { id: "SE-03", category: "skillsEducation", checkpoint: "Skills are relevant and avoid obsolete, obvious, or unverified filler", weight: 2, assessability: "text" },
    { id: "SE-04", category: "skillsEducation", checkpoint: "Education includes institution, qualification, and graduation date or expected date", weight: 2, assessability: "text" },
    { id: "SE-05", category: "skillsEducation", checkpoint: "GPA and coursework appear only when relevant and beneficial", weight: 2, assessability: "text", applicability: "content-dependent" },
    { id: "SE-06", category: "skillsEducation", checkpoint: "Certifications and awards are relevant, specific, and not given excessive space", weight: 2, assessability: "text", applicability: "content-dependent" },

    { id: "WRT-01", category: "writing", checkpoint: "Content uses concise bullet points instead of dense paragraphs", weight: 3, assessability: "text" },
    { id: "WRT-02", category: "writing", checkpoint: "Bullets are direct statements, not topic-label-then-explanation constructions", weight: 2, assessability: "text" },
    { id: "WRT-03", category: "writing", checkpoint: "Bullets are specific enough to understand quickly without unnecessary detail", weight: 2, assessability: "text" },
    { id: "WRT-04", category: "writing", checkpoint: "Verb tense, punctuation, capitalization, and date formatting are consistent", weight: 2, assessability: "text" },
    { id: "WRT-05", category: "writing", checkpoint: "Spelling and grammar are correct", weight: 2, assessability: "text" },
    { id: "WRT-06", category: "writing", checkpoint: "Acronyms and technical terms remain understandable to the target reader", weight: 2, assessability: "text" },
    { id: "WRT-07", category: "writing", checkpoint: "The resume avoids repetition, buzzword stacking, and generic soft-skill claims", weight: 2, assessability: "text" },
] as const;

export const RESUME_AUDIT_TOTAL_WEIGHT = RESUME_AUDIT_RUBRIC.reduce((total, criterion) => total + criterion.weight, 0);

const auditItemJsonSchema = {
    type: "object",
    additionalProperties: false,
    required: ["id", "checkpoint", "status", "fix", "evidence"],
    properties: {
        id: { type: "string" },
        checkpoint: { type: "string" },
        status: { type: "string", enum: [...RESUME_AUDIT_STATUSES] },
        fix: { type: "string" },
        evidence: { type: "string" },
    },
} as const;

const rewriteJsonSchema = {
    type: "object",
    additionalProperties: false,
    required: ["original", "problem", "after", "rationale"],
    properties: {
        original: { type: "string" },
        problem: { type: "string" },
        after: { type: "string" },
        rationale: { type: "string" },
    },
} as const;

/** Strict Responses API format that preserves the historical Zebra result contract. */
export const RESUME_AUDIT_RESPONSE_FORMAT = {
    type: "json_schema" as const,
    name: "zebra_resume_audit",
    strict: true,
    schema: {
        type: "object",
        additionalProperties: false,
        required: ["score", "summary", "metrics", "audit", "recruiterInsights", "suggestedBulletPoints"],
        properties: {
            // Retained for provider/schema compatibility. Zebra recalculates these values.
            score: { type: "number", minimum: 0, maximum: 100 },
            summary: { type: "string" },
            metrics: {
                type: "object",
                additionalProperties: false,
                required: ["impact", "formatting", "ats", "branding"],
                properties: {
                    impact: { type: "number", minimum: 0, maximum: 100 },
                    formatting: { type: "number", minimum: 0, maximum: 100 },
                    ats: { type: "number", minimum: 0, maximum: 100 },
                    branding: { type: "number", minimum: 0, maximum: 100 },
                },
            },
            audit: {
                type: "object",
                additionalProperties: false,
                required: [...RESUME_AUDIT_CATEGORIES],
                properties: Object.fromEntries(RESUME_AUDIT_CATEGORIES.map((category) => {
                    const count = RESUME_AUDIT_RUBRIC.filter((item) => item.category === category).length;
                    return [category, {
                        type: "array",
                        minItems: count,
                        maxItems: count,
                        items: auditItemJsonSchema,
                    }];
                })),
            },
            recruiterInsights: {
                type: "object",
                additionalProperties: false,
                required: ["sevenSecondScan", "soWhatTest", "readability"],
                properties: {
                    sevenSecondScan: { type: "string" },
                    soWhatTest: { type: "string" },
                    readability: { type: "string" },
                },
            },
            suggestedBulletPoints: {
                type: "array",
                maxItems: 6,
                items: rewriteJsonSchema,
            },
        },
    },
};

export function formatResumeAuditRubricForPrompt(): string {
    return RESUME_AUDIT_RUBRIC.map((criterion) =>
        `${criterion.id} | ${criterion.category} | weight ${criterion.weight} | ${criterion.assessability} | ${criterion.applicability ?? "always"} | ${criterion.checkpoint}`,
    ).join("\n");
}

export function inferResumeAuditContext(source: string): ResumeAuditContext {
    try {
        const parsed = JSON.parse(source) as { experience?: unknown };
        if (Array.isArray(parsed.experience)) {
            return { hasProfessionalExperience: parsed.experience.length > 0 };
        }
    } catch {
        // Plain-text imports are detected from conventional section headings.
    }

    return {
        hasProfessionalExperience: /(?:^|\n)\s*(?:professional\s+|work\s+|employment\s+)?experience\s*(?:\n|:|$)/im.test(source),
    };
}

/**
 * Resume-only audits have no JD, rendered document, or external URL checks.
 * Normalize those states before scoring so unavailable context cannot lower the
 * result, regardless of a provider's classification style.
 */
export function normalizeResumeQualityAuditItems<
    T extends { id: string; status: ResumeAuditStatus; fix: string; evidence: string },
>(
    items: readonly T[],
    context: ResumeAuditContext = {},
): Array<Omit<T, "status"> & { status: ResumeAuditStatus }> {
    const byId = new Map(items.map((item) => [item.id, item]));
    return RESUME_AUDIT_RUBRIC.map((criterion) => {
        const item = byId.get(criterion.id);
        if (!item) throw new Error(`Resume analysis output is missing rubric ID ${criterion.id}`);

        if (criterion.applicability === "target-dependent") {
            return {
                ...item,
                status: "Not Applicable" as const,
                fix: "",
                evidence: "A target role or job description was not supplied for this resume-quality audit.",
            };
        }
        if (criterion.category === "experience" && context.hasProfessionalExperience === false) {
            return {
                ...item,
                status: "Not Applicable" as const,
                fix: "",
                evidence: "No professional experience entries were supplied; project and education evidence are assessed instead.",
            };
        }
        if (criterion.assessability !== "text") {
            return {
                ...item,
                status: "Not Assessed" as const,
                fix: "",
                evidence: criterion.assessability === "rendered"
                    ? "Rendered document evidence was not supplied."
                    : "External verification was not performed.",
            };
        }
        // A provider can occasionally decline an otherwise text-assessable
        // criterion. Preserve that uncertainty instead of failing the entire
        // paid audit or inventing a Pass/Fail. Unassessed checks are excluded
        // from the score denominator below.
        if (item.status === "Not Assessed") {
            return {
                ...item,
                fix: item.fix || "Review this checkpoint manually against the source resume.",
                evidence: item.evidence || "The automated audit did not make a reliable determination.",
            };
        }
        if (item.status === "Not Applicable" && (criterion.applicability ?? "always") === "always") {
            return {
                ...item,
                status: "Not Assessed" as const,
                fix: item.fix || "Review this checkpoint manually against the source resume.",
                evidence: item.evidence || "The automated audit did not make a reliable determination.",
            };
        }
        return item;
    });
}

export function calculateResumeAuditScores(
    items: readonly { id: string; status: ResumeAuditStatus }[],
) {
    const byId = new Map(items.map((item) => [item.id, item.status]));
    const scoreFor = (criteria: readonly ResumeAuditCriterion[]) => {
        let passed = 0;
        let assessed = 0;
        for (const criterion of criteria) {
            const status = byId.get(criterion.id);
            if (status === "Not Assessed" || status === "Not Applicable" || status === undefined) continue;
            assessed += criterion.weight;
            if (status === "Pass") passed += criterion.weight;
            if (status === "Partial") passed += criterion.weight * 0.5;
        }
        return assessed === 0 ? 0 : Math.round((passed / assessed) * 100);
    };

    return {
        overall: scoreFor(RESUME_AUDIT_RUBRIC),
        impact: scoreFor(RESUME_AUDIT_RUBRIC.filter((item) => item.category === "experience" || item.category === "projects")),
        formatting: scoreFor(RESUME_AUDIT_RUBRIC.filter((item) => item.category === "document" || item.category === "writing")),
        ats: scoreFor(RESUME_AUDIT_RUBRIC.filter((item) => item.category === "document" || item.category === "contact" || item.category === "targeting")),
        branding: scoreFor(RESUME_AUDIT_RUBRIC.filter((item) => item.category === "projects" || item.category === "skillsEducation" || item.category === "targeting")),
    };
}
