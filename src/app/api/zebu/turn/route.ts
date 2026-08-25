import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { applications, jobs, resumes, workItems } from "@/lib/schema";
import { requireAuth } from "@/lib/auth-policy";
import { checkDistributedRateLimit } from "@/lib/rate-limit";
import { generateAiResponse } from "@/lib/azure-foundry";
import { isAllowedZebuRoute, zebuPlanSchema, zebuTurnSchema, type ZebuPlan } from "@/lib/zebu-contract";
import { executeCreateApplicationDraft, executeCreateWorkItem, executeDeadlineCheck, executeQuickStats, executeSearch, executeSuggestNext, executeSummary, executeUpdateApplication } from "@/lib/zebu-actions";

const actionVariants = [
  { type: "object", additionalProperties: false, required: ["type"], properties: { type: { const: "none" } } },
  { type: "object", additionalProperties: false, required: ["type", "route"], properties: { type: { const: "navigate" }, route: { type: "string" } } },
  { type: "object", additionalProperties: false, required: ["type", "tool"], properties: { type: { const: "open_tool" }, tool: { enum: ["resume_analysis", "role_match"] } } },
  { type: "object", additionalProperties: false, required: ["type", "query"], properties: { type: { const: "search" }, query: { type: "string" } } },
  { type: "object", additionalProperties: false, required: ["type", "entityType", "query"], properties: { type: { const: "summarize" }, entityType: { enum: ["resume", "application", "work"] }, query: { type: "string" } } },
  { type: "object", additionalProperties: false, required: ["type"], properties: { type: { const: "quick_stats" } } },
  { type: "object", additionalProperties: false, required: ["type", "flow"], properties: { type: { const: "start_flow" }, flow: { enum: ["resume", "application", "cover_letter"] } } },
  { type: "object", additionalProperties: false, required: ["type", "query"], properties: { type: { const: "open_resume" }, query: { type: "string" } } },
  { type: "object", additionalProperties: false, required: ["type", "query"], properties: { type: { const: "open_application" }, query: { type: "string" } } },
  { type: "object", additionalProperties: false, required: ["type"], properties: { type: { const: "deadline_check" } } },
  { type: "object", additionalProperties: false, required: ["type"], properties: { type: { const: "suggest_next" } } },
  { type: "object", additionalProperties: false, required: ["type", "company", "position"], properties: { type: { const: "create_application" }, company: { type: "string" }, position: { type: "string" } } },
  { type: "object", additionalProperties: false, required: ["type", "title", "category", "description"], properties: { type: { const: "create_work" }, title: { type: "string" }, category: { enum: ["Project", "Internship", "Hackathon", "Course", "Award", "Other"] }, description: { type: "string" } } },
  { type: "object", additionalProperties: false, required: ["type", "applicationId", "status"], properties: { type: { const: "update_application_status" }, applicationId: { type: "string" }, status: { enum: ["Draft", "Preparing", "Ready", "Applied", "Interviewing", "Offer", "Rejected", "Withdrawn"] } } },
];

const responseFormat = { type: "json_schema" as const, name: "zebu_turn", strict: true, schema: {
  type: "object", additionalProperties: false, required: ["spokenResponse", "action"],
  properties: { spokenResponse: { type: "string" }, action: { oneOf: actionVariants } },
} };

async function enrichPlan(userId: string, plan: ZebuPlan): Promise<ZebuPlan> {
  const action = plan.action;
  if (action.type === "search") return { ...plan, ...(await executeSearch(userId, action.query)) };
  if (action.type === "summarize") return { ...plan, ...(await executeSummary(userId, action.entityType, action.query)) };
  if (action.type === "quick_stats") return { ...plan, ...(await executeQuickStats(userId)) };
  if (action.type === "deadline_check") return { ...plan, ...(await executeDeadlineCheck(userId)) };
  if (action.type === "suggest_next") return { ...plan, ...(await executeSuggestNext(userId)) };
  if (action.type === "create_application") return { ...plan, ...(await executeCreateApplicationDraft(userId, action)), action: { type: "none" } };
  if (action.type === "create_work") return { ...plan, ...(await executeCreateWorkItem(userId, action)), action: { type: "none" } };
  if (action.type === "update_application_status") return { ...plan, ...(await executeUpdateApplication(userId, action)), action: { type: "none" } };
  if (action.type === "start_flow") {
    const routes = { resume: "/dashboard/resumes", application: "/dashboard/job-tracker", cover_letter: "/dashboard/cover-letters" } as const;
    return { ...plan, action: { type: "navigate", route: routes[action.flow] } };
  }
  if (action.type === "open_resume" || action.type === "open_application") {
    const result = await executeSearch(userId, action.query);
    const kind = action.type === "open_resume" ? "resume" : "application";
    const match = result.displayCards?.find((card) => card.kind === kind && card.href);
    return match ? { ...plan, spokenResponse: `Opening ${match.title}.`, action: { type: "navigate", route: match.href! } } : { ...plan, ...result, action: { type: "none" } };
  }
  return plan;
}

