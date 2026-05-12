import { pgTable, foreignKey, text, timestamp, boolean, unique, integer, jsonb } from "drizzle-orm/pg-core"



export const resumes = pgTable("resumes", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	title: text().notNull(),
	content: text(),
	status: text().default('Draft').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	isPublic: boolean("is_public").default(false).notNull(),
	shareToken: text("share_token"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "resumes_user_id_user_id_fk"
		}),
]);

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
});

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_user_id_user_id_fk"
		}),
]);

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_user_id_user_id_fk"
		}),
	unique("session_token_unique").on(table.token),
]);

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").notNull(),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	credits: integer().default(5).notNull(),
	plan: text().default('Free').notNull(),
}, (table) => [
	unique("user_email_unique").on(table.email),
]);

export const analysis = pgTable("analysis", {
	id: text().primaryKey().notNull(),
	resumeId: text("resume_id").notNull(),
	score: integer().notNull(),
	feedback: jsonb().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.resumeId],
			foreignColumns: [resumes.id],
			name: "analysis_resume_id_resumes_id_fk"
		}),
]);

export const jobs = pgTable("jobs", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	company: text().notNull(),
	position: text().notNull(),
	status: text().default('Applied').notNull(),
	salary: text(),
	url: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	resumeId: text("resume_id"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "jobs_user_id_user_id_fk"
		}),
	foreignKey({
			columns: [table.resumeId],
			foreignColumns: [resumes.id],
			name: "jobs_resume_id_resumes_id_fk"
		}),
]);

export const atsOptimisations = pgTable("ats_optimisations", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	resumeId: text("resume_id").notNull(),
	jobDescription: text("job_description").notNull(),
	matchScore: integer("match_score").notNull(),
	feedback: jsonb().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "ats_optimisations_user_id_user_id_fk"
		}),
	foreignKey({
			columns: [table.resumeId],
			foreignColumns: [resumes.id],
			name: "ats_optimisations_resume_id_resumes_id_fk"
		}),
]);

export const coverLetters = pgTable("cover_letters", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	resumeId: text("resume_id"),
	title: text().notNull(),
	jobDescription: text("job_description"),
	content: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "cover_letters_user_id_user_id_fk"
		}),
	foreignKey({
			columns: [table.resumeId],
			foreignColumns: [resumes.id],
			name: "cover_letters_resume_id_resumes_id_fk"
		}),
]);
