CREATE TABLE IF NOT EXISTS "tailoring_runs" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL,
    "application_id" text,
    "resume_id" text NOT NULL,
    "idempotency_key" text NOT NULL,
    "status" text DEFAULT 'pending' NOT NULL,
    "result" jsonb,
    "error_message" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "tailoring_runs_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "tailoring_runs" ADD CONSTRAINT "tailoring_runs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "tailoring_runs" ADD CONSTRAINT "tailoring_runs_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "tailoring_runs" ADD CONSTRAINT "tailoring_runs_resume_id_resumes_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tailoring_runs_user_id_idx" ON "tailoring_runs" ("user_id");
