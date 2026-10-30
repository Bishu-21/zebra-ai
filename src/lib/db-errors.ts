/**
 * Classify database/network failures that are safe to retry.
 * Walk nested `cause` objects so Neon/undici errors are visible.
 */
export function collectErrorText(error: unknown): string {
  if (!error) return "";

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
      if (record.code) values.push(record.code);
    } else {
      break;
    }
  }

  return values
    .map((value) => {
      if (typeof value === "string") return value;
      if (value instanceof Error) return `${value.name} ${value.message}`;
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    })
    .join(" ")
    .toLowerCase();
}

const TRANSIENT_DB_ERROR_MARKERS = [
  "connection terminated",
  "connection timeout",
  "connect timeout",
  "fetch failed",
  "und_err_connect_timeout",
  "websocket was closed",
  "econnreset",
  "etimedout",
  "enotfound",
  "neon_db_unavailable",
  "deadlock detected",
  "503",
  "504",
  "this operation was aborted",
  "aborterror",
  "und_err_aborted",
];

export function isTransientDbError(error: unknown): boolean {
  if (!error) return false;
  const text = collectErrorText(error);
  return TRANSIENT_DB_ERROR_MARKERS.some((term) => text.includes(term));
}
