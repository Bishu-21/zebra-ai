-- Evidence compiler and long-running platform entities.
-- Forward-only and idempotent so staging can be checked before production.

CREATE TABLE IF NOT EXISTS "evidence_nodes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"work_item_id" text,
	"company_or_project" text NOT NULL,
	"role_or_context" text,
	"skill" text NOT NULL,
	"action" text NOT NULL,
	"measurable_outcome" text,
	"start_date" timestamp,
	"end_date" timestamp,
	"duration_months" integer,
	"proof_url" text,
	"confidence" text DEFAULT 'asserted' NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "job_requirement_matrices" (
	"id" text PRIMARY KEY NOT NULL,
	"application_id" text NOT NULL,
	"user_id" text NOT NULL,
	"requirement_key" text NOT NULL,
	"canonical_requirement" text NOT NULL,
	"requirement_category" text DEFAULT 'tech_skill' NOT NULL,
	"evidence_node_id" text,
	"match_status" text DEFAULT 'missing_evidence' NOT NULL,
	"confidence_score" integer DEFAULT 0 NOT NULL,
	"suggested_phrasing" text,
	"candidate_prompt" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "preflight_checks" (
	"id" text PRIMARY KEY NOT NULL,
	"application_id" text NOT NULL,
	"user_id" text NOT NULL,
	"ats_safety_score" integer DEFAULT 100 NOT NULL,
	"evidence_coverage_score" integer DEFAULT 0 NOT NULL,
	"parsing_risk_flags" jsonb,
	"hard_eligibility_flags" jsonb,
	"terminology_mismatch_count" integer DEFAULT 0 NOT NULL,
	"is_clean" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "background_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"application_id" text,
	"operation_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"progress_percent" integer DEFAULT 0 NOT NULL,
	"payload" jsonb,
	"result" jsonb,
	"error_message" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "document_artifacts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"application_id" text,
	"resume_version_id" text,
	"document_type" text NOT NULL,
	"content_hash" text NOT NULL,
	"content" text NOT NULL,
	"storage_path" text,
	"evidence_lineage" jsonb,
	"is_canonical" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$ BEGIN
	ALTER TABLE "evidence_nodes" ADD CONSTRAINT "evidence_nodes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "evidence_nodes" ADD CONSTRAINT "evidence_nodes_work_item_id_work_items_id_fk" FOREIGN KEY ("work_item_id") REFERENCES "public"."work_items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "job_requirement_matrices" ADD CONSTRAINT "job_requirement_matrices_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "job_requirement_matrices" ADD CONSTRAINT "job_requirement_matrices_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "job_requirement_matrices" ADD CONSTRAINT "job_requirement_matrices_evidence_node_id_evidence_nodes_id_fk" FOREIGN KEY ("evidence_node_id") REFERENCES "public"."evidence_nodes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "preflight_checks" ADD CONSTRAINT "preflight_checks_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "preflight_checks" ADD CONSTRAINT "preflight_checks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "background_jobs" ADD CONSTRAINT "background_jobs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "background_jobs" ADD CONSTRAINT "background_jobs_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "document_artifacts" ADD CONSTRAINT "document_artifacts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "document_artifacts" ADD CONSTRAINT "document_artifacts_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "document_artifacts" ADD CONSTRAINT "document_artifacts_resume_version_id_resume_versions_id_fk" FOREIGN KEY ("resume_version_id") REFERENCES "public"."resume_versions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "evidence_nodes_user_id_idx" ON "evidence_nodes" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "evidence_nodes_skill_idx" ON "evidence_nodes" ("skill");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_req_matrix_app_user_idx" ON "job_requirement_matrices" ("application_id", "user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "background_jobs_user_id_idx" ON "background_jobs" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "document_artifacts_user_app_idx" ON "document_artifacts" ("user_id", "application_id");
