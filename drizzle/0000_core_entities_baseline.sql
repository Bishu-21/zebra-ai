-- Fresh-install repair: these legacy core tables predate the migration journal.
-- This migration is timestamped before 0001, so already-migrated databases skip it.
CREATE TABLE IF NOT EXISTS "resumes" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL,
    "title" text NOT NULL,
    "content" text,
    "status" text DEFAULT 'Draft' NOT NULL,
    "is_public" boolean DEFAULT false NOT NULL,
    "share_token" text,
    "created_at" timestamp NOT NULL,
    "updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "analysis" (
    "id" text PRIMARY KEY NOT NULL,
    "resume_id" text NOT NULL,
    "score" integer NOT NULL,
    "feedback" jsonb NOT NULL,
    "created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "jobs" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL,
    "resume_id" text,
    "company" text NOT NULL,
    "position" text NOT NULL,
    "status" text DEFAULT 'Applied' NOT NULL,
    "salary" text,
    "url" text,
    "created_at" timestamp NOT NULL,
    "updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cover_letters" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL,
    "resume_id" text,
    "title" text NOT NULL,
    "job_description" text,
    "content" text NOT NULL,
    "created_at" timestamp NOT NULL,
    "updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ats_optimisations" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL,
    "resume_id" text NOT NULL,
    "job_description" text NOT NULL,
    "match_score" integer NOT NULL,
    "feedback" jsonb NOT NULL,
    "created_at" timestamp NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "resumes" ADD CONSTRAINT "resumes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "analysis" ADD CONSTRAINT "analysis_resume_id_resumes_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "jobs" ADD CONSTRAINT "jobs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "jobs" ADD CONSTRAINT "jobs_resume_id_resumes_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "cover_letters" ADD CONSTRAINT "cover_letters_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "cover_letters" ADD CONSTRAINT "cover_letters_resume_id_resumes_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "ats_optimisations" ADD CONSTRAINT "ats_optimisations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "ats_optimisations" ADD CONSTRAINT "ats_optimisations_resume_id_resumes_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
