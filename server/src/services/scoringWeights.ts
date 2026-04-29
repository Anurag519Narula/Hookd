/**
 * Market-Aware Scoring Weights
 *
 * Adjusts how opportunity, trend, competition, and audience fit scores
 * are computed based on the market type. Feed-driven niches weight
 * discovery demand heavily; search-driven niches weight search signals.
 *
 * Also adjusts competition interpretation: high competition in feed-driven
 * niches means "validated demand" not "avoid".
 */

import type { MarketType } from "./marketClassifier";

// ── Weight profiles per market type ──────────────────────────────────────────

export interface ScoringWeights {
  // Opportunity score weights (must sum to 1.0)
  searchDemand: number;      // Google Trends interest weight
  discoveryDemand: number;   // Feed discovery potential weight
  competitionAdj: number;    // Competition-adjusted weight
  audienceFit: number;       // Audience fit weight

  // Competition interpretation
  competitionPenaltyFactor: number; // 0–1: how much high competition hurts (lower = less penalty)

  // Google Trends influence
  trendOverrideStrength: number; // 0–1: how much Google Trends can override YouTube signals
}

const WEIGHT_PROFILES: Record<MarketType, ScoringWeights> = {
  search_driven: {
    searchDemand: 0.50,
    discoveryDemand: 0.15,
    competitionAdj: 0.25,
    audienceFit: 0.10,
    competitionPenaltyFactor: 1.0,   // full penalty — search niches are winner-take-all
    trendOverrideStrength: 0.9,       // Google Trends is very relevant
  },
  feed_driven: {
    searchDemand: 0.10,
    discoveryDemand: 0.50,
    competitionAdj: 0.25,
    audienceFit: 0.15,
    competitionPenaltyFactor: 0.4,   // low penalty — competition = validated demand
    trendOverrideStrength: 0.15,      // Google Trends barely matters
  },
  hybrid: {
    searchDemand: 0.30,
    discoveryDemand: 0.30,
    competitionAdj: 0.25,
    audienceFit: 0.15,
    competitionPenaltyFactor: 0.7,
    trendOverrideStrength: 0.5,
  },
  trend_driven: {
    searchDemand: 0.15,
    discoveryDemand: 0.25,
    competitionAdj: 0.20,
    audienceFit: 0.10,
    competitionPenaltyFactor: 0.5,
    trendOverrideStrength: 0.6,
    // Note: remaining 0.30 is momentum (handled in computeSignals)
  },
  authority_driven: {
    searchDemand: 0.15,
    discoveryDemand: 0.35,
    competitionAdj: 0.25,
    audienceFit: 0.25,
    competitionPenaltyFactor: 0.5,   // competition matters less — audience follows the person
    trendOverrideStrength: 0.3,
  },
};

export function getWeights(marketType: MarketType): ScoringWeights {
  return WEIGHT_PROFILES[marketType];
}

// ── Market-aware opportunity score ───────────────────────────────────────────

export function computeMarketAwareOpportunity(params: {
  marketType: MarketType;
  searchInterest: number;       // Google Trends interest (0–100)
  discoveryDemand: number;      // Feed discovery score (0–100)
  trendScore: number;           // YouTube-derived trend score (0–100)
  competitionLevel: "low" | "medium" | "high";
  viewsStrength: number;        // Log-scale avg views (0–100)
  momentumScore: number;        // Recent winners ratio (0–100)
  audienceFitScore: number;     // Audience fit (0–100)
}): { score: number; explanation: string } {
  const {
    marketType, searchInterest, discoveryDemand, trendScore,
    competitionLevel, viewsStrength, momentumScore, audienceFitScore,
  } = params;

  const w = getWeights(marketType);

  // Competition score: adjusted by market type
  // In feed-driven niches, high competition is less punishing
  const rawCompScore = competitionLevel === "low" ? 90 : competitionLevel === "medium" ? 60 : 30;
  const competitionScore = rawCompScore + (1 - w.competitionPenaltyFactor) * (100 - rawCompScore) * 0.5;

  // Search demand: blend of Google Trends interest and trend score
  const searchSignal = searchInterest > 0
    ? Math.round(searchInterest * 0.6 + trendScore * 0.4)
    : trendScore;

  // Compute weighted opportunity
  let score = Math.round(
    searchSignal * w.searchDemand +
    discoveryDemand * w.discoveryDemand +
    competitionScore * w.competitionAdj +
    audienceFitScore * w.audienceFit
  );

  // For trend-driven, add momentum bonus
  if (marketType === "trend_driven") {
    score = Math.round(score * 0.70 + momentumScore * 0.30);
  }

  // Views strength bonus (universal — real views prove real demand)
  if (viewsStrength > 60) {
    score = Math.round(score * 0.85 + viewsStrength * 0.15);
  }

  score = Math.max(0, Math.min(100, score));

  // Build explanation
  const parts: string[] = [];
  if (discoveryDemand >= 70) parts.push("strong feed discovery potential");
  else if (discoveryDemand >= 45) parts.push("moderate feed discovery potential");

  if (searchInterest >= 40) parts.push("solid search demand");
  else if (searchInterest >= 15) parts.push("some search interest");
  else if (marketType === "feed_driven") parts.push("low search volume (normal for feed-driven niches)");

  if (competitionLevel === "high" && marketType === "feed_driven") {
    parts.push("competitive but healthy — validated creator demand");
  } else if (competitionLevel === "low") {
    parts.push("low competition");
  } else if (competitionLevel === "medium") {
    parts.push("moderate competition");
  } else {
    parts.push("high competition");
  }

  const explanation = parts.length > 0
    ? `Score based on ${parts.join(", ")}.`
    : "Score computed from available market signals.";

  return { score, explanation };
}

// ── Competition label for feed-driven niches ─────────────────────────────────

export function getCompetitionContext(
  competitionLevel: "low" | "medium" | "high",
  marketType: MarketType
): string {
  if (marketType === "feed_driven" && competitionLevel === "high") {
    return "Competitive but healthy — many creators validate demand in this space.";
  }
  if (marketType === "feed_driven" && competitionLevel === "medium") {
    return "Moderate competition — room to differentiate with unique packaging.";
  }
  return ""; // use default explanation
}
