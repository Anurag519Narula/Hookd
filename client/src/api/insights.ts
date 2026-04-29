import type { InsightReport } from "../types/insights";
import { authHeaders } from "./auth";

export interface InstagramSignals {
  reelPotential: { score: number; label: "High" | "Medium" | "Low" };
  hookStrength: { score: number; label: "Strong" | "Moderate" | "Weak" };
  saveability: { score: number; label: "High" | "Medium" | "Low" };
  saturation: { score: number; label: "High" | "Medium" | "Low" };
  bestFormat: string;
  captionStyle: string;
  hookIdeas: string[];
  hashtagPack: string[];
}

export interface MarketContext {
  type: "search_driven" | "feed_driven" | "hybrid" | "trend_driven" | "authority_driven";
  label: string;
  description: string;
  discoveryDemand: number;
}

export interface InsightResponse {
  report: InsightReport;
  instagram?: InstagramSignals;
  marketContext?: MarketContext;
  signals?: {
    trend: {
      direction: string;
      velocity: string;
      score: number;
      explanation: string;
    };
    competition: {
      level: string;
      totalVideos: number;
      uniqueChannels: number;
      explanation: string;
    };
    momentum: {
      recentWinners: number;
      uploadFrequency: number;
      medianViewsPerDay: number;
    };
    opportunity: {
      score: number;
      explanation: string;
    };
    audienceFit: {
      score: number;
      explanation: string;
    };
    evidence: {
      topVideoViews: number;
      avgTopVideoViews: number;
      viewsRange: string;
      topChannels: string[];
      recentVideoCount: number;
      olderVideoCount: number;
    };
    googleTrends: {
      available: boolean;
      interest: number | null;
      avgInterest: number | null;
      peakInterest: number | null;
      direction: string | null;
      relatedQueries: string[];
      risingQueries: string[];
    };
  };
  googleTrends?: {
    interest: number;
    avgInterest: number | null;
    peakInterest: number | null;
    timeline: Array<{ date: string; value: number }>;
    risingQueries: string[];
    topQueries: string[];
    relatedQueries: string[];
  } | null;
  trendingNow?: Array<{
    query: string;
    searchVolume: number;
    increasePercentage: number;
    categories: string[];
  }> | null;
  sources: {
    youtubeCount: number;
    trendsAvailable: boolean;
    trendScore: number | null;
    relatedQueries: string[];
  };
  cached: boolean;
  remaining?: number;
  limit?: number;
}

// Thrown when the user has hit their daily validation limit
export class QuotaExceededError extends Error {
  constructor(public readonly serverMessage: string) {
    super(serverMessage);
    this.name = "QuotaExceededError";
  }
}

export async function fetchInsights(idea: string, niche: string, ideaId?: string): Promise<InsightResponse> {
  const params = new URLSearchParams({ idea, niche });
  if (ideaId) params.set("ideaId", ideaId);
  const res = await fetch(`/api/insights?${params.toString()}`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    if (res.status === 429) {
      throw new QuotaExceededError(err.error ?? "Daily limit reached.");
    }
    throw new Error(err.error ?? "Failed to fetch insights");
  }
  return res.json() as Promise<InsightResponse>;
}
