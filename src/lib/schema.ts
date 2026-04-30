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

export const userRelations = relations(user, ({ many }) => ({
    resumes: many(resumes),
    jobs: many(jobs),
    coverLetters: many(coverLetters),
    atsOptimisations: many(atsOptimisations),
    projectAnalyses: many(projectAnalyses),
    sessions: many(session),
    accounts: many(account),
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
    versions: many(resumes, { relationName: "resumeVersions" }),
    analyses: many(analysis),
    atsOptimisations: many(atsOptimisations),
    coverLetters: many(coverLetters),
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

export const projectAnalyses = pgTable("project_analyses", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id),
    url: text("url").notNull(),
    score: integer("score").notNull(),
    data: jsonb("data").notNull(), // Stores the full analysis JSON
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const projectAnalysesRelations = relations(projectAnalyses, ({ one }) => ({
    user: one(user, { fields: [projectAnalyses.userId], references: [user.id] }),
}));

export const transactions = pgTable("transactions", {
    id: text("id").primaryKey(),
    orderId: text("order_id").notNull().unique(), // Razorpay order ID
    paymentId: text("payment_id").unique(), // Razorpay payment ID (set after verification)
    userId: text("user_id")
        .notNull()
        .references(() => user.id),
    planId: text("plan_id").notNull(),
    amount: integer("amount").notNull(), // Amount in paise
    currency: text("currency").notNull().default("INR"),
    status: text("status").notNull().default("pending"), // pending, completed, failed
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const transactionsRelations = relations(transactions, ({ one }) => ({
    user: one(user, { fields: [transactions.userId], references: [user.id] }),
}));
