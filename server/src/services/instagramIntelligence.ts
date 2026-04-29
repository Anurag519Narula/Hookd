/**
 * Instagram Intelligence Engine — V1
 *
 * Computes Instagram Reels-specific signals from existing data.
 * Combines deterministic scoring (pure math) with LLM generation (hooks, format, caption style).
 * Runs in parallel with the existing insights pipeline — no sequential slowdown.
 */

import Groq from "groq-sdk";
import { groqWithBackoff } from "./groqWithBackoff";
import type { ComputedSignals } from "./computedSignals";
import type {
  InstagramSignals,
  ReelPotentialLabel,
  HookStrengthLabel,
  SaveabilityLabel,
  SaturationLabel,
  ReelFormat,
  CaptionStyle,
} from "../types/instagram";
import hashtagBank from "../data/hashtagBank.json";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" });

// ── Deterministic scoring (pure math, no LLM) ────────────────────────────────

function computeReelPotential(signals: ComputedSignals): { score: number; label: ReelPotentialLabel } {
  // Formula: 40% opportunity + 30% trend + 20% audience fit + 10% niche demand
  const opportunity = signals.opportunity.score;
  const trend = signals.trend.score;
  const audienceFit = signals.audienceFit.score;

  // Niche demand: derived from Google Trends interest or fallback to trend score
  const nicheDemand = signals.googleTrends.available
    ? (signals.googleTrends.interest ?? 0)
    : Math.round(trend * 0.6);

  const score = Math.round(
    opportunity * 0.40 +
    trend * 0.30 +
    audienceFit * 0.20 +
    nicheDemand * 0.10
  );

  const clamped = Math.max(0, Math.min(100, score));
  const label: ReelPotentialLabel = clamped >= 65 ? "High" : clamped >= 35 ? "Medium" : "Low";

  return { score: clamped, label };
}

function computeHookStrength(idea: string): { score: number; label: HookStrengthLabel } {
  const lower = idea.toLowerCase();

  // Strong triggers: curiosity, pain point, money, mistake, secret, transformation, controversy
  const strongPatterns = [
    /\bcurios/i, /\bsecret/i, /\bmistake/i, /\bmoney/i, /\brich/i, /\bwealth/i,
    /\bpoor/i, /\bfail/i, /\bwrong/i, /\bnever\b/i, /\balways\b/i, /\bstop\b/i,
    /\btruth/i, /\blie/i, /\bhidden/i, /\bshock/i, /\bunbeliev/i, /\btransform/i,
    /\bbefore.*after/i, /\bafter.*before/i, /\bcontrover/i, /\bdebat/i,
    /\bscam/i, /\bfraud/i, /\bhack/i, /\btrick/i, /\btrap/i, /\bsave/i,
    /\bearn/i, /\binvest/i, /\bpassive/i, /\bside hustle/i, /\bbudget/i,
    /\bpain/i, /\bstruggl/i, /\bregret/i, /\bwish.*knew/i, /\bno one.*tell/i,
    /\bwhy.*don't/i, /\bwhy.*won't/i, /\bhow.*actually/i, /\breal.*reason/i,
    /\bnobody/i, /\beveryone/i, /\bsilent/i, /\bquiet/i, /\bdark/i,
    /\bnumber/i, /\bstat/i, /\bpercent/i, /\b\d+\s*(habits?|rules?|tips?|ways?|things?|steps?)/i,
  ];

  // Weak patterns: generic, vague
  const weakPatterns = [
    /\bdaily vlog/i, /\brandom/i, /\bgeneric/i, /\bmotivation\b$/i,
    /\bmy day/i, /\bday in/i, /\bgrwm/i, /\bget ready/i,
    /\bjust.*sharing/i, /\bsome tips/i, /\bthoughts on/i,
  ];

  let strongHits = 0;
  let weakHits = 0;

  for (const p of strongPatterns) {
    if (p.test(lower)) strongHits++;
  }
  for (const p of weakPatterns) {
    if (p.test(lower)) weakHits++;
  }

  // Score: base 40, +10 per strong hit (max 5), -15 per weak hit
  let score = 40 + Math.min(5, strongHits) * 12 - weakHits * 15;

  // Bonus for specificity: numbers, proper nouns, specific claims
  if (/\d/.test(idea)) score += 8;
  if (idea.length > 30 && idea.length < 120) score += 5; // sweet spot length

  const clamped = Math.max(0, Math.min(100, score));
  const label: HookStrengthLabel = clamped >= 65 ? "Strong" : clamped >= 35 ? "Moderate" : "Weak";

  return { score: clamped, label };
}

