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
}

export async function fetchInsights(idea: string, niche: string, ideaId?: string): Promise<InsightResponse> {
  const params = new URLSearchParams({ idea, niche });
  if (ideaId) params.set("ideaId", ideaId);
  const res = await fetch(`/api/insights?${params.toString()}`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Failed to fetch insights");
  }
  const data = await res.json() as InsightResponse;
  if (data.cached) {
    console.log("💾 Cache hit: Server returned cached insights for idea", ideaId);
  } else {
    console.log("🔄 Cache miss: Generated fresh insights for idea", ideaId);
  }
  return data;
}
