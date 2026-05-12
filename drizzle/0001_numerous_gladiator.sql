CREATE TABLE IF NOT EXISTS "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" text NOT NULL,
	"order_id" text NOT NULL,
	"payment_id" text,
	"plan_id" text,
	"credits" integer NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "transactions_order_id_unique" UNIQUE("order_id"),
	CONSTRAINT "transactions_payment_id_unique" UNIQUE("payment_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resume_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"resume_id" text NOT NULL,
	"title" text NOT NULL,
	"company" text,
	"target_role" text,
	"job_description" text,
	"content" text NOT NULL,
	"match_score" integer,
	"feedback" jsonb,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
-- Adding columns to user table if they don't exist
DO $$ BEGIN
    ALTER TABLE "user" ADD COLUMN "credits" integer DEFAULT 5 NOT NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user" ADD COLUMN "plan" text DEFAULT 'Free' NOT NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint

-- Adding genuinely missing columns to existing tables
DO $$ BEGIN
    ALTER TABLE "resumes" ADD COLUMN "parent_resume_id" text;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "resumes" ADD COLUMN "target_role" text;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "resumes" ADD COLUMN "target_company" text;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
    ALTER TABLE "jobs" ADD COLUMN "location" text;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "jobs" ADD COLUMN "job_type" text;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "jobs" ADD COLUMN "description" text;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint

-- Adding foreign keys for the new tables only
DO $$ BEGIN
    ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "resume_versions" ADD CONSTRAINT "resume_versions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "resume_versions" ADD CONSTRAINT "resume_versions_resume_id_resumes_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;