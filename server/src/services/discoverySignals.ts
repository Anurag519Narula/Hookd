/**
 * Discovery Demand Signal
 *
 * Measures likelihood of succeeding through feed distribution (Reels, Shorts).
 * Deterministic — no LLM call. Uses idea text + niche characteristics.
 *
 * High discovery demand = topic thrives in algorithmic feeds even without search volume.
 */

import type { MarketType } from "./marketClassifier";

// ── Niche base scores ────────────────────────────────────────────────────────
// How inherently "feed-native" is this niche? (0–100 base)

const NICHE_DISCOVERY_BASE: Record<string, number> = {
  skincare: 85, beauty: 85, fashion: 82, lifestyle: 80,
  fitness: 78, food: 80, cooking: 75, travel: 78,
  photography: 72, art: 70, diy: 72, gardening: 65,
  pets: 82, parenting: 68, wellness: 72, comedy: 88,
  entertainment: 85, music: 75, dance: 88,
  relationships: 78, "home decor": 75, "self care": 78,
  motivation: 70, mindset: 65, finance: 55,
  "personal finance": 55, investing: 50, crypto: 55,
  business: 50, marketing: 55, productivity: 52,
  health: 62, "mental health": 65, sustainability: 55,
  sports: 68, gaming: 72, tech: 40, coding: 35,
  programming: 32, education: 42, realestate: 38,
  "real estate": 38,
};

// ── Content signal patterns ──────────────────────────────────────────────────

const VISUAL_APPEAL_PATTERNS = [
  /\bglow/i, /\baesthetic/i, /\btransform/i, /\bbefore.*after/i,
  /\bmakeover/i, /\boutfit/i, /\bstyle/i, /\blook\b/i,
  /\brecipe/i, /\bfood/i, /\bcooking/i, /\bworkout/i,
  /\broom\b/i, /\bdecor/i, /\btravel/i, /\bnature/i,
  /\bpet/i, /\bdog/i, /\bcat/i, /\bbaby/i,
  /\bdance/i, /\bchoreograph/i, /\bfashion/i,
];

const SAVE_SHARE_PATTERNS = [
  /\b\d+\s*(tips?|ways?|habits?|rules?|things?|steps?|hacks?|mistakes?)/i,
  /\bchecklist/i, /\bguide\b/i, /\broutine/i, /\blist\b/i,
  /\bsave\s+this/i, /\bbookmark/i, /\bshare\s+with/i,
  /\btemplate/i, /\bframework/i, /\bcheat\s*sheet/i,
];

const EMOTIONAL_TRIGGER_PATTERNS = [
  /\brelat/i, /\bfeel/i, /\bstruggl/i, /\bhonest/i,
  /\breal\s+talk/i, /\bnobody\s+tells/i, /\bsecret/i,
  /\btruth/i, /\bpain/i, /\bregret/i, /\blove\b/i,
  /\bhate\b/i, /\bfear\b/i, /\bjealous/i, /\binsecur/i,
  /\bconfiden/i, /\banxi/i, /\blonely/i,
];

const EVERGREEN_PATTERNS = [
  /\bhabits?\b/i, /\broutine/i, /\beveryday/i, /\bdaily/i,
  /\bmorning/i, /\bnight/i, /\bweekly/i, /\bmonthly/i,
  /\balways\b/i, /\bnever\b/i, /\beveryone/i, /\bpeople\b/i,
  /\blife\b/i, /\bhealth/i, /\bskin/i, /\bbody/i,
  /\bmoney\b/i, /\brelationship/i, /\bfood\b/i,
];

const REEL_NATIVE_PATTERNS = [
  /\bpov\b/i, /\bgrwm\b/i, /\bget\s+ready/i, /\bday\s+in/i,
  /\bstorytime/i, /\bchallenge/i, /\btransition/i,
  /\btrend/i, /\bviral/i, /\breels?\b/i, /\bshorts?\b/i,
  /\btiktok/i, /\bhook\b/i, /\bscroll/i,
];

// ── Main computation ─────────────────────────────────────────────────────────

export function computeDiscoveryDemand(
  idea: string,
  niche: string,
  marketType: MarketType
): number {
  const lowerIdea = idea.toLowerCase();
  const lowerNiche = niche.toLowerCase().trim();

  // 1. Start with niche base score
  let base = NICHE_DISCOVERY_BASE[lowerNiche] ?? 50;

  // Check partial niche matches
  if (base === 50) {
    for (const [key, score] of Object.entries(NICHE_DISCOVERY_BASE)) {
      if (lowerNiche.includes(key) || key.includes(lowerNiche)) {
        base = score;
        break;
      }
    }
  }

  // 2. Add content signal bonuses
  let bonus = 0;

  let visualHits = 0;
  for (const p of VISUAL_APPEAL_PATTERNS) if (p.test(lowerIdea)) visualHits++;
  bonus += Math.min(3, visualHits) * 4; // max +12

  let saveHits = 0;
  for (const p of SAVE_SHARE_PATTERNS) if (p.test(lowerIdea)) saveHits++;
  bonus += Math.min(3, saveHits) * 3; // max +9

  let emotionHits = 0;
  for (const p of EMOTIONAL_TRIGGER_PATTERNS) if (p.test(lowerIdea)) emotionHits++;
  bonus += Math.min(3, emotionHits) * 3; // max +9

  let evergreenHits = 0;
  for (const p of EVERGREEN_PATTERNS) if (p.test(lowerIdea)) evergreenHits++;
  bonus += Math.min(3, evergreenHits) * 2; // max +6

  let reelNativeHits = 0;
  for (const p of REEL_NATIVE_PATTERNS) if (p.test(lowerIdea)) reelNativeHits++;
  bonus += Math.min(3, reelNativeHits) * 3; // max +9

  // 3. Market type adjustment
  // Feed-driven markets get a floor boost; search-driven get a ceiling cap
  let marketAdjust = 0;
  switch (marketType) {
    case "feed_driven":
      marketAdjust = 8; // floor boost
      break;
    case "hybrid":
      marketAdjust = 3;
      break;
    case "search_driven":
      marketAdjust = -5; // slight penalty — search topics are less feed-native
      break;
    case "trend_driven":
      marketAdjust = 5; // trends spread through feeds
      break;
    case "authority_driven":
      marketAdjust = 4; // authority content works well in feeds
      break;
  }

  const raw = base + bonus + marketAdjust;
  return Math.max(0, Math.min(100, Math.round(raw)));
}
