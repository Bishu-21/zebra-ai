ALTER TABLE "certifications"
ADD COLUMN IF NOT EXISTS "is_public" boolean DEFAULT false NOT NULL;
