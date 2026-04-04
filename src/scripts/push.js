import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function run() {
  if (!process.env.DATABASE_URL) throw new Error("No DATABASE_URL");
  const sql = postgres(process.env.DATABASE_URL);
  
  try {
    const { version } = await sql`SELECT version()`[0];
    console.log("Connected! Postgres Version:", version);

    const schemaPath = join(process.cwd(), 'drizzle', '0000_late_johnny_blaze.sql');
    const sqlScript = readFileSync(schemaPath, 'utf8');
    
    // Execute the SQL
    const statements = sqlScript
      .split('--> statement-breakpoint')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt !== '');

    console.log(`Found ${statements.length} statements. Executing...`);
    
    for (const stmt of statements) {
       await sql.unsafe(stmt);
    }
    console.log("Migration pushed directly via standard driver.");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await sql.end();
  }
}
run();
