import { db, sanitizeSecretText } from "../src/lib/db";
import { sql } from "drizzle-orm";
import path from "path";
import dotenv from "dotenv";

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
    console.log(`Connection URL: ${sanitizeSecretText(rawDbUrl)}`);
    console.log("--------------------------------------");

    const startTime = Date.now();
    try {
        // 1. Basic Ping test (SELECT 1)
        console.log("1. Testing raw query connectivity (SELECT 1)...");
        await db.select({ val: sql`1` });
        const pingTime = Date.now() - startTime;
        console.log(`   ✅ Ping successful! Latency: ${pingTime}ms`);

        // 2. Query execution test
        console.log("2. Testing query execution latency...");
        const queryStart = Date.now();
        await db.select({ val: sql`1 + 1` });
        const queryTime = Date.now() - queryStart;
        console.log(`   ✅ Query execution test successful! (Latency: ${queryTime}ms)`);

        console.log("--------------------------------------");
        console.log("STATUS: OK (Database health check passed cleanly)");
        process.exit(0);
    } catch (error: unknown) {
        const duration = Date.now() - startTime;
        const sanitizedMsg = sanitizeSecretText(error instanceof Error ? error.message : String(error));
        console.error(`   ❌ Database check failed after ${duration}ms: ${sanitizedMsg}`);
        console.log("--------------------------------------");
        console.log("STATUS: FAILED (Database connectivity or schema error)");
        process.exit(1);
    }
}

runHealthCheck();
