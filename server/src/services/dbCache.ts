import crypto from "crypto";
import pool from "../db";

const TTL_7_DAYS = 7 * 24 * 60 * 60 * 1000; // ms

/**
 * Build a stable cache key from arbitrary params.
 * Uses SHA-256 so the key is always a fixed-length string regardless of input size.
 */
export function buildCacheKey(params: Record<string, unknown>): string {
  const stable = JSON.stringify(params, Object.keys(params).sort());
  return crypto.createHash("sha256").update(stable).digest("hex");
}

/**
 * Read a cached value from the DB.
 * Returns null if not found or expired.
 */
export async function getCached<T>(
  namespace: string,
  params: Record<string, unknown>
): Promise<T | null> {
  const key = buildCacheKey({ namespace, ...params });
  try {
    const result = await pool.query(
      "SELECT payload FROM api_cache WHERE cache_key = $1 AND expires_at > $2",
      [key, Date.now()]
    );
    if (result.rows.length === 0) return null;
    return result.rows[0].payload as T;
  } catch (err) {
    // Cache read failure is non-fatal — just proceed without cache
    console.error(`[dbCache] read error (${namespace}):`, err);
    return null;
  }
}

/**
 * Write a value to the DB cache.
 * Uses INSERT ... ON CONFLICT DO UPDATE so it's safe to call multiple times.
 */
export async function setCached(
  namespace: string,
  params: Record<string, unknown>,
  payload: unknown,
  ttlMs = TTL_7_DAYS
): Promise<void> {
  const key = buildCacheKey({ namespace, ...params });
  const now = Date.now();
  const expiresAt = now + ttlMs;
  try {
    await pool.query(
      `INSERT INTO api_cache (cache_key, namespace, payload, created_at, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (cache_key) DO UPDATE
         SET payload = EXCLUDED.payload,
             created_at = EXCLUDED.created_at,
             expires_at = EXCLUDED.expires_at`,
      [key, namespace, JSON.stringify(payload), now, expiresAt]
    );
  } catch (err) {
    // Cache write failure is non-fatal
    console.error(`[dbCache] write error (${namespace}):`, err);
  }
}

/**
 * Delete expired rows. Call this periodically (e.g. on server startup or via a cron).
 * Returns the number of rows deleted.
 */
export async function purgeExpired(): Promise<number> {
  try {
    const result = await pool.query(
      "DELETE FROM api_cache WHERE expires_at < $1",
      [Date.now()]
    );
    return result.rowCount ?? 0;
  } catch (err) {
    console.error("[dbCache] purge error:", err);
    return 0;
  }
}
