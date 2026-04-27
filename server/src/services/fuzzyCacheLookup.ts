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
 * Returns a ratio (0–1) of query keywords found in the entry keywords.
 */
export function scoreKeywordOverlap(
  queryKeywords: string[],
  entryKeywords: string[]
): number {
  if (queryKeywords.length === 0 || entryKeywords.length === 0) return 0;
  const entrySet = new Set(entryKeywords.map((k) => k.toLowerCase()));
  const matches = queryKeywords.reduce(
    (count, kw) => count + (entrySet.has(kw.toLowerCase()) ? 1 : 0),
    0
  );
  return matches / queryKeywords.length; // ratio, not raw count
}

// Minimum overlap ratio required to consider a cache entry a valid match
const MIN_OVERLAP_RATIO = 0.5;
// Minimum number of matching keywords required
const MIN_MATCHING_KEYWORDS = 2;

/**
 * Query api_cache for the best fuzzy match by namespace, niche, and keyword overlap.
 * Returns the payload of the highest-scoring non-expired entry, or null.
 * Requires at least 50% keyword overlap AND minimum 2 matching keywords.
 */
export async function fuzzyCacheLookup<T>(
  options: FuzzyCacheOptions
): Promise<T | null> {
  const { namespace, niche, keywords, maxAge = FOURTEEN_DAYS_MS } = options;
  const cutoff = Date.now() - maxAge;

  if (keywords.length < MIN_MATCHING_KEYWORDS) return null; // not enough keywords to match reliably

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

      // Count raw matches for minimum threshold
      const entrySet = new Set(entryKeywords.map((k) => k.toLowerCase()));
      const rawMatches = keywords.filter((kw) => entrySet.has(kw.toLowerCase())).length;

      // Must meet BOTH thresholds
      if (score >= MIN_OVERLAP_RATIO && rawMatches >= MIN_MATCHING_KEYWORDS && score > bestScore) {
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
