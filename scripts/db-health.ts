import path from "path";
import dotenv from "dotenv";
import postgres from "postgres";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function runHealthCheck() {
    console.log("=== Zebra AI Database Health Check ===");
    
    const rawDbUrl = process.env.DATABASE_URL;
    if (!rawDbUrl) {
        console.error("❌ ERROR: DATABASE_URL environment variable is not defined!");
        process.exit(1);
    }

    // Extract host without leaking password or credentials
    let hostName = "Unknown";
    try {
        const parsedUrl = new URL(rawDbUrl);
        hostName = parsedUrl.hostname;
    } catch {
        hostName = "Invalid URL structure";
    }

    console.log(`Target Host: ${hostName}`);
    console.log(`Connection URL: postgres://[REDACTED]@${hostName}`);
    console.log("--------------------------------------");

    const startTime = Date.now();
    const sql = postgres(rawDbUrl, {
        max: 1,
        connect_timeout: 10,
        idle_timeout: 5,
    });
    try {
        // 1. Basic Ping test (SELECT 1)
        console.log("1. Testing raw query connectivity (SELECT 1)...");
        await sql`SELECT 1 AS val`;
        const pingTime = Date.now() - startTime;
        console.log(`   ✅ Ping successful! Latency: ${pingTime}ms`);

        // 2. Query execution test
        console.log("2. Testing query execution latency...");
        const queryStart = Date.now();
        await sql`SELECT 1 + 1 AS val`;
        const queryTime = Date.now() - queryStart;
        console.log(`   ✅ Query execution test successful! (Latency: ${queryTime}ms)`);

        console.log("3. Verifying required production schema...");
        const requiredTables = [
            "user",
            "session",
            "account",
            "verification",
            "resumes",
            "analysis",
            "jobs",
            "cover_letters",
            "ats_optimisations",
            "transactions",
            "rate_limit_buckets",
            "project_analyses",
            "resume_versions",
            "work_items",
            "certifications",
            "applications",
            "application_changes",
            "tailoring_runs",
            "portfolios",
            "interview_notes",
            "ai_usage",
            "evidence_nodes",
            "job_requirement_matrices",
            "preflight_checks",
            "background_jobs",
            "document_artifacts",
        ];
        const tableRows = await sql<{ table_name: string }[]>`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = ANY(${requiredTables})
        `;
        const existingTables = new Set(tableRows.map((row) => row.table_name));
        const missingTables = requiredTables.filter((table) => !existingTables.has(table));
        if (missingTables.length > 0) {
            throw new Error(`Required database migrations are missing: ${missingTables.join(", ")}`);
        }
        const requiredUserColumns = [
            "career_stage",
            "professional_experience_years",
            "career_profile_status",
            "career_profile_completed_at",
        ];
        const userColumnRows = await sql<{ column_name: string }[]>`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'user'
              AND column_name IN (
                'career_stage',
                'professional_experience_years',
                'career_profile_status',
                'career_profile_completed_at'
              )
        `;
        const existingUserColumns = new Set(userColumnRows.map((row) => row.column_name));
        const missingUserColumns = requiredUserColumns.filter((column) => !existingUserColumns.has(column));
        if (missingUserColumns.length > 0) {
            throw new Error(`Required user profile columns are missing: ${missingUserColumns.join(", ")}`);
        }

        const requiredColumns: Record<string, string[]> = {
            resumes: ["revision", "is_public", "share_token"],
            certifications: ["is_public"],
            applications: ["selected_resume_id", "resume_version_id", "selected_work_ids", "selected_cert_ids"],
            evidence_nodes: ["confidence", "source", "updated_at"],
            ai_usage: ["provider", "request_id", "latency_ms", "error_code"],
        };
        const columnRows = await sql<{ table_name: string; column_name: string }[]>`
            SELECT table_name, column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = ANY(${Object.keys(requiredColumns)})
        `;
        const columnsByTable = new Map<string, Set<string>>();
        for (const row of columnRows) {
            const columns = columnsByTable.get(row.table_name) ?? new Set<string>();
            columns.add(row.column_name);
            columnsByTable.set(row.table_name, columns);
        }
        const missingColumns = Object.entries(requiredColumns).flatMap(([table, columns]) =>
            columns.filter(column => !columnsByTable.get(table)?.has(column)).map(column => `${table}.${column}`),
        );
        if (missingColumns.length > 0) {
            throw new Error(`Required schema columns are missing: ${missingColumns.join(", ")}`);
        }
        console.log("   ✅ Required schema is present");

        console.log("--------------------------------------");
        console.log("STATUS: OK (Database health check passed cleanly)");
    } catch (error: unknown) {
        const duration = Date.now() - startTime;
        const sanitizedMsg = (error instanceof Error ? error.message : String(error))
            .replace(/postgres(?:ql)?:\/\/[^@\s]+@/gi, "postgres://[REDACTED]@");
        console.error(`   ❌ Database check failed after ${duration}ms: ${sanitizedMsg}`);
        console.log("--------------------------------------");
        console.log("STATUS: FAILED (Database connectivity or schema error)");
        process.exitCode = 1;
    } finally {
        await sql.end({ timeout: 2 });
    }
}

runHealthCheck();
