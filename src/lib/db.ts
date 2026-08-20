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
    .replace(/((?:api[-_ ]?key|secret|token|password)\s*[=:]\s*)["']?[^"'\s&,;]+["']?/gi, "$1[REDACTED]")
    .replace(/(authorization\s*:\s*bearer\s+)[^\s,;]+/gi, "$1[REDACTED]")
    .replace(/(params?\s*:\s*)[^\r\n]+/gi, "$1[REDACTED]");
}

const globalForDb = global as unknown as {
  pool: Pool | undefined;
};

const pool = globalForDb.pool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 15000,
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
 * Recursively inspects nested cause objects.
 */
export function isTransientDbError(error: unknown): boolean {
  if (!error) return false;

  const values: unknown[] = [];
  const seen = new Set<unknown>();
  let current: unknown = error;

  while (current && !seen.has(current)) {
    seen.add(current);
    values.push(current);

    if (typeof current === "object" && current !== null) {
      const record = current as Record<string, unknown>;
      current = record.cause;
      if (record.body) values.push(record.body);
    } else {
      break;
    }
  }

  const text = values
    .map((value) => {
      if (typeof value === "string") return value;
      if (value instanceof Error) return value.message;
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    })
    .join(" ")
    .toLowerCase();

  return [
    "connection terminated",
    "connection timeout",
    "websocket was closed",
    "failed query",
    "econnreset",
    "etimedout",
    "neon_db_unavailable",
    "deadlock detected",
    "503",
    "504"
  ].some(term => text.includes(term));
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
