import type { InsightReport } from "../types/insights";
import { authHeaders } from "./auth";

export interface InsightResponse {
  report: InsightReport;
  sources: {
    youtubeCount: number;
    redditCount: number;
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
