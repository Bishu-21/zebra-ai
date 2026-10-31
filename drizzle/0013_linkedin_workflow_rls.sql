ALTER TABLE "linkedin_audits" ADD COLUMN IF NOT EXISTS "source_text" text;
--> statement-breakpoint
ALTER TABLE "linkedin_audits" ADD COLUMN IF NOT EXISTS "target_role" text;
--> statement-breakpoint
ALTER TABLE "linkedin_audits" ADD COLUMN IF NOT EXISTS "drafts" jsonb;
--> statement-breakpoint
ALTER TABLE "linkedin_audits" ADD COLUMN IF NOT EXISTS "updated_at" timestamp;
--> statement-breakpoint
ALTER TABLE "linkedin_audits" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "linkedin_audits" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "linkedin_audits_owner" ON "linkedin_audits"
  FOR ALL
  USING ("user_id" = current_setting('app.user_id', true))
  WITH CHECK ("user_id" = current_setting('app.user_id', true));
