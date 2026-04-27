import Groq from "groq-sdk";
import type { YouTubeResult, TrendData } from "../services/insights";
import { groqWithBackoff } from "../services/groqWithBackoff";
import type { TopVideo, PlatformScore } from "../types/index";
import type { ComputedSignals } from "../services/computedSignals";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" });

/**
 * Extract TopVideo[] from YouTubeResult[] — zero additional API calls.
 * Maps channelTitle → channelName, uses videoId from search response.
 */
export function extractTopVideos(youtubeResults: YouTubeResult[]): TopVideo[] {
  return youtubeResults
    .filter((r) => r.videoId && r.videoId.length > 0)
    .slice(0, 5)
    .map((r) => ({
      title: r.title,
      videoId: r.videoId!,
      viewCount: r.viewCount,
      channelName: r.channelTitle,
    }));
}

// Keep server-side type in sync with client/src/types/insights.ts
export interface InsightReport {
  trendDirection: "rising" | "peaked" | "declining" | "stable";
  trendScore: number;
  trendVelocity: "accelerating" | "steady" | "slowing" | "unknown";
  competitionLevel: "low" | "medium" | "high";
  saturationWarning: boolean;
  audienceFit: {
    score: number;
    primaryAudience: string;
    audienceIntent: "entertainment" | "education" | "inspiration" | "problem-solving";
    bestPostingTimes: string[];
    bestDays: string[];
  };
  summary: string;
  opportunityScore: number;
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
  platformAnalysis: Array<{
    platform: string;
    potential: "low" | "medium" | "high";
    avgViewsForTopic: string;
    contentStyle: string;
    hashtagStrategy: string;
  }>;
  youtubeData: {
    topVideoViews: number;
    avgTopVideoViews: number;
    totalVideosFound: number;
    viewsRange: string;
    topChannels: string[];
    commonTitles: string[];
  } | null;
  contentBlueprint: {
    openingHook: string;
    coreMessage: string;
    keyPoints: Array<{
      point: string;
      why: string;
      deliveryTip: string;
      timestamp: string;
    }>;
    closingCTA: string;
    visualNotes: string;
    audioNotes: string;
    durationTarget: string;
  };
  competitorInsights: Array<{
    observation: string;
    gap: string;
  }>;
  risks: string[];
  recommendations: string[];
  keyInsight: string;
  verdictLabel: "Strong opportunity" | "Good opportunity" | "Proceed with caution" | "Avoid for now";
  verdictReason: string;
  topVideos: TopVideo[];
  platform_scores: PlatformScore[];
}

