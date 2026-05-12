import { z } from "zod";

// --- Base Constants ---
export const MAX_TITLE_LENGTH = 255;
export const MAX_URL_LENGTH = 2048;
export const MAX_CONTENT_LENGTH = 200000; // ~200KB of text
export const MAX_JOB_DESC_LENGTH = 100000; // ~100KB
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// --- Shared Schemas ---
export const idSchema = z.string().uuid();

// --- API Specific Schemas ---

// 1. /api/resumes
export const resumeSchema = z.object({
    id: idSchema.optional(),
    title: z.string().min(1, "Title is required").max(MAX_TITLE_LENGTH).trim(),
    content: z.string().max(MAX_CONTENT_LENGTH).optional(),
    status: z.enum(["Draft", "Completed", "Archived"]).optional(),
    targetRole: z.string().max(MAX_TITLE_LENGTH).optional().or(z.literal("")),
    targetCompany: z.string().max(MAX_TITLE_LENGTH).optional().or(z.literal("")),
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
    url: z.string().url("Invalid URL").max(MAX_URL_LENGTH).optional().or(z.literal("")),
    description: z.string().max(MAX_JOB_DESC_LENGTH).optional().or(z.literal("")),
    status: z.enum(["Applied", "Interviewing", "Offers", "Rejected"]).optional(),
    salary: z.string().max(100).optional().or(z.literal("")),
    location: z.string().max(MAX_TITLE_LENGTH).optional().or(z.literal("")),
    jobType: z.string().max(100).optional().or(z.literal("")),
});

// 3. /api/ai/analyse
export const analyseSchema = z.object({
    resumeId: idSchema,
});

// 4. /api/ai/tailor
export const tailorSchema = z.object({
    resumeId: idSchema,
    jobDescription: z.string().min(20, "Job description is too short").max(MAX_JOB_DESC_LENGTH),
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
});

// 6. /api/jobs/scrape
export const scrapeSchema = z.object({
    url: z.string().url("Invalid URL").max(MAX_URL_LENGTH),
});

// 7. /api/resumes/[id]/share
export const shareSchema = z.object({
    isPublic: z.boolean().optional(),
});

// 8. /api/ai/parse
export const parseSchema = z.object({
    text: z.string().min(50, "Resume text is too short").max(MAX_CONTENT_LENGTH),
});