function computeSaveability(idea: string): { score: number; label: SaveabilityLabel } {
  const lower = idea.toLowerCase();

  // High saveability: educational, checklist, finance, tools, systems, mistakes, how-to
  const savePatterns = [
    /\bhow to/i, /\bstep/i, /\bchecklist/i, /\bguide/i, /\btutorial/i,
    /\btips?\b/i, /\btool/i, /\bsystem/i, /\bframework/i, /\bstrateg/i,
    /\bmistake/i, /\bavoid/i, /\bfinance/i, /\bmoney/i, /\binvest/i,
    /\bbudget/i, /\bsave/i, /\blearn/i, /\bskill/i, /\bresource/i,
    /\btemplate/i, /\blist/i, /\brecipe/i, /\broutine/i, /\bworkout/i,
    /\bproduct/i, /\brecommend/i, /\bbest\b/i, /\btop\s*\d/i,
    /\bapp/i, /\bwebsite/i, /\bsoftware/i, /\bai\b/i,
    /\b\d+\s*(things?|ways?|habits?|rules?|tips?|steps?|tools?)/i,
  ];

  // Low saveability: entertainment, random, vlog
  const lowSavePatterns = [
    /\bvlog/i, /\bfunny/i, /\bcomedy/i, /\bprank/i, /\breact/i,
    /\bchallenge/i, /\btrend\b/i, /\bdance/i, /\brant/i,
    /\bstorytime/i, /\bopinion/i, /\bmy.*experience/i,
  ];

  let saveHits = 0;
  let lowHits = 0;

  for (const p of savePatterns) {
    if (p.test(lower)) saveHits++;
  }
  for (const p of lowSavePatterns) {
    if (p.test(lower)) lowHits++;
  }

  let score = 35 + Math.min(6, saveHits) * 10 - lowHits * 12;
  const clamped = Math.max(0, Math.min(100, score));
  const label: SaveabilityLabel = clamped >= 60 ? "High" : clamped >= 35 ? "Medium" : "Low";

  return { score: clamped, label };
}

function computeSaturation(signals: ComputedSignals): { score: number; label: SaturationLabel } {
  // Based on competition level + channel dominance
  const comp = signals.competition;
  let score = 0;

  if (comp.level === "high") {
    score = 70 + Math.min(30, comp.totalVideos * 2);
  } else if (comp.level === "medium") {
    score = 35 + Math.min(35, comp.totalVideos * 3);
  } else {
    score = Math.min(35, comp.totalVideos * 5);
  }

  // Boost saturation if top video views are very high (dominant players)
  if (signals.evidence.topVideoViews > 1_000_000) score += 10;

  const clamped = Math.max(0, Math.min(100, score));
  const label: SaturationLabel = clamped >= 65 ? "High" : clamped >= 35 ? "Medium" : "Low";

  return { score: clamped, label };
}

// ── Best Format Engine (deterministic) ────────────────────────────────────────

function determineBestFormat(idea: string, niche: string): ReelFormat {
  const lower = (idea + " " + niche).toLowerCase();

  // Screen Recording: AI tools, software, apps, tech demos
  if (/\b(ai\b|tool|app|software|website|screen|demo|tutorial|code|program)/i.test(lower)) {
    return "Screen Recording";
  }

  // Before / After: transformation, results, progress
  if (/\b(before.*after|transform|result|progress|glow.?up|weight.?loss|makeover)/i.test(lower)) {
    return "Before / After Style";
  }

  // Voiceover Story: storytelling, personal experience, narrative
  if (/\b(story|experience|journey|lesson|learned|happened|once|when i)/i.test(lower)) {
    return "Voiceover Story";
  }

  // Carousel Reel: lists, tips, steps, comparisons
  if (/\b(\d+\s*(tips?|ways?|things?|steps?|habits?|rules?)|list|compare|vs\b)/i.test(lower)) {
    return "Carousel Reel";
  }

  // Faceless B-roll: finance, motivation, facts, data-heavy
  if (/\b(finance|money|invest|wealth|rich|budget|passive|stock|crypto|fact|data|stat)/i.test(lower)) {
    return "Faceless B-roll";
  }

  // Green Screen Commentary: news, controversy, reaction, opinion
  if (/\b(news|controver|react|opinion|debate|hot take|unpopular)/i.test(lower)) {
    return "Green Screen Commentary";
  }

  // Default: Talking Head (most versatile)
  return "Talking Head";
}

// ── Caption Style Engine (deterministic) ──────────────────────────────────────

