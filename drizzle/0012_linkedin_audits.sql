CREATE TABLE IF NOT EXISTS "linkedin_audits" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "score" integer,
  "feedback" jsonb NOT NULL,
  "linkedin_url" text,
  "created_at" timestamp NOT NULL,
  CONSTRAINT "linkedin_audits_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "linkedin_audits_user_created_idx" ON "linkedin_audits" USING btree ("user_id", "created_at");
