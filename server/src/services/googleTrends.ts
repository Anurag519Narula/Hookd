/**
 * Google Trends via SerpAPI
 *
 * Endpoints used:
 * 1. Interest Over Time — 12-month interest curve for a keyword (geo: IN)
 * 2. Related Queries — top + rising queries people search alongside the keyword
 * 3. Trending Now — what's trending in India right now (cached 24h, not per-keyword)
 *
 * Cache: 7 days per keyword, 24h for trending now (conserves 250/month quota)
 */

import fetch from "node-fetch";
import { getCached, setCached } from "./dbCache";

const SERPAPI_KEY = process.env.SERPAPI_KEY ?? "";
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;       // 7 days for keyword-specific data
const TRENDING_CACHE_TTL = 24 * 60 * 60 * 1000;   // 24 hours for trending now

// ── Types ──────────────────────────────────────────────────────────────────────

export interface TrendTimelinePoint {
  date: string;       // e.g. "Apr 2025"
  value: number;      // 0–100
}

export interface RelatedQuery {
  query: string;
  value?: number;      // search volume or % increase
  type: "top" | "rising";
}

export interface GoogleTrendsData {
  keyword: string;
  interest: number;                    // current (most recent) interest 0–100
  avgInterest: number;                 // average over 12 months
  peakInterest: number;               // highest point in 12 months
  timeline: TrendTimelinePoint[];     // 12-month interest curve
  relatedQueries: RelatedQuery[];     // top + rising queries
  risingQueries: string[];            // just the rising query strings (convenience)
  topQueries: string[];               // just the top query strings (convenience)
}

