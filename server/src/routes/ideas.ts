import { Router, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import pool from "../db";
import { tagIdea } from "../prompts/ideaTagging";
import { AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// POST /api/ideas
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  const { raw_text } = req.body;
  const userId = req.userId!;

  if (!raw_text) {
    return res.status(400).json({ error: "raw_text is required" });
  }

  const id = uuidv4();
  const created_at = Date.now();

  try {
    const result = await pool.query(
      "INSERT INTO ideas (id, raw_text, created_at, tags, format_type, emotion_angle, potential_score, hooks, captions, status, user_id) " +
        "VALUES ($1, $2, $3, NULL, NULL, NULL, NULL, NULL, NULL, 'raw', $4) RETURNING *",
      [id, raw_text, created_at, userId]
    );

    const idea = result.rows[0];
    res.status(201).json(idea);

    // Fire-and-forget async tagging
    (async () => {
      try {
        const tagging = await tagIdea(raw_text);
        await pool.query(
          "UPDATE ideas SET tags = $1, format_type = $2, emotion_angle = $3, potential_score = $4, status = 'tagged' WHERE id = $5",
          [tagging.tags, tagging.format_type, tagging.emotion_angle, tagging.potential_score, id]
        );
      } catch (err) {
        console.error("Async tagging failed for idea", id, err);
      }
    })();
  } catch (err) {
    console.error("POST /api/ideas error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/ideas
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  const { score, format, status } = req.query;
  const userId = req.userId!;

  const conditions: string[] = ["user_id = $1"];
  const values: unknown[] = [userId];
  let idx = 2;

  if (score) {
    conditions.push("potential_score = $" + idx++);
    values.push(score);
  }
  if (format) {
    conditions.push("format_type = $" + idx++);
    values.push(format);
  }
  if (status) {
    conditions.push("status = $" + idx++);
    values.push(status);
  }

  const where = "WHERE " + conditions.join(" AND ");

  try {
    const result = await pool.query(
      "SELECT * FROM ideas " + where + " ORDER BY created_at DESC",
      values
    );
    res.json(result.rows);
  } catch (err) {
    console.error("GET /api/ideas error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/ideas/:id
router.get("/:id", async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.userId!;

  try {
    const result = await pool.query("SELECT * FROM ideas WHERE id = $1 AND user_id = $2", [id, userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Idea not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("GET /api/ideas/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/ideas/:id
router.patch("/:id", async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.userId!;
  const body = req.body as Record<string, unknown>;

  const allowedFields = [
    "raw_text",
    "tags",
    "format_type",
    "emotion_angle",
    "potential_score",
    "hooks",
    "captions",
    "selected_hook",
    "status",
  ];

  const setClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const field of allowedFields) {
    if (field in body) {
      setClauses.push(field + " = $" + idx++);
      values.push(body[field]);
    }
  }

  if (setClauses.length === 0) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  // Append user_id and id for the WHERE clause
  values.push(userId);
  values.push(id);

  try {
    const result = await pool.query(
      "UPDATE ideas SET " + setClauses.join(", ") + " WHERE user_id = $" + idx++ + " AND id = $" + idx + " RETURNING *",
      values
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Idea not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("PATCH /api/ideas/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/ideas/:id
router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.userId!;

  try {
    const result = await pool.query("DELETE FROM ideas WHERE id = $1 AND user_id = $2 RETURNING id", [id, userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Idea not found" });
    }
    res.status(204).send();
  } catch (err) {
    console.error("DELETE /api/ideas/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
