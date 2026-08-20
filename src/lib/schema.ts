import { pgTable, text, timestamp, boolean, integer, jsonb, index } from "drizzle-orm/pg-core";
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
    evidenceNodes: many(evidenceNodes),
    backgroundJobs: many(backgroundJobs),
    documentArtifacts: many(documentArtifacts),
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
}, (table) => [
    index("resumes_user_id_idx").on(table.userId),
]);

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
}, (table) => [
    index("ats_optimisations_user_id_idx").on(table.userId),
]);

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
}, (table) => [
    index("transactions_order_id_idx").on(table.orderId),
    index("transactions_user_id_idx").on(table.userId),
]);

export const transactionsRelations = relations(transactions, ({ one }) => ({
    user: one(user, { fields: [transactions.userId], references: [user.id] }),
}));

export const rateLimitBuckets = pgTable("rate_limit_buckets", {
    key: text("key").primaryKey(),
    count: integer("count").notNull().default(1),
    windowStartedAt: timestamp("window_started_at").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
}, (table) => [
    index("rate_limit_buckets_expires_at_idx").on(table.expiresAt),
]);

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
}, (table) => [
    index("resume_versions_resume_user_idx").on(table.resumeId, table.userId),
]);

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
}, (table) => [
    index("work_items_user_id_idx").on(table.userId),
]);

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
}, (table) => [
    index("applications_user_id_idx").on(table.userId),
]);

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
}, (table) => [
    index("application_changes_app_user_idx").on(table.applicationId, table.userId),
]);

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

// --- EVIDENCE COMPILER & PLATFORM BOUNDARY ENTITIES ---

export const evidenceNodes = pgTable("evidence_nodes", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id),
    workItemId: text("work_item_id").references(() => workItems.id),
    companyOrProject: text("company_or_project").notNull(),
    roleOrContext: text("role_or_context"),
    skill: text("skill").notNull(),
    action: text("action").notNull(),
    measurableOutcome: text("measurable_outcome"),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    durationMonths: integer("duration_months"),
    proofUrl: text("proof_url"),
    confidence: text("confidence").notNull().default("asserted"), // verified, asserted, imported
    source: text("source").notNull().default("manual"), // work_item, manual, git, resume
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
    index("evidence_nodes_user_id_idx").on(table.userId),
    index("evidence_nodes_skill_idx").on(table.skill),
]);

export const evidenceNodesRelations = relations(evidenceNodes, ({ one }) => ({
    user: one(user, { fields: [evidenceNodes.userId], references: [user.id] }),
    workItem: one(workItems, { fields: [evidenceNodes.workItemId], references: [workItems.id] }),
}));

export const jobRequirementMatrices = pgTable("job_requirement_matrices", {
    id: text("id").primaryKey(),
    applicationId: text("application_id")
        .notNull()
        .references(() => applications.id),
    userId: text("user_id")
        .notNull()
        .references(() => user.id),
    requirementKey: text("requirement_key").notNull(),
    canonicalRequirement: text("canonical_requirement").notNull(),
    requirementCategory: text("requirement_category").notNull().default("tech_skill"), // hard_eligibility, tech_skill, domain_experience, soft_skill
    evidenceNodeId: text("evidence_node_id").references(() => evidenceNodes.id),
    matchStatus: text("match_status").notNull().default("missing_evidence"), // exact_match, terminology_mismatch, weak_evidence, missing_evidence
    confidenceScore: integer("confidence_score").notNull().default(0),
    suggestedPhrasing: text("suggested_phrasing"),
    candidatePrompt: text("candidate_prompt"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
    index("job_req_matrix_app_user_idx").on(table.applicationId, table.userId),
]);

export const jobRequirementMatricesRelations = relations(jobRequirementMatrices, ({ one }) => ({
    application: one(applications, { fields: [jobRequirementMatrices.applicationId], references: [applications.id] }),
    user: one(user, { fields: [jobRequirementMatrices.userId], references: [user.id] }),
    evidenceNode: one(evidenceNodes, { fields: [jobRequirementMatrices.evidenceNodeId], references: [evidenceNodes.id] }),
}));

export const preflightChecks = pgTable("preflight_checks", {
    id: text("id").primaryKey(),
    applicationId: text("application_id")
        .notNull()
        .references(() => applications.id),
    userId: text("user_id")
        .notNull()
        .references(() => user.id),
    atsSafetyScore: integer("ats_safety_score").notNull().default(100),
    evidenceCoverageScore: integer("evidence_coverage_score").notNull().default(0),
    parsingRiskFlags: jsonb("parsing_risk_flags"), // string[]
    hardEligibilityFlags: jsonb("hard_eligibility_flags"), // string[]
    terminologyMismatchCount: integer("terminology_mismatch_count").notNull().default(0),
    isClean: boolean("is_clean").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const preflightChecksRelations = relations(preflightChecks, ({ one }) => ({
    application: one(applications, { fields: [preflightChecks.applicationId], references: [applications.id] }),
    user: one(user, { fields: [preflightChecks.userId], references: [user.id] }),
}));

export const backgroundJobs = pgTable("background_jobs", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id),
    applicationId: text("application_id").references(() => applications.id),
    operationType: text("operation_type").notNull(), // job_extraction, evidence_mapping, tailored_compilation, preflight_validation
    status: text("status").notNull().default("pending"), // pending, processing, completed, failed
    progressPercent: integer("progress_percent").notNull().default(0),
    payload: jsonb("payload"),
    result: jsonb("result"),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
    index("background_jobs_user_id_idx").on(table.userId),
]);

export const backgroundJobsRelations = relations(backgroundJobs, ({ one }) => ({
    user: one(user, { fields: [backgroundJobs.userId], references: [user.id] }),
    application: one(applications, { fields: [backgroundJobs.applicationId], references: [applications.id] }),
}));

export const documentArtifacts = pgTable("document_artifacts", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id),
    applicationId: text("application_id").references(() => applications.id),
    resumeVersionId: text("resume_version_id").references(() => resumeVersions.id),
    documentType: text("document_type").notNull(), // ats_html, ats_txt, pdf_export
    contentHash: text("content_hash").notNull(),
    content: text("content").notNull(),
    storagePath: text("storage_path"),
    evidenceLineage: jsonb("evidence_lineage"), // Map of section/line -> evidenceNodeId
    isCanonical: boolean("is_canonical").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
    index("document_artifacts_user_app_idx").on(table.userId, table.applicationId),
]);

export const documentArtifactsRelations = relations(documentArtifacts, ({ one }) => ({
    user: one(user, { fields: [documentArtifacts.userId], references: [user.id] }),
    application: one(applications, { fields: [documentArtifacts.applicationId], references: [applications.id] }),
    resumeVersion: one(resumeVersions, { fields: [documentArtifacts.resumeVersionId], references: [resumeVersions.id] }),
}));
