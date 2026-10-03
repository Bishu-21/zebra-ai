CREATE TABLE IF NOT EXISTS "github_installations" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "installation_id" text NOT NULL,
  "account_login" text NOT NULL,
  "account_id" text NOT NULL,
  "account_type" text NOT NULL,
  "repository_selection" text NOT NULL,
  "permissions" jsonb NOT NULL,
  "suspended_at" timestamp,
  "created_at" timestamp NOT NULL,
  "updated_at" timestamp NOT NULL,
  CONSTRAINT "github_installations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "github_installations_account_type_check" CHECK ("account_type" IN ('User', 'Organization')),
  CONSTRAINT "github_installations_repository_selection_check" CHECK ("repository_selection" IN ('selected', 'all'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "github_installations_installation_id_unique" ON "github_installations" USING btree ("installation_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "github_installations_user_id_unique" ON "github_installations" USING btree ("user_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "github_installation_repositories" (
  "id" text PRIMARY KEY NOT NULL,
  "github_installation_id" text NOT NULL,
  "user_id" text NOT NULL,
  "repo_id" text NOT NULL,
  "full_name" text NOT NULL,
  "private" boolean NOT NULL,
  "default_branch" text,
  "html_url" text,
  "language" text,
  "topics" jsonb NOT NULL,
  "description" text,
  "pushed_at" timestamp,
  "authorship" text NOT NULL,
  "readme_sha256" text,
  "readme_excerpt" text,
  "removed_at" timestamp,
  CONSTRAINT "github_installation_repositories_installation_fk" FOREIGN KEY ("github_installation_id") REFERENCES "public"."github_installations"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "github_installation_repositories_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "github_installation_repositories_authorship_check" CHECK ("authorship" IN ('owner', 'commit_author', 'not_confirmed'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "github_installation_repositories_repo_unique" ON "github_installation_repositories" USING btree ("github_installation_id", "repo_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_installation_repositories_user_idx" ON "github_installation_repositories" USING btree ("user_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "github_sync_runs" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "github_installation_id" text NOT NULL,
  "status" text NOT NULL,
  "error_code" text,
  "repo_count" integer,
  "started_at" timestamp NOT NULL,
  "finished_at" timestamp,
  CONSTRAINT "github_sync_runs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "github_sync_runs_installation_fk" FOREIGN KEY ("github_installation_id") REFERENCES "public"."github_installations"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "github_sync_runs_status_check" CHECK ("status" IN ('running', 'succeeded', 'failed'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_sync_runs_user_started_idx" ON "github_sync_runs" USING btree ("user_id", "started_at");
--> statement-breakpoint
ALTER TABLE "github_installations" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "github_installations" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "github_installation_repositories" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "github_installation_repositories" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "github_sync_runs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "github_sync_runs" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "github_installations_owner" ON "github_installations"
  FOR ALL
  USING (
    "user_id" = current_setting('app.user_id', true)
    OR "installation_id" = current_setting('app.github_installation_id', true)
  )
  WITH CHECK ("user_id" = current_setting('app.user_id', true));
--> statement-breakpoint
CREATE POLICY "github_installation_repositories_owner" ON "github_installation_repositories"
  FOR ALL
  USING ("user_id" = current_setting('app.user_id', true))
  WITH CHECK ("user_id" = current_setting('app.user_id', true));
--> statement-breakpoint
CREATE POLICY "github_sync_runs_owner" ON "github_sync_runs"
  FOR ALL
  USING ("user_id" = current_setting('app.user_id', true))
  WITH CHECK ("user_id" = current_setting('app.user_id', true));
