import { relations } from "drizzle-orm/relations";
import { user, resumes, account, session, analysis, jobs, atsOptimisations, coverLetters } from "./schema";

export const resumesRelations = relations(resumes, ({one, many}) => ({
	user: one(user, {
		fields: [resumes.userId],
		references: [user.id]
	}),
	analyses: many(analysis),
	jobs: many(jobs),
	atsOptimisations: many(atsOptimisations),
	coverLetters: many(coverLetters),
}));

export const userRelations = relations(user, ({many}) => ({
	resumes: many(resumes),
	accounts: many(account),
	sessions: many(session),
	jobs: many(jobs),
	atsOptimisations: many(atsOptimisations),
	coverLetters: many(coverLetters),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const analysisRelations = relations(analysis, ({one}) => ({
	resume: one(resumes, {
		fields: [analysis.resumeId],
		references: [resumes.id]
	}),
}));

export const jobsRelations = relations(jobs, ({one}) => ({
	user: one(user, {
		fields: [jobs.userId],
		references: [user.id]
	}),
	resume: one(resumes, {
		fields: [jobs.resumeId],
		references: [resumes.id]
	}),
}));

export const atsOptimisationsRelations = relations(atsOptimisations, ({one}) => ({
	user: one(user, {
		fields: [atsOptimisations.userId],
		references: [user.id]
	}),
	resume: one(resumes, {
		fields: [atsOptimisations.resumeId],
		references: [resumes.id]
	}),
}));

export const coverLettersRelations = relations(coverLetters, ({one}) => ({
	user: one(user, {
		fields: [coverLetters.userId],
		references: [user.id]
	}),
	resume: one(resumes, {
		fields: [coverLetters.resumeId],
		references: [resumes.id]
	}),
}));