import { Router, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import pool from "../db";
import { AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// GET /api/conversations — list all sessions for the authenticated user (no messages column)
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;

  try {
    const result = await pool.query(
      "SELECT id, user_id, title, created_at, updated_at FROM amplify_conversations WHERE user_id = $1 ORDER BY updated_at DESC",
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("GET /api/conversations error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/conversations/:id — get full session including messages
router.get("/:id", async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT id, user_id, title, messages, created_at, updated_at FROM amplify_conversations WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const conversation = result.rows[0];

    if (conversation.user_id !== userId) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    res.json(conversation);
  } catch (err) {
    console.error("GET /api/conversations/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/conversations — create a new conversation
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const { title } = req.body as { title?: string };

  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "title is required" });
  }

  const id = uuidv4();
  const now = Date.now();

  try {
    const result = await pool.query(
      "INSERT INTO amplify_conversations (id, user_id, title, messages, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [id, userId, title.trim(), JSON.stringify([]), now, now]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /api/conversations error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/conversations/:id — append messages to existing conversation
router.patch("/:id", async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;
  const { messages } = req.body as { messages?: unknown[] };

  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: "messages must be an array" });
  }

  try {
    // Fetch existing conversation first to verify ownership
    const fetchResult = await pool.query(
      "SELECT id, user_id, messages FROM amplify_conversations WHERE id = $1",
      [id]
    );

    if (fetchResult.rows.length === 0) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const conversation = fetchResult.rows[0];

    if (conversation.user_id !== userId) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Concatenate existing messages with incoming messages
    const existingMessages: unknown[] = Array.isArray(conversation.messages) ? conversation.messages : [];
    const updatedMessages = [...existingMessages, ...messages];
    const now = Date.now();

    const updateResult = await pool.query(
      "UPDATE amplify_conversations SET messages = $1, updated_at = $2 WHERE id = $3 RETURNING *",
      [JSON.stringify(updatedMessages), now, id]
    );

    res.json(updateResult.rows[0]);
  } catch (err) {
    console.error("PATCH /api/conversations/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/conversations/:id — delete a conversation (ownership verified)
router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;

  try {
    // Verify ownership before deleting
    const fetchResult = await pool.query(
      "SELECT id, user_id FROM amplify_conversations WHERE id = $1",
      [id]
    );

    if (fetchResult.rows.length === 0) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    if (fetchResult.rows[0].user_id !== userId) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    await pool.query("DELETE FROM amplify_conversations WHERE id = $1", [id]);

    res.status(204).send();
  } catch (err) {
    console.error("DELETE /api/conversations/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
