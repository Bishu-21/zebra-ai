ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "career_stage" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "professional_experience_years" integer;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "career_profile_status" text DEFAULT 'pending' NOT NULL;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "career_profile_completed_at" timestamp;
