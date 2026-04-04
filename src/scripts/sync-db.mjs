import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { join } from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function sync() {
  const sqlFile = join(process.cwd(), "drizzle", "0000_late_johnny_blaze.sql");
  const queries = readFileSync(sqlFile, "utf-8");
  
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not defined in .env.local");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  
  console.log("🚀 Syncing schema to Neon...");
  try {
    const queryList = queries.split(";").filter(q => q.trim().length > 0);
    
    for (const q of queryList) {
      await sql(q);
    }
    
    console.log("✅ Database schema synced successfully!");
  } catch (error) {
    console.error("❌ Sync failed:", error);
    process.exit(1);
  }
}

sync();
