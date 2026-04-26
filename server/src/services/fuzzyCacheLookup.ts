import pool from "../db";

export interface FuzzyCacheOptions {
  namespace: string;
  niche: string;
  keywords: string[];
  maxAge?: number; // defaults to 14 days in ms
}

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Score keyword overlap between query keywords and a cached entry's keywords.
 * Returns the count of query keywords found (case-insensitive) in the entry keywords.
 */
export function scoreKeywordOverlap(
  queryKeywords: string[],
  entryKeywords: string[]
): number {
  const entrySet = new Set(entryKeywords.map((k) => k.toLowerCase()));
  return queryKeywords.reduce(
    (score, kw) => score + (entrySet.has(kw.toLowerCase()) ? 1 : 0),
    0
  );
}

/**
 * Query api_cache for the best fuzzy match by namespace, niche, and keyword overlap.
 * Returns the payload of the highest-scoring non-expired entry, or null.
 */
export async function fuzzyCacheLookup<T>(
  options: FuzzyCacheOptions
): Promise<T | null> {
  const { namespace, niche, keywords, maxAge = FOURTEEN_DAYS_MS } = options;
  const cutoff = Date.now() - maxAge;

  try {
    const result = await pool.query(
      `SELECT payload, metadata
       FROM api_cache
       WHERE namespace = $1
         AND expires_at > $2
         AND created_at > $3
         AND LOWER(metadata->>'niche') = LOWER($4)`,
      [namespace, Date.now(), cutoff, niche]
    );

    if (result.rows.length === 0) return null;

    let bestPayload: T | null = null;
    let bestScore = -1;

    for (const row of result.rows) {
      const entryKeywords: string[] = row.metadata?.keywords ?? [];
      const score = scoreKeywordOverlap(keywords, entryKeywords);
      if (score > bestScore) {
        bestScore = score;
        bestPayload = row.payload as T;
      }
    }

    return bestPayload;
  } catch (err) {
    console.error(`[fuzzyCacheLookup] error (${namespace}):`, err);
    return null;
  }
}
