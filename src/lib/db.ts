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
  max: 10,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
  allowExitOnIdle: true,
});

if (!globalForDb.pool) {
  pool.on('error', (err: Error) => {
    // Gracefully swallow idle socket terminations in serverless environment
    if (err.message?.includes('terminated unexpectedly')) {
      console.warn('Neon idle pool socket closed cleanly.');
    } else {
      console.error('Neon Pool Error:', err);
    }
  });
}

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

export const db = drizzle(pool, { schema });
