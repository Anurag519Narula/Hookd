/**
 * Computed Signals Engine
 *
 * Pure math from real API data. No LLM involved.
 * These replace the previously LLM-hallucinated trend scores, competition levels, etc.
 */

import type { YouTubeResult, TrendData } from "./insights";
import type { MarketType } from "./marketClassifier";
import { getWeights, computeMarketAwareOpportunity, getCompetitionContext } from "./scoringWeights";

// ── Types ──────────────────────────────────────────────────────────────────────

export type TrendDirection = "rising" | "peaked" | "declining" | "stable";
export type TrendVelocity = "high" | "medium" | "low" | "unknown";
export type CompetitionLevel = "low" | "medium" | "high";

export interface ComputedSignals {
  trend: {
    direction: TrendDirection;
    velocity: TrendVelocity;
    score: number; // 0–100, computed not guessed
    explanation: string; // human-readable reason
  };
  competition: {
    level: CompetitionLevel;
    totalVideos: number;
    uniqueChannels: number;
    explanation: string;
  };
  momentum: {
    recentWinners: number; // videos < 6 months with above-avg views
    uploadFrequency: number; // videos in last 6 months
    medianViewsPerDay: number;
  };
  opportunity: {
    score: number; // 0–100, computed
    explanation: string;
  };
  audienceFit: {
    score: number; // 0–100, computed
    explanation: string;
  };
  evidence: {
    topVideoViews: number;
    avgTopVideoViews: number;
    viewsRange: string;
    topChannels: string[];
    recentVideoCount: number; // within 6 months
    olderVideoCount: number;
  };
  googleTrends: {
    available: boolean;
    interest: number | null;
    avgInterest: number | null;
    peakInterest: number | null;
    direction: TrendDirection | null;
    relatedQueries: string[];
    risingQueries: string[];
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function daysSince(dateStr: string): number {
  const published = new Date(dateStr);
  if (isNaN(published.getTime())) return 999;
  return Math.max(0, Math.floor((Date.now() - published.getTime()) / (1000 * 60 * 60 * 24)));
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ── Core computation ───────────────────────────────────────────────────────────

export function computeSignals(
  youtubeResults: YouTubeResult[],
  trendData: TrendData | null,
  marketType: MarketType = "hybrid",
  discoveryDemand: number = 50
): ComputedSignals {
  const hasYouTube = youtubeResults.length > 0;

  // Parse view counts
  const videos = youtubeResults.map((v) => ({
    views: parseInt(v.viewCount) || 0,
    days: daysSince(v.publishedAt),
    channel: v.channelTitle,
    viewsPerDay: (parseInt(v.viewCount) || 0) / Math.max(1, daysSince(v.publishedAt)),
  }));

  // Split into recent (< 180 days / 6 months) and older
  const recent = videos.filter((v) => v.days <= 180);
  const older = videos.filter((v) => v.days > 180);

  const allViews = videos.map((v) => v.views);
  const topViews = hasYouTube ? Math.max(...allViews) : 0;
  const avgViews = hasYouTube
    ? Math.round(allViews.slice(0, 5).reduce((s, v) => s + v, 0) / Math.min(5, allViews.length))
    : 0;
  const minViews = hasYouTube ? Math.min(...allViews) : 0;

  // ── Trend Direction ──────────────────────────────────────────────────────
  // If recent videos outperform older → Rising
  // If only old videos dominate → Declining
  // If mixed → Stable
  let direction: TrendDirection = "stable";
  let directionExplanation = "";

  if (hasYouTube && recent.length > 0 && older.length > 0) {
    const recentAvgViews = recent.reduce((s, v) => s + v.views, 0) / recent.length;
    const olderAvgViews = older.reduce((s, v) => s + v.views, 0) / older.length;
    const ratio = recentAvgViews / Math.max(1, olderAvgViews);

    if (ratio > 1.3) {
      direction = "rising";
      directionExplanation = `Recent videos (last 6 months) average ${formatNum(recentAvgViews)} views vs ${formatNum(olderAvgViews)} for older content — growing interest.`;
    } else if (ratio < 0.5) {
      direction = "declining";
      directionExplanation = `Older videos significantly outperform recent uploads (${formatNum(olderAvgViews)} vs ${formatNum(recentAvgViews)} avg views) — interest may be fading.`;
    } else if (ratio < 0.8) {
      direction = "peaked";
      directionExplanation = `Recent content underperforms older videos slightly — topic may have peaked.`;
    } else {
      direction = "stable";
      directionExplanation = `Recent and older videos perform similarly — steady, consistent interest.`;
    }
  } else if (hasYouTube && recent.length > 0 && older.length === 0) {
    direction = "rising";
    directionExplanation = `All ${recent.length} found videos are from the last 6 months — fresh, active topic.`;
  } else if (hasYouTube && recent.length === 0 && older.length > 0) {
    direction = "declining";
    directionExplanation = `No recent uploads found — all content is older than 6 months. Interest may have faded.`;
  } else {
    directionExplanation = "Not enough data to determine trend direction.";
  }

  // Override with Google Trends if available and significant
  // Strength of override depends on market type — feed-driven niches barely care about search
  const weights = getWeights(marketType);
  if (trendData && trendData.interest > 0) {
    if (trendData.interest >= 70 && direction !== "rising") {
      direction = "rising";
      directionExplanation += ` Google Trends shows ${trendData.interest}/100 interest — confirming strong demand.`;
    } else if (trendData.interest < 15 && direction === "rising" && weights.trendOverrideStrength > 0.5) {
      // Only downgrade from "rising" if Google Trends is a strong signal for this market type
      // AND YouTube data was borderline
      if (recent.length <= 2) {
        direction = "stable";
        directionExplanation += ` Google Trends shows only ${trendData.interest}/100 interest — tempering the rising signal.`;
      }
    }
    // For feed-driven niches: never downgrade based on low Google Trends
    // People don't Google "skincare habits" — they discover it in feeds
  }

  // ── Trend Velocity ───────────────────────────────────────────────────────
  // Median views/day across all videos
  const allViewsPerDay = videos.map((v) => v.viewsPerDay);
  const medianVPD = Math.round(median(allViewsPerDay));

  let velocity: TrendVelocity = "unknown";
  if (hasYouTube) {
    if (medianVPD >= 5000) velocity = "high";
    else if (medianVPD >= 500) velocity = "medium";
    else velocity = "low";
  }

  // ── Trend Score (0–100) ──────────────────────────────────────────────────
  // 40% recency strength + 40% median views/day + 20% upload frequency
  let trendScore = 0;
  if (hasYouTube) {
    // Recency: what % of videos are recent
    const recencyRatio = recent.length / Math.max(1, videos.length);
    const recencyScore = Math.min(100, recencyRatio * 100 * 1.5); // boost so 50% recent = 75

    // Views/day score: log scale
    const vpdScore = Math.min(100, (Math.log10(Math.max(1, medianVPD)) / 5) * 100);

    // Upload frequency: videos per 6 months
    const uploadFreq = recent.length; // already filtered to 180 days
    const freqScore = Math.min(100, uploadFreq * 15); // 7+ recent = 100

    trendScore = Math.round(recencyScore * 0.4 + vpdScore * 0.4 + freqScore * 0.2);

    // Boost with Google Trends if available and meaningful
    // Blend strength depends on market type
    const trendBlendThreshold = marketType === "feed_driven" ? 30 : 15;
    if (trendData && trendData.interest >= trendBlendThreshold) {
      const blendFactor = weights.trendOverrideStrength;
      trendScore = Math.round(trendScore * (1 - blendFactor * 0.3) + trendData.interest * (blendFactor * 0.3));
    }

    trendScore = Math.max(0, Math.min(100, trendScore));
  }

  // ── Competition Level ────────────────────────────────────────────────────
  const uniqueChannels = new Set(videos.map((v) => v.channel)).size;
  const totalVideos = videos.length;

  let competitionLevel: CompetitionLevel = "low";
  let competitionExplanation = "";

  if (hasYouTube) {
    // High: many videos + many channels + no single dominant channel
    // Medium: moderate videos or few channels dominate
    // Low: few videos found
    const channelViews = new Map<string, number>();
    for (const v of videos) {
      channelViews.set(v.channel, (channelViews.get(v.channel) ?? 0) + v.views);
    }
    const topChannelViews = Math.max(...channelViews.values());
    const totalViewsSum = videos.reduce((s, v) => s + v.views, 0);
    const dominanceRatio = topChannelViews / Math.max(1, totalViewsSum);

    if (totalVideos >= 8 && uniqueChannels >= 5 && dominanceRatio < 0.4) {
      competitionLevel = "high";
      const feedContext = getCompetitionContext("high", marketType);
      competitionExplanation = feedContext || `${totalVideos} videos across ${uniqueChannels} channels with no single dominant creator — crowded space.`;
    } else if (totalVideos >= 4 || uniqueChannels >= 3) {
      competitionLevel = "medium";
      const feedContext = getCompetitionContext("medium", marketType);
      competitionExplanation = feedContext || `${totalVideos} videos from ${uniqueChannels} channels — moderate competition with room to differentiate.`;
    } else {
      competitionLevel = "low";
      competitionExplanation = `Only ${totalVideos} videos from ${uniqueChannels} channels — underserved topic with opportunity.`;
    }
  } else {
    competitionExplanation = "No YouTube data available to assess competition.";
  }

  // ── Momentum ─────────────────────────────────────────────────────────────
  const recentWinners = recent.filter((v) => v.views > avgViews).length;
  const uploadFrequency = recent.length;

  // ── Opportunity Score (0–100) — Market-Aware ──────────────────────────────
  let opportunityScore = 0;
  let opportunityExplanation = "";
  if (hasYouTube) {
    const viewsStrength = Math.min(100, (Math.log10(Math.max(1, avgViews)) / 6) * 100);
    const momentumScore = recent.length > 0
      ? Math.min(100, (recentWinners / recent.length) * 100 * 1.5)
      : 0;

    const result = computeMarketAwareOpportunity({
      marketType,
      searchInterest: trendData?.interest ?? 0,
      discoveryDemand,
      trendScore,
      competitionLevel,
      viewsStrength,
      momentumScore,
      audienceFitScore: 50, // placeholder — will be computed below and re-applied
    });

    opportunityScore = result.score;
    opportunityExplanation = result.explanation;
  } else {
    opportunityExplanation = "Not enough data to compute opportunity score.";
  }

  // ── Audience Fit Score (0–100) ───────────────────────────────────────────
  // Based on: view engagement (views vs likes ratio from data), channel diversity,
  // and whether the topic has proven audience demand
  let audienceFitScore = 0;
  let audienceFitExplanation = "";
  if (hasYouTube) {
    // Demand signal: do videos on this topic get views?
    const demandScore = Math.min(100, (Math.log10(Math.max(1, avgViews)) / 6) * 100);

    // Diversity: multiple channels = broader audience interest (not just one creator's fans)
    const diversityScore = Math.min(100, uniqueChannels * 20); // 5+ channels = 100

    // Consistency: are views distributed or concentrated?
    const viewSpread = topViews > 0 ? (avgViews / topViews) : 0; // closer to 1 = more consistent
    const consistencyScore = Math.min(100, viewSpread * 150);

    audienceFitScore = Math.round(
      demandScore * 0.45 +
      diversityScore * 0.30 +
      consistencyScore * 0.25
    );

    // Boost with Google Trends if meaningful and market type warrants it
    const audienceBlendThreshold = marketType === "feed_driven" ? 30 : 15;
    if (trendData && trendData.interest >= audienceBlendThreshold) {
      const blendStrength = weights.trendOverrideStrength * 0.2;
      audienceFitScore = Math.round(audienceFitScore * (1 - blendStrength) + trendData.interest * blendStrength);
    }

    // For feed-driven niches, boost audience fit with discovery demand
    if (marketType === "feed_driven" && discoveryDemand >= 60) {
      audienceFitScore = Math.round(audienceFitScore * 0.8 + discoveryDemand * 0.2);
    }

    audienceFitScore = Math.max(0, Math.min(100, audienceFitScore));

    audienceFitExplanation = `${uniqueChannels} channels cover this topic with avg ${formatNum(avgViews)} views. ${viewSpread > 0.3 ? "Views are well-distributed — broad audience interest." : "Views are concentrated in top videos — niche but engaged audience."}`;

    // Re-compute opportunity with real audience fit score (was placeholder above)
    if (opportunityScore > 0) {
      const viewsStrength = Math.min(100, (Math.log10(Math.max(1, avgViews)) / 6) * 100);
      const momentumScore = recent.length > 0
        ? Math.min(100, (recentWinners / recent.length) * 100 * 1.5)
        : 0;
      const finalOpp = computeMarketAwareOpportunity({
        marketType,
        searchInterest: trendData?.interest ?? 0,
        discoveryDemand,
        trendScore,
        competitionLevel,
        viewsStrength,
        momentumScore,
        audienceFitScore,
      });
      opportunityScore = finalOpp.score;
      opportunityExplanation = finalOpp.explanation;
    }
  } else {
    audienceFitExplanation = "Not enough data to compute audience fit.";
  }

  // ── Google Trends ────────────────────────────────────────────────────────
  let googleDirection: TrendDirection | null = null;
  if (trendData && trendData.interest > 0) {
    if (trendData.interest >= 70) googleDirection = "rising";
    else if (trendData.interest >= 40) googleDirection = "stable";
    else if (trendData.interest >= 15) googleDirection = "peaked";
    else googleDirection = "stable"; // Very low interest = insufficient signal, not "declining"
  }

  return {
    trend: {
      direction,
      velocity,
      score: trendScore,
      explanation: directionExplanation,
    },
    competition: {
      level: competitionLevel,
      totalVideos,
      uniqueChannels,
      explanation: competitionExplanation,
    },
    momentum: {
      recentWinners,
      uploadFrequency,
      medianViewsPerDay: medianVPD,
    },
    opportunity: {
      score: opportunityScore,
      explanation: opportunityExplanation,
    },
    audienceFit: {
      score: audienceFitScore,
      explanation: audienceFitExplanation,
    },
    evidence: {
      topVideoViews: topViews,
      avgTopVideoViews: avgViews,
      viewsRange: hasYouTube ? `${formatNum(minViews)} – ${formatNum(topViews)}` : "N/A",
      topChannels: [...new Set(videos.map((v) => v.channel))].slice(0, 5),
      recentVideoCount: recent.length,  // within 6 months
      olderVideoCount: older.length,     // older than 6 months
    },
    googleTrends: {
      available: trendData !== null && (trendData.interest > 0 || (trendData.timeline?.length ?? 0) > 0),
      interest: trendData?.interest ?? null,
      avgInterest: trendData?.avgInterest ?? null,
      peakInterest: trendData?.peakInterest ?? null,
      direction: googleDirection,
      relatedQueries: trendData?.relatedQueries ?? [],
      risingQueries: trendData?.risingQueries ?? [],
    },
  };
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}
