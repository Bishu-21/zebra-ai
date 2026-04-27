import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import * as schema from "./schema";
import * as ws from 'ws';

// Required for Neon serverless in some environments
if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws.default || ws;
}

const globalForDb = global as unknown as {
  pool: Pool | undefined;
};

const pool = globalForDb.pool ?? new Pool({ 
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err: Error) => {
  console.error('Neon Pool Error:', err);
});

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

export const db = drizzle(pool, { schema });
