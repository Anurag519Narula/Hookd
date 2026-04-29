import Groq from "groq-sdk";
import { groqWithBackoff } from "./groqWithBackoff";
import type { InsightReport } from "../prompts/insightSynthesis";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" });

/**
 * Generate an estimated InsightReport using only Groq (no external data).
 * Used as the last-resort fallback when all external APIs fail and no cache is available.
 * The output conforms to the same InsightReport JSON structure so the frontend renders identically.
 */
export async function generateAIEstimate(
  idea: string,
  niche: string
): Promise<InsightReport> {
  const nicheLabel = niche?.trim() || "general content creation";

  const prompt = `You are a senior content strategy analyst specialising in short-form video (Reels, YouTube Shorts). You have deep knowledge of what makes content go viral, audience psychology, platform algorithms, and creator economics.

A creator wants to make short-form video content about this idea:
IDEA: "${idea}"
NICHE: ${nicheLabel}

You do NOT have any real-time YouTube or Instagram data for this request. You must rely entirely on your general knowledge of the content landscape, typical performance patterns for this niche, and your expertise as a strategist.

Be honest that this is based on general knowledge. Do NOT fabricate specific view counts or channel names. Instead, provide realistic estimates and ranges based on what you know about similar content.

Write in a tone of grounded optimism — specific, confident, honest, never hype. Do NOT use phrases like "massive opportunity", "huge upside", or "incredible potential". Acknowledge difficult niches honestly with a path forward.

Return ONLY a valid JSON object matching this exact structure (no markdown, no code fences):

{
  "trendDirection": "rising" | "peaked" | "declining" | "stable",
  "trendScore": <0-100, your best estimate based on general knowledge>,
  "trendVelocity": "accelerating" | "steady" | "slowing" | "unknown",
  "competitionLevel": "low" | "medium" | "high",
  "saturationWarning": <true/false>,

  "audienceFit": {
    "score": <0-100>,
    "primaryAudience": "<specific demographic>",
    "audienceIntent": "entertainment" | "education" | "inspiration" | "problem-solving",
    "bestPostingTimes": ["<time range>", "<time range>"],
    "bestDays": ["<day>", "<day>", "<day>"]
  },

  "summary": "<2-3 sentences. Be specific about the niche and idea. Acknowledge this is based on general knowledge.>",
  "opportunityScore": <0-100>,

  "topAngles": [
    {
      "angle": "<specific angle>",
      "why": "<why this works>",
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
      "avgViewsForTopic": "<realistic estimated range>",
      "contentStyle": "<what works on this platform for this topic>",
      "hashtagStrategy": "<specific hashtag approach>"
    },
    {
      "platform": "YouTube Shorts",
      "potential": "low" | "medium" | "high",
      "avgViewsForTopic": "<realistic estimated range>",
      "contentStyle": "<what works>",
      "hashtagStrategy": "<approach>"
    }
  ],

  "youtubeData": null,

  "contentBlueprint": {
    "openingHook": "<exactly what the first 3 seconds must establish>",
    "coreMessage": "<the single thing the video must communicate>",
    "keyPoints": [
      {
        "point": "<what to cover>",
        "why": "<why this matters>",
        "deliveryTip": "<how to deliver it>",
        "timestamp": "<e.g. '0:03-0:12'>"
      }
    ],
    "closingCTA": "<specific CTA>",
    "visualNotes": "<specific visual suggestions>",
    "audioNotes": "<music mood, voiceover style>",
    "durationTarget": "<e.g. '45-55 seconds'>"
  },

  "competitorInsights": [
    {
      "observation": "<what top creators in this space typically do>",
      "gap": "<what they consistently miss>"
    }
  ],

  "risks": [
    "<specific risk 1>",
    "<specific risk 2>",
    "<specific risk 3>"
  ],

  "recommendations": [
    "<specific actionable step>",
    "<specific actionable step>",
    "<specific actionable step>",
    "<specific actionable step>"
  ],

  "keyInsight": "<the single most important thing the creator must know>",
  "verdictLabel": "Strong opportunity" | "Good opportunity" | "Proceed with caution" | "Avoid for now",
  "verdictReason": "<1-2 sentences explaining the verdict>",
  "topVideos": [],
  "platform_scores": [
    {
      "platform": "<platform name>",
      "tier": "Excellent" | "Strong" | "Moderate" | "Low",
      "reason": "<one-line justification>"
    }
  ]
}

IMPORTANT:
- youtubeData MUST be null (no real data available)
- topVideos MUST be an empty array (no real videos to reference)
- keyPoints in contentBlueprint should have 4-6 items
- topAngles should have 3-5 items
- untappedAngles should have 2-3 items
- competitorInsights should have 2-3 items
- risks should have 3-4 items
- recommendations should have 4-5 items
- platform_scores should cover at least Instagram Reels and YouTube Shorts
- Use tier labels only: "Excellent", "Strong", "Moderate", or "Low" — no decimals or numeric scores`;

  const completion = await groqWithBackoff(groq, {
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 3000,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as InsightReport;

  // ── Sanitize text fields — ensure sentence-case capitalization ───────────
  function capFirst(s: string | undefined): string {
    if (!s) return s ?? "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  parsed.summary = capFirst(parsed.summary);
  parsed.keyInsight = capFirst(parsed.keyInsight);
  parsed.verdictReason = capFirst(parsed.verdictReason);

  // Enforce invariants: no external data was used
  parsed.youtubeData = null;
  parsed.topVideos = [];

  return parsed;
}