export async function POST(request: NextRequest) {
  try {
    const { auth, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;
    const rate = await checkDistributedRateLimit(`zebu-turn:${auth.user.id}`, 12, 60_000);
    if (!rate.success) return NextResponse.json({ error: "Zebu is receiving too many requests. Wait a moment and retry." }, { status: 429 });
    const parsed = zebuTurnSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid Zebu request" }, { status: 400 });

    const [userResumes, userApplications, legacyJobs, userWork] = await Promise.all([
      db.query.resumes.findMany({ where: eq(resumes.userId, auth.user.id), orderBy: [desc(resumes.updatedAt)], columns: { id: true, title: true, targetRole: true, updatedAt: true }, limit: 20 }),
      db.query.applications.findMany({ where: eq(applications.userId, auth.user.id), orderBy: [desc(applications.updatedAt)], columns: { id: true, company: true, position: true, status: true, deadline: true, updatedAt: true }, limit: 30 }),
      db.query.jobs.findMany({ where: eq(jobs.userId, auth.user.id), orderBy: [desc(jobs.updatedAt)], columns: { id: true, company: true, position: true, status: true, updatedAt: true }, limit: 20 }),
      db.query.workItems.findMany({ where: eq(workItems.userId, auth.user.id), orderBy: [desc(workItems.updatedAt)], columns: { id: true, title: true, category: true, updatedAt: true }, limit: 20 }),
    ]);
    const context = JSON.stringify({ user: { name: auth.user.name }, currentPage: parsed.data.currentPage, resumes: userResumes, applications: userApplications, legacyJobs, work: userWork });
    const systemPrompt = `You are Zebu, Zebra AI's concise, warm voice workspace agent. Choose at most one action.
Use search for broad finding; open_resume/open_application when the user clearly asks to open one; summarize for a saved entity summary; quick_stats for counts; deadline_check for deadlines; suggest_next for recommendations; start_flow only to navigate to a creation screen. Use open_tool for resume analysis or role matching. Use create_application or create_work only after a clear command to add/create/save/track a record and all required fields are present. Use update_application_status only after a clear request and only with an exact ID from WORKSPACE_CONTEXT. If a write request is ambiguous, ask one short follow-up and choose none.
Page mapping: home=/dashboard, applications=/dashboard/job-tracker, resumes=/dashboard/resumes, work=/dashboard/work, cover letters=/dashboard/cover-letters, portfolio=/dashboard/portfolio, analytics=/dashboard/analytics, settings=/dashboard/settings.
Use only facts in WORKSPACE_CONTEXT and tool results. You may create private draft applications and work items or update application status through the allowed actions. Never delete, externally submit, email, publish, spend credits, browse the public web, or navigate externally. Do not claim a mutation succeeded before its action executes. Keep the response voice-friendly and under 120 words.
WORKSPACE_CONTEXT=${context}`;
    const raw = await generateAiResponse({ task: "zebu", prompt: parsed.data.message, history: parsed.data.history, systemPrompt, responseFormat, preferGemini: true });
    let plan = zebuPlanSchema.parse(JSON.parse(raw));
    plan = await enrichPlan(auth.user.id, plan);
    if (plan.action.type === "navigate" && !isAllowedZebuRoute(plan.action.route)) plan = { spokenResponse: "That destination is not enabled for Zebu yet.", action: { type: "none" } };
    return NextResponse.json(plan);
  } catch (error) {
    console.error(`[Zebu] Turn failed (${error instanceof Error ? error.name : "UnknownError"}).`);
    return NextResponse.json({ error: "Zebu could not complete that request through Azure. Please retry." }, { status: 502 });
  }
}
