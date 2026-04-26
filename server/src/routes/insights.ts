import { Router, Response } from "express";
import pool from "../db";
import { fetchYouTubeTrends, fetchGoogleTrends, fetchTopInstagramHashtags } from "../services/insights";
import { synthesizeInsights } from "../prompts/insightSynthesis";
import { getCached, setCached } from "../services/dbCache";
import { checkLimit, incrementUsage } from "../services/usageLimits";
import { AuthenticatedRequest } from "../middleware/auth";
import { fuzzyCacheLookup } from "../services/fuzzyCacheLookup";
import { generateAIEstimate } from "../services/aiEstimate";
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
    // ── 1. Check idea-level DB cache first (free — no quota burned) ───────────
    if (ideaId) {
      const cached = await pool.query(
        "SELECT insights, insights_cached_at FROM ideas WHERE id = $1",
        [ideaId]
      );
      const row = cached.rows[0];
      if (row?.insights && row?.insights_cached_at) {
        const age = Date.now() - Number(row.insights_cached_at);
        if (age < IDEA_CACHE_TTL) {
          res.json({ ...row.insights, cached: true });
          return;
        }
      }
    }

    // ── 2. Check generic api_cache (free — no quota burned) ──────────────────
    const cacheParams = { idea: idea.trim().toLowerCase(), niche: niche.trim().toLowerCase() };
    const genericCached = await getCached<object>("insights", cacheParams);
    if (genericCached) {
      if (ideaId) {
        await pool.query(
          "UPDATE ideas SET insights = $1, insights_cached_at = $2 WHERE id = $3",
          [JSON.stringify(genericCached), Date.now(), ideaId]
        );
      }
      res.json({ ...genericCached, cached: true });
      return;
    }

    // ── 3. Cache miss — check daily limit before hitting external APIs ────────
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

    const trendData = await fetchGoogleTrends(idea);

    const hasAnyData = youtubeResults.length > 0 || trendData !== null;

    let report;
    if (hasAnyData) {
      report = await synthesizeInsights({ idea, niche: nicheStr, youtubeResults, trendData });
    } else {
      // AI Estimate Mode — all external data failed
      report = await generateAIEstimate(idea, nicheStr);
    }

    const payload = {
      report,
      sources: {
        youtubeCount: youtubeResults.length,
        trendsAvailable: trendData !== null,
        trendScore: trendData?.interest ?? null,
        relatedQueries: trendData?.relatedQueries ?? [],
      },
      cached: false,
    };

    // ── 5. Store in caches (with metadata for fuzzy lookup) ───────────────
    const cacheMetadata = { niche: nicheStr, keywords: ideaKeywords };
    await setCached("insights", cacheParams, payload, IDEA_CACHE_TTL, cacheMetadata);

    if (ideaId) {
      await pool.query(
        "UPDATE ideas SET insights = $1, insights_cached_at = $2 WHERE id = $3",
        [JSON.stringify(payload), Date.now(), ideaId]
      );
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
