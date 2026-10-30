import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import * as schema from "./schema";
import { isTransientDbError } from "./db-errors";
import ws from "ws";

const NEON_FETCH_TIMEOUT_MS = 10_000;
const globalForNeonFetch = globalThis as unknown as { neonFetchTimeoutInstalled?: boolean };

// Configure WebSocket constructor for Neon serverless Node.js environment
if (typeof window === "undefined") {
  neonConfig.webSocketConstructor = ws;
  neonConfig.poolQueryViaFetch = true;
  if (!globalForNeonFetch.neonFetchTimeoutInstalled) {
    const previousFetch = neonConfig.fetchFunction;
    neonConfig.fetchFunction = (url: string | URL, options?: RequestInit) => {
      const timeout = AbortSignal.timeout(NEON_FETCH_TIMEOUT_MS);
      const signal = options?.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
      const init = { ...options, signal };
      return previousFetch ? previousFetch(url, init) : fetch(url, init);
    };
    globalForNeonFetch.neonFetchTimeoutInstalled = true;
  }
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

const configuredPoolMax = Number.parseInt(process.env.DATABASE_POOL_MAX || "5", 10);
const poolMax = Number.isFinite(configuredPoolMax)
  ? Math.min(10, Math.max(1, configuredPoolMax))
  : 5;

const pool = globalForDb.pool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: poolMax,
  idleTimeoutMillis: 15000,
  connectionTimeoutMillis: 5_000,
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

// Next.js can evaluate this module from multiple route bundles in the same
// process. Reuse one pool in production as well as development so each bundle
// does not create another independently configured group of Neon connections.
globalForDb.pool = pool;

export const db = drizzle(pool, { schema });

export { isTransientDbError };

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
