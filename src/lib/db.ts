import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import * as schema from "./schema";
import ws from "ws";

// Configure WebSocket constructor for Neon serverless Node.js environment
if (typeof window === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

/** Sanitize sensitive credentials, connection URLs, and tokens from log messages. */
export function sanitizeSecretText(text: string): string {
  if (!text) return "";
  return text
    .replace(/postgres(?:ql)?:\/\/[^@\s]+@/gi, "postgres://[REDACTED]@")
    .replace(/(?:key|secret|token|password)=["']?[^"'\s&]+["']?/gi, "$1=[REDACTED]");
}

const globalForDb = global as unknown as {
  pool: Pool | undefined;
};

const pool = globalForDb.pool ?? new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  allowExitOnIdle: true,
});

if (!globalForDb.pool) {
  pool.on("error", (err: Error) => {
    const sanitizedMsg = sanitizeSecretText(err.message || String(err));
    if (sanitizedMsg.includes("terminated unexpectedly") || sanitizedMsg.includes("WebSocket was closed")) {
      console.warn("[Neon] Idle connection closed cleanly by serverless proxy.");
    } else {
      console.error("[Neon Pool Error]:", sanitizedMsg);
    }
  });
}

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

export const db = drizzle(pool, { schema });

/**
 * Check if a database error is transient (e.g. socket reset, connection timeout, temporary proxy failure).
 */
export function isTransientDbError(error: unknown): boolean {
  if (!error) return false;
  const msg = typeof error === "object" && error !== null && "message" in error 
    ? String((error as { message: unknown }).message) 
    : String(error);
  
  const lowerMsg = msg.toLowerCase();
  return [
    "connection terminated",
    "connection timeout",
    "websocket was closed",
    "econnreset",
    "etimedout",
    "neon_db_unavailable",
    "deadlock detected",
    "503",
    "504"
  ].some(term => lowerMsg.includes(term));
}

/**
 * Execute a database query with bounded retries and exponential backoff for transient errors.
 */
export async function executeWithDbRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 2,
  initialDelayMs = 150
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (err: unknown) {
      attempt++;
      if (attempt > maxRetries || !isTransientDbError(err)) {
        throw err;
      }
      const delay = initialDelayMs * Math.pow(2, attempt - 1);
      const sanitized = sanitizeSecretText(err instanceof Error ? err.message : String(err));
      console.warn(`[Neon Retry] Transient DB error on attempt ${attempt}/${maxRetries}. Retrying in ${delay}ms. Error: ${sanitized}`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
}
