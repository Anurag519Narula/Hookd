export interface TopVideo {
  title: string;
  videoId: string;
  viewCount: string;
  channelName: string;
}

export type PlatformTier = "Excellent" | "Strong" | "Moderate" | "Low";

export interface PlatformScore {
  platform: string;
  tier: PlatformTier;
  reason: string;
}

export interface ClarityQuestion {
  question: string;
  options: string[];
}

export interface InsightReport {
  // ── Trend validation ──────────────────────────────────────────────────────
  trendDirection: "rising" | "peaked" | "declining" | "stable";
  trendScore: number; // 0-100
  trendVelocity: "accelerating" | "steady" | "slowing" | "unknown";
  competitionLevel: "low" | "medium" | "high";
  saturationWarning: boolean; // true if the niche is oversaturated

  // ── Audience & timing ─────────────────────────────────────────────────────
  audienceFit: {
    score: number; // 0-100
    primaryAudience: string; // e.g. "25-34 year old fitness enthusiasts"
    audienceIntent: "entertainment" | "education" | "inspiration" | "problem-solving";
    bestPostingTimes: string[]; // e.g. ["7-9am", "6-9pm"]
    bestDays: string[]; // e.g. ["Tuesday", "Thursday"]
  };

  // ── Content opportunity ───────────────────────────────────────────────────
  summary: string; // 2-3 sentence executive summary
  opportunityScore: number; // 0-100 composite score
  topAngles: Array<{
    angle: string;
    why: string;
    estimatedReach: "low" | "medium" | "high";
    difficulty: "easy" | "medium" | "hard";
  }>;
  untappedAngles: Array<{
    angle: string;
    opportunity: string;
    whyNobodyIsDoing: string;
  }>;

  // ── Platform-specific data ────────────────────────────────────────────────
  platformAnalysis: Array<{
    platform: string;
    potential: "low" | "medium" | "high";
    avgViewsForTopic: string; // e.g. "50K-200K"
    contentStyle: string; // what works on this platform for this topic
    hashtagStrategy: string;
  }>;

  // ── YouTube & Instagram data (real numbers) ────────────────────────────────
  youtubeData: {
    topVideoViews: number; // highest view count found
    avgTopVideoViews: number; // average of top 5
    totalVideosFound: number;
    viewsRange: string; // e.g. "12K - 2.4M"
    topChannels: string[]; // channel names doing well
    commonTitles: string[]; // title patterns that work
  } | null;

  // ── Content blueprint (replaces full script) ──────────────────────────────
  contentBlueprint: {
    openingHook: string; // what the first 3 seconds must establish
    coreMessage: string; // the one thing the video must communicate
    keyPoints: Array<{
      point: string; // what to cover
      why: string; // why this point matters to the audience
      deliveryTip: string; // how to deliver it (tone, pacing, visual)
      timestamp: string; // approximate timing e.g. "0:05-0:15"
    }>;
    closingCTA: string; // what action to drive
    visualNotes: string; // b-roll, text overlays, transitions to consider
    audioNotes: string; // music mood, voiceover style, sound effects
    durationTarget: string; // e.g. "45-55 seconds"
  };

  // ── Competitive intelligence ──────────────────────────────────────────────
  competitorInsights: Array<{
    observation: string; // what competitors are doing
    gap: string; // what they're missing
  }>;

  // ── Risk & recommendation ─────────────────────────────────────────────────
  risks: string[]; // things that could make this content flop
  recommendations: string[]; // specific actionable steps before filming
  keyInsight: string; // the single most important thing to know
  verdictLabel: "Strong opportunity" | "Good opportunity" | "Proceed with caution" | "Avoid for now";
  verdictReason: string;

  // ── New fields for Research Panel & Platform Scorecard ─────────────────────
  topVideos: TopVideo[];
  platform_scores: PlatformScore[];
}
