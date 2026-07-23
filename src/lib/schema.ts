import { pgTable, text, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull(),
	image: text("image"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
    credits: integer("credits").notNull().default(5),
    plan: text("plan").notNull().default("Free"),
});

export const userRelations = relations(user, ({ many, one }) => ({
    resumes: many(resumes),
    jobs: many(jobs),
    coverLetters: many(coverLetters),
    atsOptimisations: many(atsOptimisations),
    projectAnalyses: many(projectAnalyses),
    sessions: many(session),
    accounts: many(account),
    transactions: many(transactions),
    resumeVersions: many(resumeVersions),
    workItems: many(workItems),
    certifications: many(certifications),
    applications: many(applications),
    applicationChanges: many(applicationChanges),
    portfolios: one(portfolios),
    interviewNotes: many(interviewNotes),
    aiUsage: many(aiUsage),
}));

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id),
});

export const sessionRelations = relations(session, ({ one }) => ({
    user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

export const accountRelations = relations(account, ({ one }) => ({
    user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at"),
	updatedAt: timestamp("updated_at"),
});

export const resumes = pgTable("resumes", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id),
    parentResumeId: text("parent_resume_id"), // For duplication/versioning
    targetRole: text("target_role"),
    targetCompany: text("target_company"),
    title: text("title").notNull(),
    content: text("content"), // Can store raw text or serialized JSON
    status: text("status").notNull().default("Draft"),
    isPublic: boolean("is_public").notNull().default(false),
    shareToken: text("share_token"), // Unique token for public sharing
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});

export const resumesRelations = relations(resumes, ({ one, many }) => ({
    user: one(user, { fields: [resumes.userId], references: [user.id] }),
    parent: one(resumes, {
        fields: [resumes.parentResumeId],
        references: [resumes.id],
        relationName: "resumeVersions",
    }),
    duplicateVersions: many(resumes, { relationName: "resumeVersions" }),
    analyses: many(analysis),
    atsOptimisations: many(atsOptimisations),
    coverLetters: many(coverLetters),
    versions: many(resumeVersions),
}));

export const analysis = pgTable("analysis", {
    id: text("id").primaryKey(),
    resumeId: text("resume_id")
        .notNull()
        .references(() => resumes.id),
    score: integer("score").notNull(),
    feedback: jsonb("feedback").notNull(), // Stores structured AI insights
    createdAt: timestamp("created_at").notNull(),
});

export const analysisRelations = relations(analysis, ({ one }) => ({
    resume: one(resumes, { fields: [analysis.resumeId], references: [resumes.id] }),
}));

export const jobs = pgTable("jobs", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id),
    resumeId: text("resume_id")
        .references(() => resumes.id), // Optional: link to a resume
    resumeVersionId: text("resume_version_id")
        .references(() => resumeVersions.id),
    company: text("company").notNull(),
    position: text("position").notNull(),
    status: text("status").notNull().default("Applied"), // Applied, Interviewing, Offers, Rejected
    salary: text("salary"),
    location: text("location"),
    jobType: text("job_type"),
    description: text("description"),
    url: text("url"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});

export const jobsRelations = relations(jobs, ({ one }) => ({
    user: one(user, { fields: [jobs.userId], references: [user.id] }),
    resume: one(resumes, { fields: [jobs.resumeId], references: [resumes.id] }),
    version: one(resumeVersions, { fields: [jobs.resumeVersionId], references: [resumeVersions.id] }),
}));

export const coverLetters = pgTable("cover_letters", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id),
    resumeId: text("resume_id")
        .references(() => resumes.id),
    title: text("title").notNull(),
    jobDescription: text("job_description"),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});

export const coverLettersRelations = relations(coverLetters, ({ one }) => ({
    user: one(user, { fields: [coverLetters.userId], references: [user.id] }),
    resume: one(resumes, { fields: [coverLetters.resumeId], references: [resumes.id] }),
}));

export const atsOptimisations = pgTable("ats_optimisations", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id),
    resumeId: text("resume_id")
        .notNull()
        .references(() => resumes.id),
    jobDescription: text("job_description").notNull(),
    matchScore: integer("match_score").notNull(),
    feedback: jsonb("feedback").notNull(), // Keywords found, recommendations
    createdAt: timestamp("created_at").notNull(),
});

export const atsOptimisationsRelations = relations(atsOptimisations, ({ one }) => ({
    user: one(user, { fields: [atsOptimisations.userId], references: [user.id] }),
    resume: one(resumes, { fields: [atsOptimisations.resumeId], references: [resumes.id] }),
}));

export const transactions = pgTable("transactions", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id),
    provider: text("provider").notNull(), // e.g. "razorpay"
    orderId: text("order_id").notNull().unique(),
    paymentId: text("payment_id").unique(),
    planId: text("plan_id"),
    credits: integer("credits").notNull(),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull().default("INR"),
    status: text("status").notNull(), // "pending", "success", "failed"
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});

export const transactionsRelations = relations(transactions, ({ one }) => ({
    user: one(user, { fields: [transactions.userId], references: [user.id] }),
}));

export const projectAnalyses = pgTable("project_analyses", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id),
    url: text("url").notNull(),
    score: integer("score").notNull(),
    data: jsonb("data").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const projectAnalysesRelations = relations(projectAnalyses, ({ one }) => ({
    user: one(user, { fields: [projectAnalyses.userId], references: [user.id] }),
}));

