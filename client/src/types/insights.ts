export interface InsightReport {
  trendDirection: "rising" | "peaked" | "declining" | "stable";
  trendScore: number;
  competitionLevel: "low" | "medium" | "high";
  summary: string;
  topAngles: Array<{ angle: string; why: string }>;
  untappedAngles: Array<{ angle: string; opportunity: string }>;
  recommendedFormat: string;
  bestPlatforms: string[];
  hookSuggestions: string[];
  keyInsight: string;
}
