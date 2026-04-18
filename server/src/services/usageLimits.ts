import pool from "../db";

// ── Daily limits per user ─────────────────────────────────────────────────────
// With 30 API calls/month across all users, be conservative.
// Cache hits don't count — only fresh external API calls burn quota.
export const DAILY_LIMITS: Record<string, number> = {
  insights:  2,   // idea validations per day (YouTube + Groq + RapidAPI)
  amplify:   5,   // caption generations per day (RapidAPI + Groq)
  studio:    5,   // hook/script generations per day (Groq)
};

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

// ── Get current usage for a user+action today ─────────────────────────────────
export async function getUsage(userId: string, action: string): Promise<number> {
  const result = await pool.query(
    "SELECT count FROM usage_limits WHERE user_id = $1 AND action = $2 AND date = $3",
    [userId, action, todayUTC()]
  );
  return result.rows[0]?.count ?? 0;
}

// ── Check if user is within their daily limit ─────────────────────────────────
export async function checkLimit(userId: string, action: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
}> {
  const limit = DAILY_LIMITS[action] ?? 5;
  const used = await getUsage(userId, action);
  const remaining = Math.max(0, limit - used);
  return { allowed: used < limit, used, limit, remaining };
}

// ── Increment usage count (call only after a successful non-cached API call) ──
export async function incrementUsage(userId: string, action: string): Promise<void> {
  await pool.query(
    `INSERT INTO usage_limits (id, user_id, action, date, count)
     VALUES (gen_random_uuid()::text, $1, $2, $3, 1)
     ON CONFLICT (user_id, action, date)
     DO UPDATE SET count = usage_limits.count + 1`,
    [userId, action, todayUTC()]
  );
}