export interface TrendingSearch {
  query: string;
  searchVolume: number;
  increasePercentage: number;
  categories: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

async function serpApiFetch(params: Record<string, string>): Promise<any> {
  if (!SERPAPI_KEY) {
    console.warn("[SerpAPI] No SERPAPI_KEY set — skipping");
    return null;
  }

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("api_key", SERPAPI_KEY);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  console.log(`[SerpAPI] Calling ${params.engine} for q="${params.q ?? ""}" geo="${params.geo ?? ""}"`);
  const res = await fetch(url.toString(), { timeout: 15000 } as any);
  if (!res.ok) {
    console.error(`[SerpAPI] ${res.status} for ${params.engine}:`, await res.text().catch(() => ""));
    return null;
  }
  const json = await res.json();
  console.log(`[SerpAPI] ${params.engine} OK — keys: ${Object.keys(json).join(", ")}`);
  return json;
}

// ── Interest Over Time ─────────────────────────────────────────────────────────

async function fetchInterestOverTime(keyword: string): Promise<{
  timeline: TrendTimelinePoint[];
  interest: number;
  avgInterest: number;
  peakInterest: number;
} | null> {
  const data = await serpApiFetch({
    engine: "google_trends",
    q: keyword,
    geo: "IN",
    data_type: "TIMESERIES",
    date: "today 12-m",
  });

  if (!data?.interest_over_time?.timeline_data) return null;

  const timeline: TrendTimelinePoint[] = data.interest_over_time.timeline_data
    .map((point: any) => ({
      date: point.date ?? "",
      value: point.values?.[0]?.extracted_value ?? 0,
    }))
    .filter((p: TrendTimelinePoint) => p.date);

  if (timeline.length === 0) return null;

  const values = timeline.map((p) => p.value);
  const interest = values[values.length - 1] ?? 0;
  const avgInterest = Math.round(values.reduce((s, v) => s + v, 0) / values.length);
  const peakInterest = Math.max(...values);

  return { timeline, interest, avgInterest, peakInterest };
}

// ── Related Queries ────────────────────────────────────────────────────────────

async function fetchRelatedQueries(keyword: string): Promise<RelatedQuery[]> {
  const data = await serpApiFetch({
    engine: "google_trends",
    q: keyword,
    geo: "IN",
    data_type: "RELATED_QUERIES",
  });

  const queries: RelatedQuery[] = [];

  if (data?.related_queries?.rising) {
    for (const item of data.related_queries.rising.slice(0, 8)) {
      queries.push({
        query: item.query ?? "",
        value: item.extracted_value ?? item.value ?? 0,
        type: "rising",
      });
    }
  }

  if (data?.related_queries?.top) {
    for (const item of data.related_queries.top.slice(0, 8)) {
      queries.push({
        query: item.query ?? "",
        value: item.extracted_value ?? item.value ?? 0,
        type: "top",
      });
    }
  }

  return queries.filter((q) => q.query.length > 0);
}

// ── Main Entry Point ───────────────────────────────────────────────────────────

export async function fetchGoogleTrendsSerpAPI(keyword: string): Promise<GoogleTrendsData | null> {
  const cacheKey = keyword.toLowerCase().trim();
  const cached = await getCached<GoogleTrendsData>("serpapi_google_trends", { keyword: cacheKey });
  if (cached) {
    console.log(`[SerpAPI] Cache hit for "${cacheKey}"`);
    return cached;
  }

  if (!SERPAPI_KEY) {
    console.warn("[SerpAPI] No SERPAPI_KEY — returning null");
    return null;
  }

  console.log(`[SerpAPI] Cache miss for "${cacheKey}" — fetching fresh data`);

  try {
    // Run both calls in parallel (2 SerpAPI credits per validation)
    const [interestResult, relatedResult] = await Promise.all([
      fetchInterestOverTime(keyword),
      fetchRelatedQueries(keyword),
    ]);

    if (!interestResult && relatedResult.length === 0) return null;

    const result: GoogleTrendsData = {
      keyword: keyword.trim(),
      interest: interestResult?.interest ?? 0,
      avgInterest: interestResult?.avgInterest ?? 0,
      peakInterest: interestResult?.peakInterest ?? 0,
      timeline: interestResult?.timeline ?? [],
      relatedQueries: relatedResult,
      risingQueries: relatedResult.filter((q) => q.type === "rising").map((q) => q.query),
      topQueries: relatedResult.filter((q) => q.type === "top").map((q) => q.query),
    };

    await setCached("serpapi_google_trends", { keyword: cacheKey }, result, CACHE_TTL);
    console.log(`[SerpAPI] Result for "${cacheKey}": interest=${result.interest}, timeline=${result.timeline.length} points, rising=${result.risingQueries.length}, top=${result.topQueries.length}`);
    return result;
  } catch (err) {
    console.error("[SerpAPI Google Trends] error:", err);
    return null;
  }
}


// ── Trending Now (India) ───────────────────────────────────────────────────────
// Cached 24h — costs 1 SerpAPI credit per day, not per validation

export async function fetchTrendingNowIndia(): Promise<TrendingSearch[]> {
  const cached = await getCached<TrendingSearch[]>("serpapi_trending_now_india", { geo: "IN" });
  if (cached) return cached;

  if (!SERPAPI_KEY) return [];

  try {
    const data = await serpApiFetch({
      engine: "google_trends_trending_now",
      geo: "IN",
      hl: "en",
    });

    if (!data?.trending_searches) return [];

    const results: TrendingSearch[] = data.trending_searches
      .slice(0, 20)
      .map((item: any) => ({
        query: item.query ?? "",
        searchVolume: item.search_volume ?? 0,
        increasePercentage: item.increase_percentage ?? 0,
        categories: (item.categories ?? []).map((c: any) => c.name ?? "").filter(Boolean),
      }))
      .filter((t: TrendingSearch) => t.query.length > 0);

    await setCached("serpapi_trending_now_india", { geo: "IN" }, results, TRENDING_CACHE_TTL);
    return results;
  } catch (err) {
    console.error("[SerpAPI Trending Now] error:", err);
    return [];
  }
}
