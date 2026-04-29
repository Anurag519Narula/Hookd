/**
 * Market Type Classifier
 *
 * Lightweight, deterministic classification of content ideas into market types.
 * No LLM call — uses niche maps + keyword pattern matching.
 * Runs instantly before scoring to determine how signals should be weighted.
 */

export type MarketType =
  | "search_driven"
  | "feed_driven"
  | "hybrid"
  | "trend_driven"
  | "authority_driven";

// ── Niche → default market type map ──────────────────────────────────────────
// These are the dominant discovery patterns for each niche.
// Individual ideas can override via keyword matching.

const NICHE_MAP: Record<string, MarketType> = {
  // Feed-driven: discovered passively in reels/feed, not searched
  skincare: "feed_driven",
  beauty: "feed_driven",
  fashion: "feed_driven",
  lifestyle: "feed_driven",
  fitness: "feed_driven",
  food: "feed_driven",
  cooking: "feed_driven",
  travel: "feed_driven",
  photography: "feed_driven",
  art: "feed_driven",
  diy: "feed_driven",
  gardening: "feed_driven",
  pets: "feed_driven",
  parenting: "feed_driven",
  wellness: "feed_driven",
  comedy: "feed_driven",
  entertainment: "feed_driven",
  music: "feed_driven",
  dance: "feed_driven",
  relationships: "feed_driven",
  "home decor": "feed_driven",
  "self care": "feed_driven",
  "glow up": "feed_driven",

  // Search-driven: people intentionally search for solutions
  tech: "search_driven",
  coding: "search_driven",
  programming: "search_driven",
  education: "search_driven",
  realestate: "search_driven",
  "real estate": "search_driven",
  legal: "search_driven",
  medical: "search_driven",
  science: "search_driven",
  engineering: "search_driven",

  // Hybrid: both search + feed discovery
  finance: "hybrid",
  "personal finance": "hybrid",
  investing: "hybrid",
  crypto: "hybrid",
  business: "hybrid",
  marketing: "hybrid",
  productivity: "hybrid",
  health: "hybrid",
  "mental health": "hybrid",
  sustainability: "hybrid",
  sports: "hybrid",
  gaming: "hybrid",

  // Authority-driven: creator personality matters most
  motivation: "authority_driven",
  mindset: "authority_driven",
  "self improvement": "authority_driven",
  leadership: "authority_driven",
  spirituality: "authority_driven",
  coaching: "authority_driven",
};

// ── Keyword patterns that override niche defaults ────────────────────────────

const SEARCH_KEYWORDS = [
  /\bhow to\b/i, /\btutorial\b/i, /\bstep.?by.?step\b/i, /\bguide\b/i,
  /\bbest\s+(app|tool|software|product|card|fund|sip|bank)/i,
  /\bvs\b/i, /\bcompar/i, /\breview\b/i, /\bprocess\b/i,
  /\bfix\b/i, /\bsolve\b/i, /\bsetup\b/i, /\binstall\b/i,
  /\bapply\b/i, /\bregistr/i, /\bexam\b/i, /\bsyllabus\b/i,
];

const FEED_KEYWORDS = [
  /\bhabits?\b/i, /\broutine\b/i, /\bglow/i, /\baesthetic/i,
  /\boutfit/i, /\bstyle\b/i, /\blook\b/i, /\bvibes?\b/i,
  /\binspo\b/i, /\binspiration\b/i, /\bday\s+in/i, /\bgrwm\b/i,
  /\bget\s+ready/i, /\bmorning\b/i, /\bnight\b/i, /\bskincare\b/i,
  /\bmakeup\b/i, /\bhair\b/i, /\bnails?\b/i, /\brecipe\b/i,
  /\bworkout\b/i, /\bfitness\b/i, /\bgym\b/i, /\byoga\b/i,
  /\broom\s*(decor|tour|makeover)/i, /\bwardrobe\b/i,
  /\brelationship/i, /\bdating\b/i, /\bcouple\b/i,
  /\bfood\b/i, /\bcooking\b/i, /\bmeal\b/i,
  /\bpet\b/i, /\bdog\b/i, /\bcat\b/i,
  /\btravel\b/i, /\bvlog\b/i, /\bexplor/i,
];

const TREND_KEYWORDS = [
  /\btrending\b/i, /\bviral\b/i, /\bipl\b/i, /\bcricket\b/i,
  /\belection\b/i, /\bnews\b/i, /\bbreaking\b/i,
  /\bcelebrit/i, /\bbollywood\b/i, /\bmovie\b/i,
  /\bmeme\b/i, /\bchallenge\b/i, /\bdrama\b/i,
  /\bcontroversy\b/i, /\bscandal\b/i,
];

const AUTHORITY_KEYWORDS = [
  /\bmindset\b/i, /\blesson/i, /\bstory\s*time/i,
  /\bmy\s+(journey|experience|story|lesson)/i,
  /\bfounder\b/i, /\bceo\b/i, /\bmentor\b/i,
  /\badvice\b/i, /\bwisdom\b/i, /\bphilosophy\b/i,
];

// ── Main classifier ──────────────────────────────────────────────────────────

export function classifyMarket(idea: string, niche: string): MarketType {
  const lowerIdea = idea.toLowerCase();
  const lowerNiche = niche.toLowerCase().trim();

  // 1. Count keyword hits for each type
  let searchHits = 0;
  let feedHits = 0;
  let trendHits = 0;
  let authorityHits = 0;

  for (const p of SEARCH_KEYWORDS) if (p.test(lowerIdea)) searchHits++;
  for (const p of FEED_KEYWORDS) if (p.test(lowerIdea)) feedHits++;
  for (const p of TREND_KEYWORDS) if (p.test(lowerIdea)) trendHits++;
  for (const p of AUTHORITY_KEYWORDS) if (p.test(lowerIdea)) authorityHits++;

  // 2. Strong keyword signal overrides niche default
  if (trendHits >= 2) return "trend_driven";
  if (searchHits >= 2 && feedHits === 0) return "search_driven";
  if (feedHits >= 3 && searchHits === 0) return "feed_driven";
  if (authorityHits >= 2) return "authority_driven";

  // 3. Mixed signals → hybrid
  if (searchHits >= 1 && feedHits >= 1) return "hybrid";

  // 4. Fall back to niche map
  const nicheType = NICHE_MAP[lowerNiche];
  if (nicheType) return nicheType;

  // 5. Check partial niche matches (e.g., "Fashion & Beauty" contains "fashion")
  for (const [key, type] of Object.entries(NICHE_MAP)) {
    if (lowerNiche.includes(key) || key.includes(lowerNiche)) return type;
  }

  // 6. Default fallback: hybrid (safest)
  return "hybrid";
}

// ── Human-readable labels ────────────────────────────────────────────────────

export const MARKET_TYPE_LABELS: Record<MarketType, string> = {
  search_driven: "Search-Driven Market",
  feed_driven: "Feed-Driven Market",
  hybrid: "Hybrid Market",
  trend_driven: "Trend-Driven Market",
  authority_driven: "Authority-Driven Market",
};

export const MARKET_TYPE_DESCRIPTIONS: Record<MarketType, string> = {
  search_driven: "People actively search for this topic. Google Trends and YouTube search data are strong indicators.",
  feed_driven: "People discover this through feeds and reels, not search. Creator packaging and hooks matter most.",
  hybrid: "Mix of search intent and feed discovery. Both search data and creator signals are relevant.",
  trend_driven: "Momentum-based topic. Speed and timing matter more than evergreen demand.",
  authority_driven: "Creator personality and trust drive engagement. Audience follows the person, not just the topic.",
};
