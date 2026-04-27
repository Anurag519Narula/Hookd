import { Router, Response } from "express";
import pool from "../db";
import { fetchYouTubeTrends, fetchGoogleTrends, fetchTopInstagramHashtags } from "../services/insights";
import type { TrendData } from "../services/insights";
import { fetchGoogleTrendsSerpAPI } from "../services/googleTrends";
import { synthesizeInsights } from "../prompts/insightSynthesis";
import { getCached, setCached } from "../services/dbCache";
import { checkLimit, incrementUsage } from "../services/usageLimits";
import { AuthenticatedRequest } from "../middleware/auth";
import { fuzzyCacheLookup } from "../services/fuzzyCacheLookup";
import { generateAIEstimate } from "../services/aiEstimate";
import { computeSignals } from "../services/computedSignals";
import type { YouTubeResult } from "../services/insights";
import hashtagBank from "../data/hashtagBank.json";

const router = Router();

const IDEA_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

// GET /api/insights?idea=<text>&niche=<niche>&ideaId=<id>
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const { idea, niche = "", ideaId } = req.query as {
    idea?: string;
    niche?: string;
    ideaId?: string;
  };

  if (!idea || !idea.trim()) {
    res.status(400).json({ error: "idea is required" });
    return;
  }

  try {
    // ── Keyword normalization for intent-based cache matching ─────────────────
    // "rich habits of Indians" and "money habits of wealthy Indians" share intent
    const CACHE_STOP_WORDS = new Set([
      "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
      "have", "has", "had", "do", "does", "did", "will", "would", "could",
      "should", "may", "might", "can", "need", "want", "going", "get", "got",
      "make", "made", "like", "just", "really", "very", "so", "too", "also",
      "but", "and", "or", "if", "then", "when", "how", "what", "why", "who",
      "where", "which", "that", "this", "these", "those", "it", "its", "my",
      "your", "i", "me", "we", "you", "he", "she", "they", "about", "for",
      "with", "from", "into", "onto", "upon", "over", "under", "through",
      "between", "during", "before", "after", "of", "in", "on", "at", "by",
      "to", "up", "out", "off", "not", "no", "help", "create", "reveal",
      "share", "tell", "show", "explain", "discuss", "talk", "format",
      "tone", "focus", "please", "reel", "reels", "shorts", "youtube",
      "instagram", "tiktok", "video", "content", "want", "went", "going",
      "lot", "many", "most", "some", "every", "everyday", "additional",
      "context", "using", "based", "think", "know", "feel", "try",
    ]);

    function normalizeToKeywords(text: string): string {
      return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !CACHE_STOP_WORDS.has(w))
        .sort()
        .filter((w, i, arr) => arr.indexOf(w) === i) // dedupe
        .join(" ");
    }

    const normalizedIdea = normalizeToKeywords(idea);
    const normalizedNiche = niche.trim().toLowerCase();

    // ── 1. Check idea-level cache (free — no quota burned) ───────────────────
    if (ideaId) {
      const cached = await pool.query(
        "SELECT insights, insights_cached_at, insights_idea_text FROM ideas WHERE id = $1",
        [ideaId]
      );
      const row = cached.rows[0];
      if (row?.insights && row?.insights_cached_at) {
        const age = Date.now() - Number(row.insights_cached_at);
        if (age < IDEA_CACHE_TTL) {
          // If insights_idea_text is set, verify the text matches (prevents cross-contamination)
          // If it's null (old data before this column existed), serve it anyway
          const cachedForText = row.insights_idea_text?.trim().toLowerCase() ?? null;
          const currentText = idea.trim().toLowerCase();
          if (cachedForText === null || cachedForText === currentText) {
            res.json({ ...row.insights, cached: true });
            return;
          }
        }
      }
    }

    // ── 2. Check exact api_cache (free — no quota burned) ────────────────────
    const exactCacheParams = { idea: idea.trim().toLowerCase(), niche: normalizedNiche };
    const exactCached = await getCached<object>("insights", exactCacheParams);
    if (exactCached) {
      res.json({ ...exactCached, cached: true });
      return;
    }

    // ── 3. Check keyword-normalized cache (intent match — free) ──────────────
    // "rich habits of Indians" and "money habits wealthy Indians" normalize to
    // similar keyword sets and can share cached results
    if (normalizedIdea.length > 5) {
      const normalizedCacheParams = { normalized_idea: normalizedIdea, niche: normalizedNiche };
      const normalizedCached = await getCached<object>("insights_normalized", normalizedCacheParams);
      if (normalizedCached) {
        console.log(`[Insights] Keyword-normalized cache hit for: "${normalizedIdea.slice(0, 50)}..."`);
        res.json({ ...normalizedCached, cached: true });
        return;
      }
    }

    // ── 4. Cache miss — check daily limit before hitting external APIs ────────
    const { allowed, used, limit, remaining } = await checkLimit(userId, "insights");
    if (!allowed) {
      res.status(429).json({
        error: `Daily limit reached. You can validate ${limit} ideas per day. Resets at midnight UTC.`,
        used,
        limit,
        remaining: 0,
      });
      return;
    }

    // ── 4. Fetch fresh data with fallback stack ─────────────────────────────
    const nicheStr = niche || "";
    const ideaKeywords = idea.trim().toLowerCase().split(/\s+/).filter((w: string) => w.length > 2).slice(0, 8);

    // YouTube: live → fuzzy cache → empty
    let youtubeResults: YouTubeResult[] = [];
    try {
      youtubeResults = await fetchYouTubeTrends(idea, niche || undefined);
    } catch {
      // Try fuzzy cache
      const cached = await fuzzyCacheLookup<YouTubeResult[]>({
        namespace: "youtube_search",
        niche: nicheStr,
        keywords: ideaKeywords,
      });
      if (cached) youtubeResults = cached;
    }

    // Extract short keywords for Google Trends
    // Google Trends needs terms people actually search — not content titles
    // Strategy: extract core topic words, strip filler, try multiple candidates
    function extractTrendKeywords(text: string, niche: string): string[] {
      const STOP_WORDS = new Set([
        "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
        "have", "has", "had", "do", "does", "did", "will", "would", "could",
        "should", "may", "might", "can", "need", "want", "going", "get", "got",
        "make", "made", "like", "just", "really", "very", "so", "too", "also",
        "but", "and", "or", "if", "then", "when", "how", "what", "why", "who",
        "where", "which", "that", "this", "these", "those", "it", "its", "my",
        "your", "i", "me", "we", "you", "he", "she", "they", "about", "for",
        "with", "from", "into", "onto", "upon", "over", "under", "through",
        "between", "during", "before", "after", "of", "in", "on", "at", "by",
        "to", "up", "out", "off", "not", "no", "help", "create", "reveal",
        "share", "tell", "show", "explain", "discuss", "talk", "format",
        "tone", "focus", "everyday", "lot", "many", "most", "some", "every",
        "followed", "often", "ignore", "practical", "specific", "strong",
        "reel", "reels", "shorts", "youtube", "instagram", "tiktok", "video",
      ]);

      // Get meaningful words from the first sentence/clause
      const firstPart = text
        .split(/[.\n]/)[0]
        .split(/[:—–]/)[0]
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      const words = firstPart.split(" ").filter((w) => w.length > 2 && !STOP_WORDS.has(w));

      const candidates: string[] = [];

      // Candidate 1: first 3-4 meaningful words (the core topic)
      if (words.length >= 2) {
        candidates.push(words.slice(0, 4).join(" "));
      }
      if (words.length >= 2) {
        candidates.push(words.slice(0, 2).join(" "));
      }

      // Candidate 2: niche keyword alone (broadest, most likely to have data)
      if (niche && niche.length > 2) {
        candidates.push(niche);
      }

      // Candidate 3: first meaningful word + "India" (geo-specific)
      if (words.length >= 1) {
        candidates.push(`${words[0]} India`);
      }

      // Deduplicate and filter
      const seen = new Set<string>();
      return candidates.filter((c) => {
        const key = c.toLowerCase().trim();
        if (key.length < 3 || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    const trendKeywords = extractTrendKeywords(idea, nicheStr);
    console.log(`[Insights] Trend keyword candidates: ${trendKeywords.map((k) => `"${k}"`).join(", ")}`);

    const trendData = await (async (): Promise<TrendData | null> => {
      // Try each keyword candidate with SerpAPI until one returns data
      for (const kw of trendKeywords) {
        const serpData = await fetchGoogleTrendsSerpAPI(kw);
        if (serpData && (serpData.interest > 0 || serpData.timeline.length > 0)) {
          console.log(`[Insights] SerpAPI hit for keyword: "${kw}"`);
          return {
            keyword: serpData.keyword,
            interest: serpData.interest,
            relatedQueries: [...serpData.risingQueries, ...serpData.topQueries].slice(0, 10),
            avgInterest: serpData.avgInterest,
            peakInterest: serpData.peakInterest,
            timeline: serpData.timeline,
            risingQueries: serpData.risingQueries,
            topQueries: serpData.topQueries,
          };
        }
      }
      // Fall back to RapidAPI with the first keyword
      return fetchGoogleTrends(trendKeywords[0] ?? idea.slice(0, 60));
    })();

    console.log(`[Insights] Google Trends data for "${idea.slice(0, 40)}": ${trendData ? `interest=${trendData.interest}, timeline=${trendData.timeline?.length ?? 0} points, rising=${trendData.risingQueries?.length ?? 0}` : "null (no data)"}`);

    const hasAnyData = youtubeResults.length > 0 || trendData !== null;

    // Compute real signals from API data (pure math, no LLM)
    const signals = computeSignals(youtubeResults, trendData);

    let report;
    if (hasAnyData) {
      report = await synthesizeInsights({ idea, niche: nicheStr, youtubeResults, trendData, signals });
    } else {
      // AI Estimate Mode — all external data failed
      report = await generateAIEstimate(idea, nicheStr);
    }

    const payload = {
      report,
      signals,
      googleTrends: trendData ? {
        interest: trendData.interest,
        avgInterest: trendData.avgInterest ?? null,
        peakInterest: trendData.peakInterest ?? null,
        timeline: trendData.timeline ?? [],
        risingQueries: trendData.risingQueries ?? [],
        topQueries: trendData.topQueries ?? [],
        relatedQueries: trendData.relatedQueries,
      } : null,
      trendingNow: null,
      sources: {
        youtubeCount: youtubeResults.length,
        trendsAvailable: signals.googleTrends.available,
        trendScore: signals.trend.score,
        relatedQueries: signals.googleTrends.relatedQueries,
      },
      cached: false,
    };

    // ── Store in caches ─────────────────────────────────────────────────────
    const cacheMetadata = { niche: nicheStr, keywords: ideaKeywords };

    // Exact match cache
    const exactWriteParams = { idea: idea.trim().toLowerCase(), niche: normalizedNiche };
    await setCached("insights", exactWriteParams, payload, IDEA_CACHE_TTL, cacheMetadata);

    // Keyword-normalized cache (intent-based matching)
    if (normalizedIdea.length > 5) {
      const normalizedWriteParams = { normalized_idea: normalizedIdea, niche: normalizedNiche };
      await setCached("insights_normalized", normalizedWriteParams, payload, IDEA_CACHE_TTL, cacheMetadata);
    }

    // Idea-level cache for Vault → View Report flow
    if (ideaId) {
      await pool.query(
        "UPDATE ideas SET insights = $1, insights_cached_at = $2, insights_idea_text = $3 WHERE id = $4",
        [JSON.stringify(payload), Date.now(), idea.trim().toLowerCase(), ideaId]
      ).catch(() => {});
    }

    // ── 6. Increment usage only after successful non-cached call ──────────────
    await incrementUsage(userId, "insights");

    res.json({ ...payload, remaining: remaining - 1, limit });
  } catch (err) {
    console.error("Insights error:", err);
    res.status(502).json({ error: "Failed to generate insights" });
  }
});

export default router;
