import { Router, Request, Response } from "express";
import pool from "../db";
import { fetchYouTubeTrends, fetchGoogleTrends } from "../services/insights";
import { synthesizeInsights } from "../prompts/insightSynthesis";
import { getCached, setCached } from "../services/dbCache";

const router = Router();

const IDEA_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

// GET /api/insights?idea=<text>&niche=<niche>&ideaId=<id>
router.get("/", async (req: Request, res: Response) => {
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
    // ── Check idea-level DB cache (tied to a specific saved idea) ─────────────
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

    // ── Check generic api_cache (works even without ideaId) ───────────────────
    const cacheParams = { idea: idea.trim().toLowerCase(), niche: niche.trim().toLowerCase() };
    const genericCached = await getCached<object>("insights", cacheParams);
    if (genericCached) {
      // If we have an ideaId, backfill the idea-level cache too
      if (ideaId) {
        await pool.query(
          "UPDATE ideas SET insights = $1, insights_cached_at = $2 WHERE id = $3",
          [JSON.stringify(genericCached), Date.now(), ideaId]
        );
      }
      res.json({ ...genericCached, cached: true });
      return;
    }

    // ── Fetch fresh data ───────────────────────────────────────────────────────
    const [youtubeResults, trendData] = await Promise.all([
      fetchYouTubeTrends(idea, niche || undefined),
      fetchGoogleTrends(idea),
    ]);

    const report = await synthesizeInsights({ idea, niche, youtubeResults, trendData });

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

    // ── Store in both caches ───────────────────────────────────────────────────
    await setCached("insights", cacheParams, payload, IDEA_CACHE_TTL);

    if (ideaId) {
      await pool.query(
        "UPDATE ideas SET insights = $1, insights_cached_at = $2 WHERE id = $3",
        [JSON.stringify(payload), Date.now(), ideaId]
      );
    }

    res.json(payload);
  } catch (err) {
    console.error("Insights error:", err);
    res.status(502).json({ error: "Failed to generate insights" });
  }
});

export default router;