export async function synthesizeInsights(params: {
  idea: string;
  niche: string;
  youtubeResults: YouTubeResult[];
  trendData: TrendData | null;
  signals: ComputedSignals;
}): Promise<InsightReport> {
  const { idea, niche, youtubeResults, trendData, signals } = params;

  // Build rich YouTube context with real numbers
  const hasYouTube = youtubeResults.length > 0;
  const topViews = signals.evidence.topVideoViews;
  const avgViews = signals.evidence.avgTopVideoViews;
  const minViews = hasYouTube ? Math.min(...youtubeResults.map((v) => parseInt(v.viewCount) || 0)) : 0;

  const youtubeContext = hasYouTube
    ? `REAL YOUTUBE DATA (${youtubeResults.length} videos found):
Top video views: ${topViews.toLocaleString()}
Average views (top 5): ${avgViews.toLocaleString()}
Views range: ${signals.evidence.viewsRange}

Top performing videos:
${youtubeResults
  .slice(0, 6)
  .map(
    (v, i) =>
      `${i + 1}. "${v.title}"
   Channel: ${v.channelTitle} | Views: ${parseInt(v.viewCount).toLocaleString()} | Likes: ${parseInt(v.likeCount).toLocaleString()}
   Published: ${v.publishedAt.slice(0, 10)}`
  )
  .join("\n\n")}`
    : "No YouTube data available for this topic.";

  const trendsContext = trendData
    ? `Google Trends data (India, last 12 months):
- Current interest: ${trendData.interest}/100
${trendData.avgInterest ? `- Average interest: ${trendData.avgInterest}/100` : ""}
${trendData.peakInterest ? `- Peak interest: ${trendData.peakInterest}/100` : ""}
${trendData.risingQueries && trendData.risingQueries.length > 0 ? `- Rising search queries (people are increasingly searching for these): ${trendData.risingQueries.join(", ")}` : ""}
${trendData.topQueries && trendData.topQueries.length > 0 ? `- Top related queries: ${trendData.topQueries.join(", ")}` : ""}
${trendData.relatedQueries.length > 0 ? `- Related searches: ${trendData.relatedQueries.slice(0, 8).join(", ")}` : ""}`
    : "No Google Trends data available.";

  // Pre-computed signals context — these are FACTS, not for the LLM to override
  const signalsContext = `
COMPUTED SIGNALS (these are mathematically computed from the data above — use them as-is, do NOT override):
- Trend Direction: ${signals.trend.direction} — ${signals.trend.explanation}
- Trend Velocity: ${signals.trend.velocity} (median ${signals.momentum.medianViewsPerDay.toLocaleString()} views/day)
- Trend Score: ${signals.trend.score}/100
- Competition: ${signals.competition.level} — ${signals.competition.explanation}
- Opportunity Score: ${signals.opportunity.score}/100 — ${signals.opportunity.explanation}
- Audience Fit Score: ${signals.audienceFit.score}/100 — ${signals.audienceFit.explanation}
- Recent videos (last 6 months): ${signals.evidence.recentVideoCount}
- Older videos: ${signals.evidence.olderVideoCount}
- Recent winners (above-avg views): ${signals.momentum.recentWinners}
- Unique channels: ${signals.competition.uniqueChannels}
${signals.googleTrends.available ? `- Google Trends interest: ${signals.googleTrends.interest}/100 (${signals.googleTrends.direction})` : ""}
${signals.googleTrends.risingQueries.length > 0 ? `- Rising search queries: ${signals.googleTrends.risingQueries.join(", ")}` : ""}`;

  const prompt = `You are a senior content strategy analyst specialising in short-form video (Reels, YouTube Shorts). You have deep knowledge of what makes content go viral, audience psychology, platform algorithms, and creator economics.

A creator wants to make short-form video content about this idea:
IDEA: "${idea}"
NICHE: ${niche || "general content creation"}

Here is the real data you have to work with:

${youtubeContext}

${trendsContext}

${signalsContext}

Your job is to produce a comprehensive, data-driven validation report. Be brutally honest. Reference actual numbers from the YouTube data. Do not give generic advice — every insight must be specific to this idea and this data.

CRITICAL: The trendDirection, trendScore, trendVelocity, and competitionLevel fields below MUST match the computed signals above exactly. Do NOT invent your own values for these — they are pre-computed from real data.

Return ONLY a valid JSON object matching this exact structure (no markdown, no code fences):

{
  "trendDirection": "${signals.trend.direction}",
  "trendScore": ${signals.trend.score},
  "trendVelocity": "${signals.trend.velocity === "high" ? "accelerating" : signals.trend.velocity === "medium" ? "steady" : signals.trend.velocity === "low" ? "slowing" : "unknown"}",
  "competitionLevel": "${signals.competition.level}",
  "saturationWarning": <true if competition is high AND top videos have 1M+ views>,

  "audienceFit": {
    "score": <0-100>,
    "primaryAudience": "<specific demographic based on the video titles and channels you see>",
    "audienceIntent": "entertainment" | "education" | "inspiration" | "problem-solving",
    "bestPostingTimes": ["<time range>", "<time range>"],
    "bestDays": ["<day>", "<day>", "<day>"]
  },

  "summary": "<2-3 sentences. Be specific. Reference the actual view numbers and computed signals.>",
  "opportunityScore": <0-100 composite score weighing trend, competition, audience fit>,

  "topAngles": [
    {
      "angle": "<specific angle name>",
      "why": "<why this works, reference data if possible>",
      "estimatedReach": "low" | "medium" | "high",
      "difficulty": "easy" | "medium" | "hard"
    }
  ],

  "untappedAngles": [
    {
      "angle": "<specific angle nobody is covering>",
      "opportunity": "<what gap exists>",
      "whyNobodyIsDoing": "<why this gap exists>"
    }
  ],

  "platformAnalysis": [
    {
      "platform": "Instagram Reels",
      "potential": "low" | "medium" | "high",
      "contentStyle": "<what specifically works on this platform for this topic>",
      "hashtagStrategy": "<specific hashtag approach for this topic>"
    },
    {
      "platform": "YouTube Shorts",
      "potential": "low" | "medium" | "high",
      "contentStyle": "<what works>",
      "hashtagStrategy": "<approach>"
    }
  ],

  "youtubeData": ${
    hasYouTube
      ? `{
    "topVideoViews": ${topViews},
    "avgTopVideoViews": ${avgViews},
    "totalVideosFound": ${youtubeResults.length},
    "viewsRange": "${signals.evidence.viewsRange}",
    "topChannels": [${signals.evidence.topChannels.map((c) => `"${c}"`).join(", ")}],
    "commonTitles": [<extract 3-4 title patterns from the data above, e.g. "How I...", "Why you should...">]
  }`
      : "null"
  },

  "contentBlueprint": {
    "openingHook": "<exactly what the first 3 seconds must establish — be specific, not generic>",
    "coreMessage": "<the single thing the video must communicate — one sentence>",
    "keyPoints": [
      {
        "point": "<what to cover in this section>",
        "why": "<why this matters to the specific audience>",
        "deliveryTip": "<how to deliver it — tone, pacing, visual style>",
        "timestamp": "<e.g. '0:03-0:12'>"
      }
    ],
    "closingCTA": "<specific CTA that fits this content — not 'follow me for more'>",
    "visualNotes": "<specific b-roll, text overlays, transitions that would work for this topic>",
    "audioNotes": "<music mood, voiceover style, sound effects that fit>",
    "durationTarget": "<e.g. '45-55 seconds' based on the topic complexity>"
  },

  "platform_scores": [
    {
      "platform": "Instagram Reels",
      "tier": "Excellent" | "Strong" | "Moderate" | "Low",
      "reason": "<one-line justification referencing data or niche fit>"
    },
    {
      "platform": "YouTube Shorts",
      "tier": "Excellent" | "Strong" | "Moderate" | "Low",
      "reason": "<one-line justification referencing data or niche fit>"
    }
  ],

  "competitorInsights": [
    {
      "observation": "<what the top creators in this space are doing>",
      "gap": "<what they're consistently missing or doing wrong>"
    }
  ],

  "risks": [
    "<specific risk based on the computed signals and data>",
    "<specific risk 2>",
    "<specific risk 3>"
  ],

  "recommendations": [
    "<specific actionable step before filming>",
    "<specific actionable step>",
    "<specific actionable step>",
    "<specific actionable step>"
  ],

  "keyInsight": "<the single most important thing the creator must know — be direct and specific>",
  "verdictLabel": "Strong opportunity" | "Good opportunity" | "Proceed with caution" | "Avoid for now",
  "verdictReason": "<1-2 sentences explaining the verdict, referencing actual data and computed signals>"
}

TONE — GROUNDED OPTIMISM:
Write as if you are a trusted advisor talking to a friend. Be specific, confident, and honest — never hype.
- DO NOT use superlatives or hype phrases. The following are explicitly banned: "massive opportunity", "huge upside", "incredible potential", "amazing chance", "explosive growth", "insane demand", "game-changer", "goldmine", "untapped goldmine", and any similar exaggerated language.
- If the niche is difficult, saturated, or declining, say so honestly. Then provide a concrete, specific path forward the creator can actually act on. Never sugarcoat bad data, but never leave the creator without a next step.
- In the "summary" and "verdictReason" fields, reference specific data points: cite actual view counts, name top channels, mention title patterns you observed, or quote trend numbers. Do not make generic statements like "there is good demand" — instead say something like "the top 5 videos average 120K views, led by channels like X and Y, which suggests steady audience interest."
- Keep language direct and grounded. Prefer "solid" over "incredible", "worth pursuing" over "huge opportunity", "growing steadily" over "exploding".

PLATFORM SCORING:
- Rate each platform in "platform_scores" using ONLY these four tier labels: "Excellent", "Strong", "Moderate", or "Low". Do NOT use numeric scores, decimals, or any other labels.
- Base each rating on the available data: YouTube view counts, trend direction, competition level, niche fit, and audience behavior on that platform.
- Each "reason" must be a single concise sentence that references specific data or niche characteristics — not a generic statement.
- Include ONLY Instagram Reels and YouTube Shorts. Do NOT include TikTok or any other platform.

IMPORTANT:
- trendDirection MUST be "${signals.trend.direction}" — this is computed, not your opinion
- trendScore MUST be ${signals.trend.score} — this is computed, not your opinion
- competitionLevel MUST be "${signals.competition.level}" — this is computed, not your opinion
- Do NOT include "avgViewsForTopic" in platformAnalysis — we don't have real per-platform view data
- Do NOT include TikTok in platform_scores — it is not available in this market
- keyPoints in contentBlueprint should have 4-6 items covering the full video structure
- topAngles should have 3-5 items
- untappedAngles should have 2-3 items
- competitorInsights should have 2-3 items
- risks should have 3-4 items
- recommendations should have 4-5 items
- Reference actual view numbers from the YouTube data wherever possible
- The contentBlueprint is NOT a script — it's a production guide with key points to hit`;

  const completion = await groqWithBackoff(groq, {
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 3000,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as InsightReport;

  // ── Override LLM values with computed signals (trust math, not LLM) ─────
  parsed.trendDirection = signals.trend.direction;
  parsed.trendScore = signals.trend.score;
  parsed.trendVelocity = signals.trend.velocity === "high" ? "accelerating"
    : signals.trend.velocity === "medium" ? "steady"
    : signals.trend.velocity === "low" ? "slowing" : "unknown";
  parsed.competitionLevel = signals.competition.level;
  parsed.opportunityScore = signals.opportunity.score;
  if (parsed.audienceFit) {
    parsed.audienceFit.score = signals.audienceFit.score;
  }

  // Ensure youtubeData is populated from real data
  if (hasYouTube) {
    parsed.youtubeData = {
      topVideoViews: topViews,
      avgTopVideoViews: avgViews,
      totalVideosFound: youtubeResults.length,
      viewsRange: signals.evidence.viewsRange,
      topChannels: signals.evidence.topChannels,
      commonTitles: parsed.youtubeData?.commonTitles ?? youtubeResults.slice(0, 4).map((v) => v.title),
    };
  }

  // Strip fake avgViewsForTopic from platformAnalysis
  if (parsed.platformAnalysis) {
    parsed.platformAnalysis = parsed.platformAnalysis.map((p) => {
      const { avgViewsForTopic, ...rest } = p as any;
      return rest;
    });
  }

  // Remove TikTok from platform_scores if LLM included it
  if (parsed.platform_scores) {
    parsed.platform_scores = parsed.platform_scores.filter(
      (p) => !p.platform.toLowerCase().includes("tiktok")
    );
  }

  // Populate topVideos from real YouTube data (zero additional API calls)
  parsed.topVideos = extractTopVideos(youtubeResults);

  return parsed;
}
