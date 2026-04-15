import { Router, Response } from "express";
import { generateCaption, regenerateCaption } from "../prompts/captionWithHook";
import pool from "../db";
import { AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// POST /api/captions/regenerate
router.post("/regenerate", async (req: AuthenticatedRequest, res: Response) => {
  const {
    original_caption,
    feedback = "",
    platform,
    niche = "",
    anchor_keywords = [],
    language = "English",
    idea_id,
  } = req.body;
  const userId = req.userId;

  try {
    const content = await regenerateCaption({
      original_caption,
      feedback,
      platform,
      niche,
      anchor_keywords,
      language,
    });

    if (idea_id && userId) {
      await pool.query(
        "UPDATE ideas SET captions = COALESCE(captions, '{}'::jsonb) || json_build_object($1::text, $2::text)::jsonb WHERE id = $3 AND user_id = $4",
        [platform, content, idea_id, userId]
      );
    }

    res.json({ content });
  } catch (err) {
    console.error("Caption regeneration error:", err);
    res.status(502).json({ error: "AI generation failed" });
  }
});

// POST /api/captions
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  const { hook, raw_idea, platform, niche = "", anchor_keywords = [], language = "English", idea_id } = req.body;
  const userId = req.userId;

  if (!hook || !raw_idea || !platform) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  try {
    const content = await generateCaption({ hook, raw_idea, platform, niche, anchor_keywords, language });

    if (idea_id && userId) {
      await pool.query(
        "UPDATE ideas SET captions = COALESCE(captions, '{}'::jsonb) || json_build_object($1::text, $2::text)::jsonb, selected_hook = $3 WHERE id = $4 AND user_id = $5",
        [platform, content, hook, idea_id, userId]
      );
    }

    res.json({ content });
  } catch (err) {
    console.error("Caption generation error:", err);
    res.status(502).json({ error: "AI generation failed" });
  }
});

export default router;
