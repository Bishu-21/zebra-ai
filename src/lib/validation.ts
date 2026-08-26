import { z } from "zod";

// --- Base Constants ---
export const MAX_TITLE_LENGTH = 255;
export const MAX_URL_LENGTH = 2048;
export const MAX_CONTENT_LENGTH = 200000; // ~200KB of text
export const MAX_STORED_RESUME_LENGTH = 500000; // structured JSON + preserved source
export const MAX_JOB_DESC_LENGTH = 100000; // ~100KB
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_AI_RESUME_TEXT_LENGTH = 60000;

// --- Shared Schemas ---
export const idSchema = z.uuid();

export const APPLICATION_STATUSES = [
    "Draft",
    "Preparing",
    "Ready",
    "Applied",
    "Interviewing",
    "Offer",
    "Rejected",
    "Withdrawn"
] as const;

export const applicationStatusSchema = z.enum(APPLICATION_STATUSES);

// --- API Specific Schemas ---

// 1. /api/resumes
export const resumeSchema = z.object({
    // Treat an explicit null as "create" for older clients; new clients omit the id.
    id: idSchema.nullish(),
    expectedRevision: z.number().int().nonnegative().optional(),
    title: z.string().min(1, "Title is required").max(MAX_TITLE_LENGTH).trim(),
    content: z.string().max(MAX_STORED_RESUME_LENGTH).optional(),
    status: z.enum(["Draft", "Completed", "Archived"]).optional(),
    targetRole: z.string().max(MAX_TITLE_LENGTH).optional().or(z.literal("")),
    targetCompany: z.string().max(MAX_TITLE_LENGTH).optional().or(z.literal("")),
});

export const resumeUpdateSchema = resumeSchema
    .pick({ title: true, content: true, status: true, expectedRevision: true })
    .partial()
    .refine((data) => data.title !== undefined || data.content !== undefined || data.status !== undefined, {
        message: "At least one resume field is required",
    })
    .refine((data) => data.expectedRevision !== undefined, {
        message: "Expected revision is required",
        path: ["expectedRevision"],
    });

// Duplication schema
export const duplicateResumeSchema = z.object({
    targetRole: z.string().max(MAX_TITLE_LENGTH).optional().or(z.literal("")),
    targetCompany: z.string().max(MAX_TITLE_LENGTH).optional().or(z.literal("")),
});


// 2. /api/jobs
export const jobSchema = z.object({
    id: idSchema.optional(),
    company: z.string().min(1, "Company is required").max(MAX_TITLE_LENGTH).trim(),
    position: z.string().min(1, "Position is required").max(MAX_TITLE_LENGTH).trim(),
    url: z.string().max(MAX_URL_LENGTH).optional().or(z.literal("")),
    description: z.string().max(MAX_JOB_DESC_LENGTH).optional().or(z.literal("")),
    status: z.enum(["Applied", "Interviewing", "Offers", "Rejected"]).optional(),
    salary: z.string().max(100).optional().or(z.literal("")),
    location: z.string().max(MAX_TITLE_LENGTH).optional().or(z.literal("")),
    jobType: z.string().max(100).optional().or(z.literal("")),
    resumeId: idSchema.optional().or(z.literal("")),
    resumeVersionId: idSchema.optional().or(z.literal("")),
});

// 3. /api/ai/analyse
export const analyseSchema = z.object({
    resumeId: idSchema.optional(),
    content: z.string().min(50).max(MAX_CONTENT_LENGTH).optional(),
    title: z.string().max(MAX_TITLE_LENGTH).trim().optional(),
}).refine((data) => Boolean(data.resumeId || data.content?.trim()), {
    message: "Select a resume or provide resume content",
});

// 4. /api/ai/tailor
export const tailorSchema = z.object({
    resumeId: idSchema,
    jobDescription: z.string().min(20, "Job description is too short").max(MAX_JOB_DESC_LENGTH),
    company: z.string().max(MAX_TITLE_LENGTH).trim().optional(),
    targetRole: z.string().max(MAX_TITLE_LENGTH).trim().optional(),
    applicationId: idSchema.optional(),
    saveAsVersion: z.boolean().optional(),
});

