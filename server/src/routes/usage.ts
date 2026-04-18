import { Router, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { checkLimit, DAILY_LIMITS } from "../services/usageLimits";

const router = Router();

// GET /api/usage — returns today's usage for all tracked actions
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;

  try {
    const actions = Object.keys(DAILY_LIMITS);
    const results = await Promise.all(
      actions.map(async (action) => {
        const { used, limit, remaining } = await checkLimit(userId, action);
        return { action, used, limit, remaining };
      })
    );

    const usage: Record<string, { used: number; limit: number; remaining: number }> = {};
    for (const r of results) {
      usage[r.action] = { used: r.used, limit: r.limit, remaining: r.remaining };
    }

    res.json({ usage, resetsAt: "midnight UTC" });
  } catch (err) {
    console.error("GET /api/usage error:", err);
    res.status(500).json({ error: "Failed to fetch usage" });
  }
});

export default router;
