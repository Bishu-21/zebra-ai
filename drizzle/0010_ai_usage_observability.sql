ALTER TABLE "ai_usage" ADD COLUMN IF NOT EXISTS "provider" text;
--> statement-breakpoint
ALTER TABLE "ai_usage" ADD COLUMN IF NOT EXISTS "request_id" text;
--> statement-breakpoint
ALTER TABLE "ai_usage" ADD COLUMN IF NOT EXISTS "latency_ms" integer;
--> statement-breakpoint
ALTER TABLE "ai_usage" ADD COLUMN IF NOT EXISTS "error_code" text;
