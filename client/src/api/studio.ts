import type { Script, ScriptFormat, HookVariant, ScriptBeat } from "../types/index";
import type { ClarityQuestion } from "../types/insights";
import { authHeaders } from "./auth";

export interface ClarifyResponse {
  isClear: boolean;
  questions: ClarityQuestion[];
}

export interface StudioGenerateRequest {
  idea: string;
  format: ScriptFormat;
  niche?: string;
  sub_niche?: string;
  language?: string;
}

export interface StudioRegenerateRequest {
  idea: string;
  format: ScriptFormat;
  current_hooks: HookVariant[];
  selected_hook?: HookVariant;
  feedback?: string;
  regenerate_target: "hook" | "script";
  hook_index?: number;
}

// ── New hook-first API ─────────────────────────────────────────────────────────

/** Step 1: Generate 6 hook variants only. Fast — no beats generated yet. */
export async function generateHooks(
  request: StudioGenerateRequest
): Promise<{ hook_variants: HookVariant[]; cached: boolean }> {
  const res = await fetch("/api/studio/hooks", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(request),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? "Failed to generate hooks");
  return body as { hook_variants: HookVariant[]; cached: boolean };
}

/** Step 2: Generate beats + CTA for the selected hook. */
export async function generateScriptFromHook(
  request: StudioGenerateRequest & { selected_hook: HookVariant }
): Promise<{ beats: ScriptBeat[]; cta: string; word_count: number; cached: boolean }> {
  const res = await fetch("/api/studio/script", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(request),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? "Failed to generate script");
  return body as { beats: ScriptBeat[]; cta: string; word_count: number; cached: boolean };
}

// ── Legacy single-call API (kept for vault restore flow) ──────────────────────

export async function generateScript(request: StudioGenerateRequest): Promise<Script> {
  const res = await fetch("/api/studio/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(request),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? "Failed to generate script");

  const data = body as { hook_variants: HookVariant[]; beats: ScriptBeat[]; cta: string; word_count: number };
  return {
    format: request.format,
    selected_hook: data.hook_variants[0],
    hook_variants: data.hook_variants,
    beats: data.beats,
    cta: data.cta,
    word_count: data.word_count,
  };
}

export async function regenerateScript(request: StudioRegenerateRequest): Promise<Partial<Script>> {
  const res = await fetch("/api/studio/regenerate", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(request),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? "Failed to regenerate script");
  return body as Partial<Script>;
}

// ── Clarity assessment ─────────────────────────────────────────────────────────

/** Assess whether an idea is specific enough for validation. */
export async function clarifyIdea(idea: string): Promise<ClarifyResponse> {
  const res = await fetch("/api/studio/clarify", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ idea }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? "Failed to assess idea clarity");
  return body as ClarifyResponse;
}
