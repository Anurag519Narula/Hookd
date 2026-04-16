import { Router, Request, Response } from "express";
import { fetchTopInstagramHashtagsGlobal } from "../services/insights";

const router = Router();

/**
 * GET /api/trending
 * Returns top Instagram hashtags, cached 2 days in DB.
 * Public endpoint — no auth required (used on HomeScreen before login too).
 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const hashtags = await fetchTopInstagramHashtagsGlobal(0);
    res.json({ hashtags, cached: hashtags.length > 0 });
  } catch (err) {
    console.error("GET /api/trending error:", err);
    res.status(502).json({ error: "Failed to fetch trending hashtags" });
  }
});

export default router;
