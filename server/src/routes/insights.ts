import { Router, Request, Response } from "express";
import pool from "../db";
import { fetchYouTubeTrends, fetchGoogleTrends } from "../services/insights";
import { synthesizeInsights } from "../prompts/insightSynthesis";

const router = Router();

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

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
    // ── Check cache if ideaId provided ────────────────────────────────────────
    if (ideaId) {
      const cached = await pool.query(
        "SELECT insights, insights_cached_at FROM ideas WHERE id = $1",
        [ideaId]
      );

      const row = cached.rows[0];
      if (row?.insights && row?.insights_cached_at) {
        const age = Date.now() - Number(row.insights_cached_at);
        if (age < CACHE_TTL_MS) {
          // Return cached — include a flag so client knows it's from cache
          res.json({ ...row.insights, cached: true });
          return;
        }
      }
    }

    // ── Fetch fresh data ───────────────────────────────────────────────────────
    const [youtubeResults, trendData] = await Promise.all([
      fetchYouTubeTrends(idea),
      fetchGoogleTrends(idea),
    ]);

    const report = await synthesizeInsights({
      idea,
      niche,
      youtubeResults,
      trendData,
    });

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

    // ── Store in cache if ideaId provided ─────────────────────────────────────
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
