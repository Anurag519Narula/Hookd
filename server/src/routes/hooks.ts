import { Router, Response } from "express";
import { generateHooks } from "../prompts/hooks";
import pool from "../db";
import { AuthenticatedRequest } from "../middleware/auth";
import { v4 as uuidv4 } from "uuid";

const router = Router();

router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  const { raw_idea, niche = "", sub_niche = "", language = "English", idea_id } = req.body;
  const userId = req.userId;

  if (!raw_idea) {
    res.status(400).json({ error: "raw_idea is required" });
    return;
  }

  try {
    const hooks = await generateHooks({ raw_idea, niche, sub_niche, language });

    let finalIdeaId = idea_id;

    if (!finalIdeaId && userId) {
      // Create new on FIRST generation
      finalIdeaId = uuidv4();
      await pool.query(
        "INSERT INTO ideas (id, raw_text, hooks, created_at, user_id, status) VALUES ($1, $2, $3, $4, $5, 'raw')",
        [finalIdeaId, raw_idea, JSON.stringify(hooks), Date.now(), userId]
      );
    }

    res.json({ hooks, idea_id: finalIdeaId });
  } catch (err) {
    console.error("Hook generation error:", err);
    res.status(502).json({ error: "AI generation failed" });
  }
});

export default router;
