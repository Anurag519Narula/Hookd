import { Router, Response } from "express";
import pool from "../db";
import { AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// GET /api/users/me
router.get("/me", async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;

  try {
    const result = await pool.query(
      "SELECT id, email, name, created_at, niche, sub_niche, language, platform_priority, onboarding_complete FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];

    // platform_priority is stored as JSONB — pg driver returns it already parsed,
    // but guard against it being a raw string just in case.
    if (typeof user.platform_priority === "string") {
      try {
        user.platform_priority = JSON.parse(user.platform_priority);
      } catch {
        user.platform_priority = [];
      }
    }

    res.json(user);
  } catch (err) {
    console.error("GET /api/users/me error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/users/me
router.patch("/me", async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const body = req.body as Record<string, unknown>;

  const allowedFields = ["name", "niche", "sub_niche", "language", "platform_priority", "onboarding_complete"];

  const setClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  // JSONB fields that must be serialized to a JSON string for pg
  const jsonbFields = new Set(["platform_priority"]);

  for (const field of allowedFields) {
    if (field in body) {
      setClauses.push(field + " = $" + idx++);
      const val = body[field];
      // pg doesn't auto-serialize arrays/objects to JSONB — do it explicitly
      values.push(jsonbFields.has(field) ? JSON.stringify(val) : val);
    }
  }

  if (setClauses.length === 0) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  values.push(userId);

  try {
    const result = await pool.query(
      "UPDATE users SET " +
        setClauses.join(", ") +
        " WHERE id = $" +
        idx +
        " RETURNING id, email, name, created_at, niche, sub_niche, language, platform_priority, onboarding_complete",
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];

    if (typeof user.platform_priority === "string") {
      try {
        user.platform_priority = JSON.parse(user.platform_priority);
      } catch {
        user.platform_priority = [];
      }
    }

    res.json(user);
  } catch (err) {
    console.error("PATCH /api/users/me error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/users/me
router.delete("/me", async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;

  try {
    const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING id", [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(204).send();
  } catch (err) {
    console.error("DELETE /api/users/me error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
