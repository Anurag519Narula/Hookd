import { Router, Response } from "express";
import Groq from "groq-sdk";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import {
  buildHooksOnlyPrompt,
  buildScriptFromHookPrompt,
  buildScriptGeneratePrompt,
  buildScriptRegeneratePrompt,
  buildHookRegeneratePrompt,
  STUDIO_SYSTEM_PROMPT,
} from "../prompts/studio";
import { getCached, setCached } from "../services/dbCache";
import type { StudioGenerateRequest, StudioRegenerateRequest } from "../types/index";

const router = Router();
router.use(requireAuth);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" });

// ── POST /api/studio/hooks ────────────────────────────────────────────────────
router.post("/hooks", async (req: AuthenticatedRequest, res: Response) => {
  const { idea, format, niche, sub_niche, language } = req.body as StudioGenerateRequest;

  if (!idea || typeof idea !== "string" || idea.trim() === "") {
    return res.status(400).json({ error: "idea is required" });
  }
  if (!format || (format !== "reels" && format !== "youtube_shorts")) {
    return res.status(400).json({ error: "format must be 'reels' or 'youtube_shorts'" });
  }

  const cacheParams = { idea: idea.trim(), format, niche: niche ?? null, sub_niche: sub_niche ?? null, language: language ?? null };
  const cached = await getCached<{ hook_variants: unknown }>("studio_hooks", cacheParams);
  if (cached) return res.json({ ...cached, cached: true });

  try {
    const { system, user } = buildHooksOnlyPrompt(idea, format, niche, sub_niche, language);
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      temperature: 0.85,
      max_tokens: 512,
      response_format: { type: "json_object" },
    });

    const rawContent = completion.choices[0]?.message?.content ?? "{}";
    let result: { hook_variants: unknown };
    try { result = JSON.parse(rawContent); }
    catch { return res.status(502).json({ error: "Failed to parse Groq response" }); }

    await setCached("studio_hooks", cacheParams, result);
    return res.json({ ...result, cached: false });
  } catch (err) {
    console.error("POST /api/studio/hooks error:", err);
    return res.status(502).json({ error: err instanceof Error ? err.message : "Unknown error" });
  }
});

// ── POST /api/studio/script ───────────────────────────────────────────────────
router.post("/script", async (req: AuthenticatedRequest, res: Response) => {
  const { idea, format, niche, sub_niche, language, selected_hook } = req.body as StudioGenerateRequest & {
    selected_hook: { hook_text: string; trigger: string };
  };

  if (!idea || typeof idea !== "string" || idea.trim() === "") {
    return res.status(400).json({ error: "idea is required" });
  }
  if (!format || (format !== "reels" && format !== "youtube_shorts")) {
    return res.status(400).json({ error: "format must be 'reels' or 'youtube_shorts'" });
  }
  if (!selected_hook?.hook_text) {
    return res.status(400).json({ error: "selected_hook is required" });
  }

  const cacheParams = {
    idea: idea.trim(),
    format,
    niche: niche ?? null,
    sub_niche: sub_niche ?? null,
    language: language ?? null,
    hook_text: selected_hook.hook_text,
    trigger: selected_hook.trigger,
  };
  const cached = await getCached<{ beats: unknown; cta: unknown; word_count: unknown }>("studio_script", cacheParams);
  if (cached) return res.json({ ...cached, cached: true });

  try {
    const { system, user } = buildScriptFromHookPrompt(idea, format, selected_hook as any, niche, sub_niche, language);
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      temperature: 0.75,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    });

    const rawContent = completion.choices[0]?.message?.content ?? "{}";
    let result: { beats: unknown; cta: unknown; word_count: unknown };
    try { result = JSON.parse(rawContent); }
    catch { return res.status(502).json({ error: "Failed to parse Groq response" }); }

    await setCached("studio_script", cacheParams, result);
    return res.json({ ...result, cached: false });
  } catch (err) {
    console.error("POST /api/studio/script error:", err);
    return res.status(502).json({ error: err instanceof Error ? err.message : "Unknown error" });
  }
});

// ── POST /api/studio/generate — legacy single-call ───────────────────────────
router.post("/generate", async (req: AuthenticatedRequest, res: Response) => {
  const { idea, format, niche, sub_niche, language } = req.body as StudioGenerateRequest;

  if (!idea || typeof idea !== "string" || idea.trim() === "") {
    return res.status(400).json({ error: "idea is required" });
  }
  if (!format || (format !== "reels" && format !== "youtube_shorts")) {
    return res.status(400).json({ error: "format must be 'reels' or 'youtube_shorts'" });
  }

  const cacheParams = { idea: idea.trim(), format, niche: niche ?? null, sub_niche: sub_niche ?? null, language: language ?? null };
  const cached = await getCached<{ hook_variants: unknown; beats: unknown; cta: unknown; word_count: unknown }>("studio_generate", cacheParams);
  if (cached) return res.json({ ...cached, cached: true });

  try {
    const { system, user } = buildScriptGeneratePrompt(idea, format, niche, sub_niche, language);
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      temperature: 0.8,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const rawContent = completion.choices[0]?.message?.content ?? "{}";
    let result: { hook_variants: unknown; beats: unknown; cta: unknown; word_count: unknown };
    try { result = JSON.parse(rawContent); }
    catch { return res.status(502).json({ error: "Failed to parse Groq response as JSON" }); }

    await setCached("studio_generate", cacheParams, result);
    return res.json({ hook_variants: result.hook_variants, beats: result.beats, cta: result.cta, word_count: result.word_count });
  } catch (err) {
    console.error("POST /api/studio/generate error:", err);
    return res.status(502).json({ error: err instanceof Error ? err.message : "Unknown error" });
  }
});

// ── POST /api/studio/regenerate — no cache (user-specific feedback) ───────────
router.post("/regenerate", async (req: AuthenticatedRequest, res: Response) => {
  const { idea, format, current_hooks, selected_hook, feedback, regenerate_target } =
    req.body as StudioRegenerateRequest;

  if (!idea || typeof idea !== "string" || idea.trim() === "") {
    return res.status(400).json({ error: "idea is required" });
  }
  if (!format || (format !== "reels" && format !== "youtube_shorts")) {
    return res.status(400).json({ error: "format must be 'reels' or 'youtube_shorts'" });
  }
  if (!regenerate_target || (regenerate_target !== "hook" && regenerate_target !== "script")) {
    return res.status(400).json({ error: "regenerate_target must be 'hook' or 'script'" });
  }

  try {
    let userMessage: string;
    if (regenerate_target === "hook") {
      const existingTriggers = (current_hooks ?? []).map((h) => h.trigger);
      userMessage = buildHookRegeneratePrompt(idea, format, existingTriggers, feedback);
    } else {
      if (!selected_hook) return res.status(400).json({ error: "selected_hook is required for script regeneration" });
      userMessage = buildScriptRegeneratePrompt(idea, format, selected_hook, feedback);
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: STUDIO_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.8,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    });

    const rawContent = completion.choices[0]?.message?.content ?? "{}";
    let result: Record<string, unknown>;
    try { result = JSON.parse(rawContent); }
    catch { return res.status(502).json({ error: "Failed to parse Groq response as JSON" }); }

    if (regenerate_target === "hook") {
      return res.json({ hook_variants: result });
    } else {
      return res.json({ beats: result.beats, cta: result.cta, word_count: result.word_count });
    }
  } catch (err) {
    console.error("POST /api/studio/regenerate error:", err);
    return res.status(502).json({ error: err instanceof Error ? err.message : "Unknown error" });
  }
});

export default router;
