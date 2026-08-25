import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { and, asc, desc, eq, gte, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { applications, coverLetters, portfolios, resumes, workItems } from "@/lib/schema";
import type { ZebuDisplayCard, ZebuPlan } from "@/lib/zebu-contract";
import { getUserOwnedApplication, getUserOwnedResume } from "@/lib/auth-policy";
import { Type, type FunctionDeclaration } from "@google/genai";
import { validateStatusTransition } from "@/lib/application-state-machine";

type Result = Pick<ZebuPlan, "spokenResponse" | "displayCards" | "followUp">;
const clean = (value: string) => value.replace(/[\\%_]/g, " ").trim().slice(0, 100);

export async function executeSearch(userId: string, rawQuery: string): Promise<Result> {
  const query = clean(rawQuery);
  const pattern = `%${query}%`;
  const [resumeRows, applicationRows, workRows] = await Promise.all([
    db.select({ id: resumes.id, title: resumes.title, targetRole: resumes.targetRole, updatedAt: resumes.updatedAt }).from(resumes)
      .where(and(eq(resumes.userId, userId), or(ilike(resumes.title, pattern), ilike(resumes.targetRole, pattern)))).orderBy(desc(resumes.updatedAt)).limit(4),
    db.select({ id: applications.id, company: applications.company, position: applications.position, status: applications.status }).from(applications)
      .where(and(eq(applications.userId, userId), or(ilike(applications.company, pattern), ilike(applications.position, pattern)))).orderBy(desc(applications.updatedAt)).limit(4),
    db.select({ id: workItems.id, title: workItems.title, category: workItems.category }).from(workItems)
      .where(and(eq(workItems.userId, userId), or(ilike(workItems.title, pattern), ilike(workItems.description, pattern)))).orderBy(desc(workItems.updatedAt)).limit(4),
  ]);
  const cards: ZebuDisplayCard[] = [
    ...resumeRows.map((r) => ({ id: r.id, kind: "resume" as const, title: r.title, subtitle: r.targetRole ?? "Resume", href: `/dashboard/resumes/${r.id}` })),
    ...applicationRows.map((a) => ({ id: a.id, kind: "application" as const, title: `${a.company} · ${a.position}`, meta: a.status, href: `/dashboard/applications/${a.id}` })),
    ...workRows.map((w) => ({ id: w.id, kind: "work" as const, title: w.title, meta: w.category, href: "/dashboard/work" })),
  ];
  return { spokenResponse: cards.length ? `I found ${cards.length} workspace ${cards.length === 1 ? "match" : "matches"} for ${query}.` : `I couldn't find a saved workspace item matching ${query}.`, displayCards: cards, followUp: ["Show my workspace stats", "What should I do next?"] };
}

export async function executeQuickStats(userId: string): Promise<Result> {
  const [resumeRows, appRows, workRows, letterRows, portfolio] = await Promise.all([
    db.select({ id: resumes.id }).from(resumes).where(eq(resumes.userId, userId)),
    db.select({ id: applications.id, status: applications.status }).from(applications).where(eq(applications.userId, userId)),
    db.select({ id: workItems.id }).from(workItems).where(eq(workItems.userId, userId)),
    db.select({ id: coverLetters.id }).from(coverLetters).where(eq(coverLetters.userId, userId)),
    db.query.portfolios.findFirst({ where: eq(portfolios.userId, userId), columns: { isPublished: true } }),
  ]);
  const active = appRows.filter((a) => !["Rejected", "Withdrawn", "Offer"].includes(a.status)).length;
  const cards: ZebuDisplayCard[] = [
    { id: "resumes", kind: "stat", title: String(resumeRows.length), subtitle: "Resumes", href: "/dashboard/resumes" },
    { id: "applications", kind: "stat", title: String(active), subtitle: "Active applications", href: "/dashboard/job-tracker" },
    { id: "work", kind: "stat", title: String(workRows.length), subtitle: "Work items", href: "/dashboard/work" },
    { id: "letters", kind: "stat", title: String(letterRows.length), subtitle: "Cover letters", href: "/dashboard/cover-letters" },
    { id: "portfolio", kind: "stat", title: portfolio?.isPublished ? "Live" : "Draft", subtitle: "Portfolio", href: "/dashboard/portfolio" },
  ];
  return { spokenResponse: `You have ${resumeRows.length} resumes, ${active} active applications, and ${workRows.length} work items.`, displayCards: cards, followUp: ["Show my deadlines", "What should I work on next?"] };
}

export async function executeDeadlineCheck(userId: string): Promise<Result> {
  const now = new Date();
  const rows = await db.select({ id: applications.id, company: applications.company, position: applications.position, deadline: applications.deadline })
    .from(applications).where(and(eq(applications.userId, userId), gte(applications.deadline, now))).orderBy(asc(applications.deadline)).limit(8);
  const cards: ZebuDisplayCard[] = rows.map((a) => {
    const days = Math.ceil(((a.deadline?.getTime() ?? now.getTime()) - now.getTime()) / 86_400_000);
    return { id: a.id, kind: "deadline", title: `${a.company} · ${a.position}`, subtitle: a.deadline?.toLocaleDateString(), meta: days === 0 ? "Today" : `${days} days`, urgency: days <= 3 ? "high" : days <= 7 ? "medium" : "low", href: `/dashboard/applications/${a.id}` };
  });
  return { spokenResponse: cards.length ? `You have ${cards.length} upcoming application ${cards.length === 1 ? "deadline" : "deadlines"}.` : "You have no upcoming application deadlines saved.", displayCards: cards, followUp: ["Show active applications", "What should I do next?"] };
}

export async function executeSuggestNext(userId: string): Promise<Result> {
  const stats = await executeQuickStats(userId);
  const resumeCount = Number(stats.displayCards?.find((c) => c.id === "resumes")?.title ?? 0);
  const appCount = Number(stats.displayCards?.find((c) => c.id === "applications")?.title ?? 0);
  const suggestion = resumeCount === 0 ? { title: "Create your first resume", href: "/dashboard/resumes" } : appCount === 0 ? { title: "Add a target application", href: "/dashboard/job-tracker" } : { title: "Review upcoming deadlines", href: "/dashboard/job-tracker" };
  return { spokenResponse: `Your best next step is to ${suggestion.title.toLowerCase()}.`, displayCards: [{ id: "next", kind: "suggestion", title: suggestion.title, subtitle: "Recommended next action", href: suggestion.href }], followUp: ["Show my stats", "Show my deadlines"] };
}

export async function executeSummary(userId: string, entityType: "resume" | "application" | "work", query = ""): Promise<Result> {
  const found = await executeSearch(userId, query || entityType);
  const filtered = found.displayCards?.filter((card) => card.kind === entityType);
  return { spokenResponse: filtered?.length ? `Here are the most relevant saved ${entityType} details I found. Open a card for the full record.` : `I couldn't find a saved ${entityType} matching that request.`, displayCards: filtered, followUp: ["Search something else", "What should I do next?"] };
}

const applicationDraftSchema = z.object({
  company: z.string().trim().min(1).max(160),
  position: z.string().trim().min(1).max(160),
  deadline: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(2_000).optional(),
});

const workItemSchema = z.object({
  title: z.string().trim().min(1).max(200),
  category: z.enum(["Project", "Internship", "Hackathon", "Course", "Award", "Other"]).default("Project"),
  description: z.string().trim().max(2_000).optional(),
});

const applicationUpdateSchema = z.object({
  applicationId: z.string().trim().min(1).max(160),
  status: z.enum(["Draft", "Preparing", "Ready", "Applied", "Interviewing", "Offer", "Rejected", "Withdrawn"]).optional(),
  deadline: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(2_000).optional(),
}).refine((value) => value.status !== undefined || value.deadline !== undefined || value.notes !== undefined, "No application change was supplied");

function parseDeadline(value: string | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error("The deadline must be a valid ISO date.");
  return parsed;
}

function createRecordId(prefix: "app" | "work", userId: string, rawRequestId: unknown): string {
  if (typeof rawRequestId === "string" && rawRequestId.length > 0) {
    const digest = createHash("sha256").update(`${userId}:${prefix}:${rawRequestId}`).digest("hex").slice(0, 20);
    return `${prefix}_${digest}`;
  }
  return `${prefix}_${Date.now()}_${randomUUID().slice(0, 8)}`;
}

export async function executeCreateApplicationDraft(userId: string, rawArgs: Record<string, unknown>): Promise<Result> {
  const args = applicationDraftSchema.parse(rawArgs);
  const deadline = parseDeadline(args.deadline) ?? null;
  const now = new Date();
  const id = createRecordId("app", userId, rawArgs.__requestId);
  const [inserted] = await db.insert(applications).values({
    id,
    userId,
    company: args.company,
    position: args.position,
    status: "Draft",
    selectedWorkIds: [],
    selectedCertIds: [],
    deadline,
    notes: args.notes || null,
    createdAt: now,
    updatedAt: now,
  }).onConflictDoNothing({ target: applications.id }).returning({ id: applications.id, company: applications.company, position: applications.position, deadline: applications.deadline });
  const created = inserted ?? await db.query.applications.findFirst({
    where: and(eq(applications.id, id), eq(applications.userId, userId)),
    columns: { id: true, company: true, position: true, deadline: true },
  });
  if (!created) throw new Error("The application draft could not be created.");
  return {
    spokenResponse: `I created a draft application for ${created.position} at ${created.company}.`,
    displayCards: [{ id: created.id, kind: "application", title: `${created.company} · ${created.position}`, subtitle: created.deadline?.toLocaleDateString(), meta: "Draft", href: `/dashboard/applications/${created.id}` }],
    followUp: ["Open the application", "Show my active applications"],
  };
}

export async function executeCreateWorkItem(userId: string, rawArgs: Record<string, unknown>): Promise<Result> {
  const args = workItemSchema.parse(rawArgs);
  const now = new Date();
  const id = createRecordId("work", userId, rawArgs.__requestId);
  const [inserted] = await db.insert(workItems).values({
    id,
    userId,
    title: args.title,
    category: args.category,
    description: args.description || null,
    tools: [],
    isPublic: false,
    lastReviewedAt: now,
    createdAt: now,
    updatedAt: now,
  }).onConflictDoNothing({ target: workItems.id }).returning({ id: workItems.id, title: workItems.title, category: workItems.category });
  const created = inserted ?? await db.query.workItems.findFirst({
    where: and(eq(workItems.id, id), eq(workItems.userId, userId)),
    columns: { id: true, title: true, category: true },
  });
  if (!created) throw new Error("The work item could not be created.");
  return {
    spokenResponse: `I added ${created.title} to Work as a ${created.category.toLowerCase()}.`,
    displayCards: [{ id: created.id, kind: "work", title: created.title, meta: created.category, href: "/dashboard/work" }],
    followUp: ["Open Work", "What should I add next?"],
  };
}

export async function executeUpdateApplication(userId: string, rawArgs: Record<string, unknown>): Promise<Result> {
  const args = applicationUpdateSchema.parse(rawArgs);
  const existing = await getUserOwnedApplication(userId, args.applicationId);
  if (!existing) throw new Error("Application not found.");
  if (args.status !== undefined) {
    const transition = validateStatusTransition(existing.status as Parameters<typeof validateStatusTransition>[0], args.status, existing);
    if (!transition.valid) throw new Error(transition.error);
  }
  const now = new Date();
  const update: { status?: string; deadline?: Date | null; notes?: string | null; updatedAt: Date } = { updatedAt: now };
  if (args.status !== undefined) update.status = args.status;
  const deadline = parseDeadline(args.deadline);
  if (deadline !== undefined) update.deadline = deadline;
  if (args.notes !== undefined) update.notes = args.notes || null;
  else if (args.status !== undefined && args.status !== existing.status) {
    const audit = `[${now.toISOString()}] Status updated by Zebu: ${existing.status} -> ${args.status}`;
    update.notes = existing.notes ? `${existing.notes}\n${audit}` : audit;
  }
  const [updated] = await db.update(applications).set(update).where(and(eq(applications.id, existing.id), eq(applications.userId, userId))).returning({
    id: applications.id,
    company: applications.company,
    position: applications.position,
    status: applications.status,
    deadline: applications.deadline,
  });
  if (!updated) throw new Error("The application could not be updated.");
  const changes = [args.status ? `status to ${args.status}` : "", args.deadline !== undefined ? (args.deadline ? "the deadline" : "removed the deadline") : "", args.notes !== undefined ? "the notes" : ""].filter(Boolean);
  return {
    spokenResponse: `I updated ${updated.company}: ${changes.join(" and ")}.`,
    displayCards: [{ id: updated.id, kind: "application", title: `${updated.company} · ${updated.position}`, subtitle: updated.deadline?.toLocaleDateString(), meta: updated.status, href: `/dashboard/applications/${updated.id}` }],
    followUp: ["Open the application", "Show my deadlines"],
  };
}

export const zebuLiveToolDeclarations: FunctionDeclaration[] = [
  { name: "navigate_to_page", description: "Navigate to a safe Zebra workspace page.", parameters: { type: Type.OBJECT, properties: { page: { type: Type.STRING, enum: ["home", "resumes", "applications", "work", "cover_letters", "portfolio", "analytics", "settings"] } }, required: ["page"] } },
  { name: "search_workspace", description: "Search the user's saved resumes, applications, and work items.", parameters: { type: Type.OBJECT, properties: { query: { type: Type.STRING } }, required: ["query"] } },
  { name: "get_quick_stats", description: "Get counts for resumes, active applications, work items, cover letters, and portfolio state.", parameters: { type: Type.OBJECT, properties: {} } },
  { name: "get_deadlines", description: "Get upcoming saved application deadlines sorted by urgency.", parameters: { type: Type.OBJECT, properties: {} } },
  { name: "suggest_next_action", description: "Recommend the best next workspace action based on saved data.", parameters: { type: Type.OBJECT, properties: {} } },
  { name: "open_resume", description: "Open a resume by its exact ID from a prior search result.", parameters: { type: Type.OBJECT, properties: { resumeId: { type: Type.STRING } }, required: ["resumeId"] } },
  { name: "open_application", description: "Open an application by its exact ID from a prior search result.", parameters: { type: Type.OBJECT, properties: { applicationId: { type: Type.STRING } }, required: ["applicationId"] } },
  { name: "start_resume_check", description: "Open the existing resume analysis tool without running or spending credits.", parameters: { type: Type.OBJECT, properties: {} } },
  { name: "start_role_match", description: "Open the existing role-match tool without running or spending credits.", parameters: { type: Type.OBJECT, properties: {} } },
  { name: "create_application_draft", description: "Create a real draft application record. Call only when the user clearly asks to add, create, save, or track it and gives both company and position.", parameters: { type: Type.OBJECT, properties: { company: { type: Type.STRING }, position: { type: Type.STRING }, deadline: { type: Type.STRING, description: "Optional ISO 8601 date or datetime explicitly supplied by the user." }, notes: { type: Type.STRING } }, required: ["company", "position"] } },
  { name: "create_work_item", description: "Create a real private work-evidence item. Call only after an explicit request to add or save it.", parameters: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, category: { type: Type.STRING, enum: ["Project", "Internship", "Hackathon", "Course", "Award", "Other"] }, description: { type: Type.STRING } }, required: ["title", "category"] } },
  { name: "update_application", description: "Update a real application status, deadline, or notes. Use an exact applicationId from workspace data and call only after an explicit user instruction. Never infer a status change.", parameters: { type: Type.OBJECT, properties: { applicationId: { type: Type.STRING }, status: { type: Type.STRING, enum: ["Draft", "Preparing", "Ready", "Applied", "Interviewing", "Offer", "Rejected", "Withdrawn"] }, deadline: { type: Type.STRING, description: "ISO 8601 date/datetime, or an empty string to clear it." }, notes: { type: Type.STRING } }, required: ["applicationId"] } },
];