// 5. /api/cover-letters
export const coverLetterSchema = z.object({
    id: idSchema.optional(),
    resumeId: idSchema.optional(),
    title: z.string().min(1, "Title is required").max(MAX_TITLE_LENGTH).trim(),
    jobDescription: z.string().max(MAX_JOB_DESC_LENGTH).optional().or(z.literal("")),
    content: z.string().max(MAX_CONTENT_LENGTH),
});

export const generateCoverLetterSchema = z.object({
    resumeId: idSchema.optional(),
    title: z.string().max(MAX_TITLE_LENGTH).optional(),
    jobDescription: z.string().min(20, "Job description is too short").max(MAX_JOB_DESC_LENGTH),
    intelligence: z.object({
        skills: z.array(z.string()),
        companySignals: z.array(z.string()),
        requirements: z.array(z.string()),
    }).optional(),
});

// 6. /api/jobs/scrape
export const scrapeSchema = z.object({
    url: z.url("Invalid URL").max(MAX_URL_LENGTH),
});

// 7. /api/resumes/[id]/share
export const shareSchema = z.object({
    isPublic: z.boolean().optional(),
});

// 8. /api/ai/parse
export const parseSchema = z.object({
    text: z.string().min(50, "Resume text is too short").max(MAX_CONTENT_LENGTH),
});

// 9. /api/ai/audit
export const auditSchema = z.object({
    resumeText: z.string().min(1, "Resume text is required").max(MAX_CONTENT_LENGTH),
    jobDescription: z.string().min(1, "Job description is required").max(MAX_JOB_DESC_LENGTH),
});

export const ragSchema = z.object({
    message: z.string().trim().min(1, "Message is required").max(12_000),
    context: z.unknown().optional(),
});

// 10. /api/resume-versions
export const saveVersionSchema = z.object({
    resumeId: z.string().min(1),
    title: z.string().min(1, "Title is required").max(MAX_TITLE_LENGTH),
    company: z.string().max(MAX_TITLE_LENGTH).nullish(),
    targetRole: z.string().max(MAX_TITLE_LENGTH).nullish(),
    jobDescription: z.string().max(MAX_JOB_DESC_LENGTH).nullish(),
    content: z.string().min(1, "Content is required"),
    matchScore: z.number().int().min(0).max(100).nullish(),
    feedback: z.unknown().optional(),
});

// 11. AI Response Validation Schemas (Strict Guardrails)
export const aiTailorResponseSchema = z.object({
    matchScore: z.number().min(0).max(100),
    executiveSummary: z.string(),
    strengths: z.array(z.string()),
    gaps: z.array(z.string()),
    suggestedChanges: z.array(z.object({
        section: z.string(),
        changeType: z.string(),
        originalText: z.string().nullish(),
        suggestedText: z.string(),
        reason: z.string().nullish(),
    })).optional(),
});

export const aiFitCheckResponseSchema = z.object({
    fits: z.array(z.string()),
    missing: z.array(z.string()),
    suggestedActions: z.array(z.string()),
});

/**
 * Model JSON is not always type-stable. In particular, a model may return a
 * short list for a field that our editor stores as one string. Normalise only
 * the lossless string/string[] variations here; objects and mixed arrays still
 * fail validation instead of being silently stringified.
 */
function aiString(separator = " ") {
    return z.preprocess((value) => {
        if (value === null || value === undefined) return "";
        if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
            return value.map((item) => item.trim()).filter(Boolean).join(separator);
        }
        return value;
    }, z.string().trim());
}

const aiPlainString = aiString(" ");
const aiListString = aiString(", ");
const aiMultilineString = aiString("\n");
const aiTextArray = z.preprocess(
    (value) => typeof value === "string" ? [value] : (value ?? []),
    z.array(z.string().trim().min(1)).max(50),
);