export const resumeVersions = pgTable("resume_versions", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id),
    resumeId: text("resume_id")
        .notNull()
        .references(() => resumes.id),
    title: text("title").notNull(),
    company: text("company"),
    targetRole: text("target_role"),
    jobDescription: text("job_description"),
    content: text("content").notNull(),
    matchScore: integer("match_score"),
    feedback: jsonb("feedback"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});

export const resumeVersionsRelations = relations(resumeVersions, ({ one }) => ({
    user: one(user, { fields: [resumeVersions.userId], references: [user.id] }),
    resume: one(resumes, { fields: [resumeVersions.resumeId], references: [resumes.id] }),
}));

// --- SPEC CANONICAL ENTITIES ---

export const workItems = pgTable("work_items", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id),
    title: text("title").notNull(),
    category: text("category").notNull().default("Project"), // Project, Internship, Hackathon, Course, Award, Other
    description: text("description"),
    tools: jsonb("tools"), // string[]
    result: text("result"), // What was achieved or learned
    proofUrl: text("proof_url"),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    isPublic: boolean("is_public").notNull().default(false),
    lastReviewedAt: timestamp("last_reviewed_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});

export const workItemsRelations = relations(workItems, ({ one }) => ({
    user: one(user, { fields: [workItems.userId], references: [user.id] }),
}));

export const certifications = pgTable("certifications", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id),
    title: text("title").notNull(),
    issuer: text("issuer").notNull(),
    issueDate: timestamp("issue_date"),
    credentialUrl: text("credential_url"),
    skills: jsonb("skills"), // string[]
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});

export const certificationsRelations = relations(certifications, ({ one }) => ({
    user: one(user, { fields: [certifications.userId], references: [user.id] }),
}));

export const applications = pgTable("applications", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id),
    company: text("company").notNull(),
    position: text("position").notNull(),
    jobDescription: text("job_description"),
    url: text("url"),
    status: text("status").notNull().default("Draft"), // Draft, Tailoring, Applied, Interviewing, Offer, Rejected
    selectedResumeId: text("selected_resume_id").references(() => resumes.id),
    resumeVersionId: text("resume_version_id").references(() => resumeVersions.id),
    selectedWorkIds: jsonb("selected_work_ids"), // string[]
    selectedCertIds: jsonb("selected_cert_ids"), // string[]
    deadline: timestamp("deadline"),
    notes: text("notes"),
    outcome: text("outcome"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});

export const applicationsRelations = relations(applications, ({ one, many }) => ({
    user: one(user, { fields: [applications.userId], references: [user.id] }),
    selectedResume: one(resumes, { fields: [applications.selectedResumeId], references: [resumes.id] }),
    resumeVersion: one(resumeVersions, { fields: [applications.resumeVersionId], references: [resumeVersions.id] }),
    changes: many(applicationChanges),
    interviewNotes: many(interviewNotes),
}));

export const applicationChanges = pgTable("application_changes", {
    id: text("id").primaryKey(),
    applicationId: text("application_id")
        .notNull()
        .references(() => applications.id),
    userId: text("user_id")
        .notNull()
        .references(() => user.id),
    section: text("section").notNull(),
    changeType: text("change_type").notNull(),
    originalText: text("original_text"),
    suggestedText: text("suggested_text").notNull(),
    userEdits: text("user_edits"),
    status: text("status").notNull().default("pending"), // pending, approved, rejected
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});

export const applicationChangesRelations = relations(applicationChanges, ({ one }) => ({
    application: one(applications, { fields: [applicationChanges.applicationId], references: [applications.id] }),
    user: one(user, { fields: [applicationChanges.userId], references: [user.id] }),
}));

export const portfolios = pgTable("portfolios", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .unique()
        .references(() => user.id),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    bio: text("bio"),
    selectedWorkIds: jsonb("selected_work_ids"), // string[]
    isPublished: boolean("is_published").notNull().default(false),
    theme: text("theme").notNull().default("default"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});

export const portfoliosRelations = relations(portfolios, ({ one }) => ({
    user: one(user, { fields: [portfolios.userId], references: [user.id] }),
}));

export const interviewNotes = pgTable("interview_notes", {
    id: text("id").primaryKey(),
    applicationId: text("application_id")
        .notNull()
        .references(() => applications.id),
    userId: text("user_id")
        .notNull()
        .references(() => user.id),
    question: text("question").notNull(),
    category: text("category"),
    studentAnswer: text("student_answer"),
    keyPoints: jsonb("key_points"),
    outcome: text("outcome"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});

export const interviewNotesRelations = relations(interviewNotes, ({ one }) => ({
    application: one(applications, { fields: [interviewNotes.applicationId], references: [applications.id] }),
    user: one(user, { fields: [interviewNotes.userId], references: [user.id] }),
}));

export const aiUsage = pgTable("ai_usage", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id),
    operationName: text("operation_name").notNull(),
    promptVersion: text("prompt_version").notNull().default("v1"),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    creditsCost: integer("credits_cost").notNull().default(1),
    idempotencyKey: text("idempotency_key").unique(),
    status: text("status").notNull().default("success"),
    createdAt: timestamp("created_at").notNull(),
});

export const aiUsageRelations = relations(aiUsage, ({ one }) => ({
    user: one(user, { fields: [aiUsage.userId], references: [user.id] }),
}));