function determineCaptionStyle(idea: string, niche: string): CaptionStyle {
  const lower = (idea + " " + niche).toLowerCase();

  if (/\b(story|journey|experience|lesson|happened|once|when i)/i.test(lower)) return "Storytelling";
  if (/\b(secret|truth|hidden|nobody|real.*reason|actually)/i.test(lower)) return "Curious";
  if (/\b(expert|research|study|data|proven|science|fact)/i.test(lower)) return "Authority";
  if (/\b(my|personal|i\b|me\b|struggle|honest|real talk)/i.test(lower)) return "Personal";
  if (/\b(bold|controver|unpopular|hot take|stop|never|always)/i.test(lower)) return "Bold";

  return "Minimal";
}

// ── Hashtag Pack (from hashtagBank + niche-aware) ─────────────────────────────

function buildHashtagPack(idea: string, niche: string): string[] {
  const lower = niche.toLowerCase().trim();
  const ideaLower = idea.toLowerCase();

  // Get niche-specific tags from bank
  const bank = hashtagBank as Record<string, string[]>;
  const nicheTags = bank[lower] ?? [];

  // Broad tags (always relevant for Reels)
  const broadTags = ["#reels", "#reelsinstagram", "#explorepage"];

  // Mid-range tags from niche bank
  const midTags = nicheTags.slice(0, 5);

  // Niche-specific tags: extract keywords from idea
  const ideaWords = ideaLower
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3);

  const nichSpecificTags = ideaWords
    .slice(0, 3)
    .map((w) => `#${w}`)
    .filter((t) => !broadTags.includes(t) && !midTags.includes(t));

  // Combine: 3 broad + 5 mid + 2-4 niche = 10-12 tags
  const combined = [...broadTags, ...midTags, ...nichSpecificTags];

  // Deduplicate and limit to 12
  const seen = new Set<string>();
  const result: string[] = [];
  for (const tag of combined) {
    const normalized = tag.toLowerCase();
    if (!seen.has(normalized) && result.length < 12) {
      seen.add(normalized);
      result.push(tag);
    }
  }

  return result;
}

// ── LLM Hook Generation (3 viral-ready hooks) ────────────────────────────────

async function generateReelHooks(idea: string, niche: string): Promise<string[]> {
  const prompt = `You are an Instagram Reels hook specialist. Generate exactly 3 scroll-stopping hooks for this content idea.

IDEA: "${idea}"
NICHE: ${niche || "general"}

RULES:
- Each hook must be 1 sentence, under 15 words
- Use psychological triggers: curiosity gap, pain point, identity challenge, surprising claim
- Make them specific to the idea — no generic hooks
- Write for Indian creators (Hinglish-friendly tone is fine)
- These are the FIRST words spoken in a Reel — they must stop the scroll instantly
- No filler phrases like "Did you know" or "In this video"
- No hashtags or emojis in hooks

Return ONLY a valid JSON array of 3 strings. No markdown, no explanation.
Example: ["Hook 1 text", "Hook 2 text", "Hook 3 text"]`;

  try {
    const completion = await groqWithBackoff(groq, {
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 300,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "[]";
    // Handle both array and object responses
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.slice(0, 3);
    if (parsed.hooks && Array.isArray(parsed.hooks)) return parsed.hooks.slice(0, 3);
    // Try to extract any array from the object
    const values = Object.values(parsed);
    for (const v of values) {
      if (Array.isArray(v) && v.length > 0 && typeof v[0] === "string") return v.slice(0, 3);
    }
    return [];
  } catch (err) {
    console.error("[InstagramIntelligence] Hook generation failed:", err);
    return generateFallbackHooks(idea);
  }
}

function generateFallbackHooks(idea: string): string[] {
  // Deterministic fallback if Groq fails
  const words = idea.split(/\s+/).slice(0, 4).join(" ");
  return [
    `Most people get ${words} completely wrong.`,
    `Nobody talks about this side of ${words}.`,
    `Stop doing ${words} the old way.`,
  ];
}

// ── Main entry point ──────────────────────────────────────────────────────────

export async function getInstagramSignals(
  idea: string,
  niche: string,
  signals: ComputedSignals
): Promise<InstagramSignals> {
  // Deterministic computations (instant, no API calls)
  const reelPotential = computeReelPotential(signals);
  const hookStrength = computeHookStrength(idea);
  const saveability = computeSaveability(idea);
  const saturation = computeSaturation(signals);
  const bestFormat = determineBestFormat(idea, niche);
  const captionStyle = determineCaptionStyle(idea, niche);
  const hashtagPack = buildHashtagPack(idea, niche);

  // LLM generation (single Groq call for hooks)
  const hookIdeas = await generateReelHooks(idea, niche);

  return {
    reelPotential,
    hookStrength,
    saveability,
    saturation,
    bestFormat,
    captionStyle,
    hookIdeas,
    hashtagPack,
  };
}