const aiSkills = z.preprocess((value) => {
    if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
        return [{ category: "Technical Skills", items: value }];
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return Object.entries(value as Record<string, unknown>).map(([category, items]) => ({
            category,
            items,
        }));
    }
    return value ?? [];
}, z.array(z.object({
    id: z.unknown().optional(),
    category: aiPlainString,
    items: aiListString,
})).max(30));

const aiCertifications = z.preprocess((value) => {
    if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
        return value.map((item) => ({ category: "Certification", items: item }));
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return Object.entries(value as Record<string, unknown>).map(([category, items]) => ({
            category,
            items,
        }));
    }
    return value ?? [];
}, z.array(z.object({
    id: z.unknown().optional(),
    category: aiPlainString,
    items: aiListString,
})).max(50));

export const aiParsedResumeSchema = z.object({
    basics: z.preprocess((value) => value ?? {}, z.object({
        name: aiPlainString,
        email: aiPlainString,
        phone: aiPlainString,
        summary: aiMultilineString,
        location: aiPlainString,
        linkedin: aiPlainString,
        portfolio: aiPlainString,
    })),
    experience: z.preprocess((value) => value ?? [], z.array(z.object({
        id: z.unknown().optional(),
        company: aiPlainString,
        location: aiPlainString,
        role: aiPlainString,
        period: aiPlainString,
        highlights: aiTextArray,
        techStack: aiListString,
        link: aiPlainString,
    })).max(50)),
    education: z.preprocess((value) => value ?? [], z.array(z.object({
        id: z.unknown().optional(),
        school: aiPlainString,
        location: aiPlainString,
        degree: aiListString,
        gpa: aiPlainString,
        period: aiPlainString,
        highlights: aiTextArray,
    })).max(30)),
    skills: aiSkills,
    projects: z.preprocess((value) => value ?? [], z.array(z.object({
        id: z.unknown().optional(),
        title: aiPlainString,
        techStack: aiListString,
        link: aiPlainString,
        highlights: aiTextArray,
    })).max(50)),
    certifications: aiCertifications,
});

const auditItemSchema = z.object({
    id: aiPlainString,
    checkpoint: aiPlainString,
    status: z.enum(["Pass", "Partial", "Fail", "Not Applicable", "Not Assessed"]),
    fix: aiPlainString,
    evidence: aiPlainString,
});

export const aiResumeAnalysisSchema = z.object({
    score: z.number().min(0).max(100),
    summary: z.string().min(1),
    metrics: z.object({
        impact: z.number().min(0).max(100),
        formatting: z.number().min(0).max(100),
        ats: z.number().min(0).max(100),
        branding: z.number().min(0).max(100),
    }),
    audit: z.preprocess(
        (value) => value ?? {},
        z.record(z.string(), z.array(auditItemSchema).max(20)),
    ),
    recruiterInsights: z.preprocess((value) => value ?? {}, z.object({
        sevenSecondScan: aiPlainString,
        soWhatTest: aiPlainString,
        readability: aiPlainString,
    })),
    suggestedBulletPoints: z.preprocess((value) => value ?? [], z.array(z.object({
        original: aiPlainString,
        problem: aiPlainString,
        after: aiPlainString,
        rationale: aiPlainString,
    })).max(6)),
});

export const aiRoleMatchSchema = z.object({
    matchScore: z.number().min(0).max(100),
    keywordsFound: aiTextArray,
    keywordsMissing: aiTextArray,
    roleFit: z.string().min(1),
    criticalGaps: aiTextArray,
    tailoringSuggestions: aiTextArray,
    executiveSummary: z.string().min(1),
    sectionChanges: z.array(z.object({
        section: z.enum(["Summary", "Experience", "Skills", "Projects", "Education", "General"]),
        changeType: z.enum(["add", "modify", "remove", "rewrite"]),
        originalText: z.string().default(""),
        suggestedText: z.string().min(1),
        reason: z.string().default(""),
    })).max(12),
});
