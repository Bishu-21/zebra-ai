import { z } from "zod";

export const ZEBU_ROUTES = [
  "/dashboard", "/dashboard/job-tracker", "/dashboard/resumes", "/dashboard/work",
  "/dashboard/cover-letters", "/dashboard/portfolio", "/dashboard/analytics", "/dashboard/settings",
] as const;

export const zebuToolSchema = z.enum(["resume_analysis", "role_match"]);
export const zebuEntitySchema = z.enum(["resume", "application", "work"]);
export const zebuWorkCategorySchema = z.enum(["Project", "Internship", "Hackathon", "Course", "Award", "Other"]);
export const zebuApplicationStatusSchema = z.enum(["Draft", "Preparing", "Ready", "Applied", "Interviewing", "Offer", "Rejected", "Withdrawn"]);

export const zebuActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("none") }),
  z.object({ type: z.literal("navigate"), route: z.string().min(1).max(300) }),
  z.object({ type: z.literal("open_tool"), tool: zebuToolSchema }),
  z.object({ type: z.literal("search"), query: z.string().trim().min(1).max(200) }),
  z.object({ type: z.literal("summarize"), entityType: zebuEntitySchema, query: z.string().trim().max(200) }),
  z.object({ type: z.literal("quick_stats") }),
  z.object({ type: z.literal("start_flow"), flow: z.enum(["resume", "application", "cover_letter"]) }),
  z.object({ type: z.literal("open_resume"), query: z.string().trim().min(1).max(200) }),
  z.object({ type: z.literal("open_application"), query: z.string().trim().min(1).max(200) }),
  z.object({ type: z.literal("deadline_check") }),
  z.object({ type: z.literal("suggest_next") }),
  z.object({ type: z.literal("create_application"), company: z.string().trim().min(1).max(160), position: z.string().trim().min(1).max(160) }),
  z.object({ type: z.literal("create_work"), title: z.string().trim().min(1).max(200), category: zebuWorkCategorySchema, description: z.string().trim().max(2_000) }),
  z.object({ type: z.literal("update_application_status"), applicationId: z.string().trim().min(1).max(160), status: zebuApplicationStatusSchema }),
]);

export const zebuDisplayCardSchema = z.object({
  id: z.string(),
  kind: z.enum(["resume", "application", "work", "stat", "deadline", "suggestion"]),
  title: z.string().max(200),
  subtitle: z.string().max(300).optional(),
  meta: z.string().max(100).optional(),
  href: z.string().max(300).optional(),
  urgency: z.enum(["low", "medium", "high"]).optional(),
});

export const zebuTurnSchema = z.object({
  message: z.string().trim().min(1).max(2_000),
  currentPage: z.string().max(300).optional(),
  currentContext: z.string().trim().max(300).optional(),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(2_000),
  })).max(20).optional().default([]),
});

export const zebuPlanSchema = z.object({
  spokenResponse: z.string().trim().min(1).max(2_000),
  action: zebuActionSchema,
  displayCards: z.array(zebuDisplayCardSchema).max(12).optional(),
  followUp: z.array(z.string().trim().min(1).max(120)).max(4).optional(),
});

export type ZebuPlan = z.infer<typeof zebuPlanSchema>;
export type ZebuDisplayCard = z.infer<typeof zebuDisplayCardSchema>;

export function isAllowedZebuRoute(route: string): boolean {
  if ((ZEBU_ROUTES as readonly string[]).includes(route)) return true;
  return /^\/dashboard\/(resumes|applications)\/[A-Za-z0-9_-]+$/.test(route);
}
