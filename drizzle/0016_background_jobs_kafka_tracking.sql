ALTER TABLE "background_jobs" ADD COLUMN "correlation_id" text;
--> statement-breakpoint
ALTER TABLE "background_jobs" ADD COLUMN "kafka_topic" text;
--> statement-breakpoint
ALTER TABLE "background_jobs" ADD COLUMN "artifact_url" text;
--> statement-breakpoint
CREATE INDEX "background_jobs_correlation_idx" ON "background_jobs" USING btree ("correlation_id");