export type ZebuLiveUiAction = { type: "navigate"; route: string } | { type: "open_tool"; tool: "resume_analysis" | "role_match" };
export type ZebuLiveToolResult = { result: Record<string, unknown>; cards?: ZebuDisplayCard[]; uiAction?: ZebuLiveUiAction };

export async function executeZebuLiveTool(name: string, args: Record<string, unknown>, userId: string): Promise<ZebuLiveToolResult> {
  if (name === "navigate_to_page") {
    const routes: Record<string, string> = { home: "/dashboard", resumes: "/dashboard/resumes", applications: "/dashboard/job-tracker", work: "/dashboard/work", cover_letters: "/dashboard/cover-letters", portfolio: "/dashboard/portfolio", analytics: "/dashboard/analytics", settings: "/dashboard/settings" };
    const route = routes[String(args.page ?? "")];
    if (!route) throw new Error("Unsupported destination");
    return { result: { success: true, destination: String(args.page) }, uiAction: { type: "navigate", route } };
  }
  if (name === "search_workspace") {
    const data = await executeSearch(userId, String(args.query ?? ""));
    return { result: { summary: data.spokenResponse, matches: data.displayCards ?? [] }, cards: data.displayCards };
  }
  if (name === "get_quick_stats") {
    const data = await executeQuickStats(userId);
    return { result: { summary: data.spokenResponse, stats: data.displayCards ?? [] }, cards: data.displayCards };
  }
  if (name === "get_deadlines") {
    const data = await executeDeadlineCheck(userId);
    return { result: { summary: data.spokenResponse, deadlines: data.displayCards ?? [] }, cards: data.displayCards };
  }
  if (name === "suggest_next_action") {
    const data = await executeSuggestNext(userId);
    return { result: { recommendation: data.spokenResponse }, cards: data.displayCards };
  }
  if (name === "open_resume") {
    const resume = await getUserOwnedResume(userId, String(args.resumeId ?? ""));
    if (!resume) throw new Error("Resume not found");
    return { result: { success: true, title: resume.title }, uiAction: { type: "navigate", route: `/dashboard/resumes/${resume.id}` } };
  }
  if (name === "open_application") {
    const application = await getUserOwnedApplication(userId, String(args.applicationId ?? ""));
    if (!application) throw new Error("Application not found");
    return { result: { success: true, company: application.company, position: application.position }, uiAction: { type: "navigate", route: `/dashboard/applications/${application.id}` } };
  }
  if (name === "start_resume_check") return { result: { success: true, note: "Tool opened; analysis has not started." }, uiAction: { type: "open_tool", tool: "resume_analysis" } };
  if (name === "start_role_match") return { result: { success: true, note: "Tool opened; role matching has not started." }, uiAction: { type: "open_tool", tool: "role_match" } };
  if (name === "create_application_draft") {
    const data = await executeCreateApplicationDraft(userId, args);
    return { result: { success: true, summary: data.spokenResponse, application: data.displayCards?.[0] ?? null }, cards: data.displayCards };
  }
  if (name === "create_work_item") {
    const data = await executeCreateWorkItem(userId, args);
    return { result: { success: true, summary: data.spokenResponse, workItem: data.displayCards?.[0] ?? null }, cards: data.displayCards };
  }
  if (name === "update_application") {
    const data = await executeUpdateApplication(userId, args);
    return { result: { success: true, summary: data.spokenResponse, application: data.displayCards?.[0] ?? null }, cards: data.displayCards };
  }
  throw new Error("Unsupported Zebu tool");
}
