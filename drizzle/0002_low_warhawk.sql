DO $$ BEGIN ALTER TABLE "jobs" ADD COLUMN "resume_version_id" text; EXCEPTION WHEN duplicate_column THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "jobs" ADD COLUMN "location" text; EXCEPTION WHEN duplicate_column THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "jobs" ADD COLUMN "job_type" text; EXCEPTION WHEN duplicate_column THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "jobs" ADD COLUMN "description" text; EXCEPTION WHEN duplicate_column THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "resumes" ADD COLUMN "parent_resume_id" text; EXCEPTION WHEN duplicate_column THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "resumes" ADD COLUMN "target_role" text; EXCEPTION WHEN duplicate_column THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "resumes" ADD COLUMN "target_company" text; EXCEPTION WHEN duplicate_column THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "jobs" ADD CONSTRAINT "jobs_resume_version_id_resume_versions_id_fk" FOREIGN KEY ("resume_version_id") REFERENCES "public"."resume_versions"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;