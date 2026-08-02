-- Core Application Journey Database Integrity Migration
-- Creates missing application journey tables and user-scoped query indexes safely without data loss.

CREATE TABLE IF NOT EXISTS "work_items" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"category" text DEFAULT 'Project' NOT NULL,
	"description" text,
	"tools" jsonb,
	"result" text,
	"proof_url" text,
	"start_date" timestamp,
	"end_date" timestamp,
	"is_public" boolean DEFAULT false NOT NULL,
	"last_reviewed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "certifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"issuer" text NOT NULL,
	"issue_date" timestamp,
	"credential_url" text,
	"skills" jsonb,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "applications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"company" text NOT NULL,
	"position" text NOT NULL,
	"job_description" text,
	"url" text,
	"status" text DEFAULT 'Draft' NOT NULL,
	"selected_resume_id" text,
	"resume_version_id" text,
	"selected_work_ids" jsonb,
	"selected_cert_ids" jsonb,
	"deadline" timestamp,
	"notes" text,
	"outcome" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "application_changes" (
	"id" text PRIMARY KEY NOT NULL,
	"application_id" text NOT NULL,
	"user_id" text NOT NULL,
	"section" text NOT NULL,
	"change_type" text NOT NULL,
	"original_text" text,
	"suggested_text" text NOT NULL,
	"user_edits" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "portfolios" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"bio" text,
	"selected_work_ids" jsonb,
	"is_published" boolean DEFAULT false NOT NULL,
	"theme" text DEFAULT 'default' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "portfolios_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "portfolios_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "interview_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"application_id" text NOT NULL,
	"user_id" text NOT NULL,
	"question" text NOT NULL,
	"category" text,
	"student_answer" text,
	"key_points" jsonb,
	"outcome" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"operation_name" text NOT NULL,
	"prompt_version" text DEFAULT 'v1' NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"credits_cost" integer DEFAULT 1 NOT NULL,
	"idempotency_key" text,
	"status" text DEFAULT 'success' NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "ai_usage_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint

-- Safe Foreign Key Definitions
DO $$ BEGIN
	ALTER TABLE "work_items" ADD CONSTRAINT "work_items_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "certifications" ADD CONSTRAINT "certifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "applications" ADD CONSTRAINT "applications_selected_resume_id_resumes_id_fk" FOREIGN KEY ("selected_resume_id") REFERENCES "public"."resumes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "applications" ADD CONSTRAINT "applications_resume_version_id_resume_versions_id_fk" FOREIGN KEY ("resume_version_id") REFERENCES "public"."resume_versions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "application_changes" ADD CONSTRAINT "application_changes_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "application_changes" ADD CONSTRAINT "application_changes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "interview_notes" ADD CONSTRAINT "interview_notes_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "interview_notes" ADD CONSTRAINT "interview_notes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint

-- Query Performance Indexes
CREATE INDEX IF NOT EXISTS "resumes_user_id_idx" ON "resumes" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_items_user_id_idx" ON "work_items" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "applications_user_id_idx" ON "applications" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "application_changes_app_user_idx" ON "application_changes" ("application_id", "user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "resume_versions_resume_user_idx" ON "resume_versions" ("resume_id", "user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_order_id_idx" ON "transactions" ("order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_user_id_idx" ON "transactions" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ats_optimisations_user_id_idx" ON "ats_optimisations" ("user_id");
