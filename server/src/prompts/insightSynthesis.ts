import Groq from "groq-sdk";
import type { YouTubeResult, TrendData } from "../services/insights";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" });

export interface InsightReport {
  trendDirection: "rising" | "peaked" | "declining" | "stable";
  trendScore: number; // 0-100
  competitionLevel: "low" | "medium" | "high";
  summary: string;
  topAngles: Array<{ angle: string; why: string }>;
  untappedAngles: Array<{ angle: string; opportunity: string }>;
  recommendedFormat: string;
  bestPlatforms: string[];
  hookSuggestions: string[];
  keyInsight: string;
}

export async function synthesizeInsights(params: {
  idea: string;
  niche: string;
  youtubeResults: YouTubeResult[];
  trendData: TrendData | null;
}): Promise<InsightReport> {
  const { idea, niche, youtubeResults, trendData } = params;

  const youtubeContext = youtubeResults.length > 0
    ? youtubeResults.slice(0, 5).map(v =>
        `- "${v.title}" by ${v.channelTitle} — ${Number(v.viewCount).toLocaleString()} views, ${Number(v.likeCount).toLocaleString()} likes`
      ).join("\n")
    : "No YouTube data available.";

  const trendsContext = trendData
    ? `Google Trends interest score: ${trendData.interest}/100. Related searches: ${trendData.relatedQueries.join(", ")}`
    : "No Google Trends data available.";

  const prompt = `You are a content strategy analyst with deep knowledge of social media trends and creator economics.

A creator wants to make content about this idea: "${idea}"
Their niche: ${niche || "general"}

Here is real-time data about this topic:

YOUTUBE (top performing videos):
${youtubeContext}

GOOGLE TRENDS:
${trendsContext}

Based on this data, generate a comprehensive insight report. Return ONLY valid JSON matching this exact structure:

{
  "trendDirection": "rising" | "peaked" | "declining" | "stable",
  "trendScore": <number 0-100>,
  "competitionLevel": "low" | "medium" | "high",
  "summary": "<2-3 sentence overview of the opportunity>",
  "topAngles": [
    { "angle": "<angle name>", "why": "<why this is working based on the data>" }
  ],
  "untappedAngles": [
    { "angle": "<angle name>", "opportunity": "<what gap exists that nobody is covering>" }
  ],
  "recommendedFormat": "<short-form video | long-form video | carousel | thread | etc>",
  "bestPlatforms": ["<platform>"],
  "hookSuggestions": ["<hook line 1>", "<hook line 2>", "<hook line 3>"],
  "keyInsight": "<the single most important thing the creator should know before making this content>"
}

Be specific and data-driven. Reference actual numbers from the data where relevant. No generic advice.`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4,
    max_tokens: 1500,
  });

  const text = completion.choices[0]?.message?.content ?? "";
  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  return JSON.parse(cleaned) as InsightReport;
}
