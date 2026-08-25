import { z } from "zod";

export const CAREER_STAGES = [
    "first_year_student",
    "second_year_student",
    "third_year_student",
    "final_year_student",
    "freelancer",
    "professional",
] as const;

export type CareerStage = typeof CAREER_STAGES[number];
export type CareerProfileStatus = "pending" | "completed" | "dismissed";

export const CAREER_STAGE_LABELS: Record<CareerStage, string> = {
    first_year_student: "First-year student",
    second_year_student: "Second-year student",
    third_year_student: "Third-year student",
    final_year_student: "Final-year student",
    freelancer: "Freelancer",
    professional: "Professional",
};

export const careerProfileUpdateSchema = z.object({
    careerStage: z.enum(CAREER_STAGES),
    professionalExperienceYears: z.number().int().min(0).max(60).nullable().optional(),
}).superRefine((value, ctx) => {
    if (value.careerStage === "professional" && value.professionalExperienceYears == null) {
        ctx.addIssue({
            code: "custom",
            path: ["professionalExperienceYears"],
            message: "Years of experience is required for professionals",
        });
    }
});

export function careerStageHasExpectedProfessionalExperience(stage: string | null | undefined): boolean | undefined {
    if (!stage) return undefined;
    if (stage === "professional" || stage === "freelancer") return true;
    if ((CAREER_STAGES as readonly string[]).includes(stage)) return false;
    return undefined;
}
