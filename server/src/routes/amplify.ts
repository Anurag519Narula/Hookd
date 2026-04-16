import { Router, Response } from "express";
import Groq from "groq-sdk";
import pool from "../db";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { buildAmplifySystemPrompt } from "../prompts/amplify";
import { fetchHashtagIntelligence } from "../services/insights";
import type { AmplifyRequest, CaptionResult, Platform } from "../types/index";

const router = Router();
router.use(requireAuth);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" });

router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const { prompt, conversation_id, platforms, caption_length } =
    req.body as AmplifyRequest;

  // ── Validate required fields ───────────────────────────────────────────────
  if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
    return res.status(400).json({ error: "prompt is required" });
  }

  if (!Array.isArray(platforms) || platforms.length === 0) {
    return res.status(400).json({ error: "platforms must be a non-empty array" });
  }

  const validPlatforms: Platform[] = ["instagram", "linkedin", "reels", "youtube_shorts"];
  for (const p of platforms) {
    if (!validPlatforms.includes(p)) {
      return res.status(400).json({ error: `Invalid platform: ${p}` });
    }
  }

  try {
    // ── Fetch user profile (niche, sub_niche) ──────────────────────────────
    const userResult = await pool.query(
      "SELECT niche, sub_niche FROM users WHERE id = $1",
      [userId]
    );
    const userRow = userResult.rows[0] ?? {};
    const niche: string | null = userRow.niche ?? null;
    const sub_niche: string | null = userRow.sub_niche ?? null;

    // ── Fetch conversation history from DB ─────────────────────────────────
    let conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [];

    if (conversation_id) {
      const convResult = await pool.query(
        "SELECT messages, user_id FROM amplify_conversations WHERE id = $1",
        [conversation_id]
      );

      if (convResult.rows.length > 0) {
        const conv = convResult.rows[0];
        // Verify ownership
        if (conv.user_id === userId) {
          const rawMessages: Array<{ role: string; content: string }> = Array.isArray(
            conv.messages
          )
            ? conv.messages
            : [];
          conversationHistory = rawMessages
            .filter((m) => m.role === "user" || m.role === "assistant")
            .map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            }));
        }
      }
    }

    // ── Fetch hashtag intelligence (YouTube + Groq synthesis) ─────────────
    const hashtagIntel = await fetchHashtagIntelligence({
      topic: prompt,
      niche,
      platforms: platforms as string[],
    });

    const hasRealTimeData = hashtagIntel.youtubeVideoCount > 0;

    // Build hashtag data string for the prompt
    const hashtag_data = hashtagIntel.summary;

    // ── Build system prompt ────────────────────────────────────────────────
    const systemPrompt = buildAmplifySystemPrompt({
      niche,
      sub_niche,
      platforms,
      caption_length,
      hashtag_data,
      per_platform_hashtags: hashtagIntel.perPlatform,
    });

    // ── Build Groq messages array ──────────────────────────────────────────
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: prompt },
    ];

    // ── Call Groq ──────────────────────────────────────────────────────────
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.8,
      max_tokens: 2048,
      response_format: { type: "json_object" },
    });

    const rawContent = completion.choices[0]?.message?.content ?? "{}";

    // ── Parse and return CaptionResult ─────────────────────────────────────
    let result: CaptionResult;
    try {
      result = JSON.parse(rawContent) as CaptionResult;
    } catch {
      return res.status(502).json({ error: "Failed to parse Groq response as JSON" });
    }

    // real_time_data_available reflects whether YouTube returned results
    if (!hasRealTimeData) {
      result.real_time_data_available = false;
    } else {
      result.real_time_data_available = true;
    }

    return res.json(result);
  } catch (err) {
    // ── Groq / upstream error → 502 ────────────────────────────────────────
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("POST /api/amplify error:", err);
    return res.status(502).json({ error: message });
  }
});

export default router;
