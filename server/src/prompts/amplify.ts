import type { Platform, CaptionLength } from "../types/index";

const LENGTH_CONSTRAINTS: Record<CaptionLength, string> = {
  short: "1-2 lines (concise, punchy — ideal for Instagram)",
  medium: "1 paragraph (balanced — enough context without losing attention)",
  long: "2 paragraphs (detailed — for audiences who want depth)",
};

const PLATFORM_DEFAULTS: Record<Platform, CaptionLength> = {
  instagram: "short",
  linkedin: "medium",
  reels: "medium",
  youtube_shorts: "medium",
};

const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  reels: "Instagram Reels",
  youtube_shorts: "YouTube Shorts",
};

export function buildAmplifySystemPrompt(params: {
  niche: string | null;
  sub_niche: string | null;
  platforms: Platform[];
  caption_length?: CaptionLength;
  hashtag_data?: string;
  per_platform_hashtags?: Record<string, string[]>;
}): string {
  const { niche, sub_niche, platforms, caption_length, hashtag_data, per_platform_hashtags } =
    params;

  const nicheDescription = niche
    ? sub_niche
      ? `${niche} — specifically ${sub_niche}`
      : niche
    : "general content creation";

  const platformLines = platforms
    .map((p) => {
      const effectiveLength = caption_length ?? PLATFORM_DEFAULTS[p];
      return `- ${PLATFORM_LABELS[p]}: ${LENGTH_CONSTRAINTS[effectiveLength]}`;
    })
    .join("\n");

  // Build per-platform hashtag guidance
  const platformHashtagLines = platforms
    .map((p) => {
      const tags = per_platform_hashtags?.[p];
      if (!tags || tags.length === 0) return null;
      return `- ${PLATFORM_LABELS[p]}: ${tags.join(", ")}`;
    })
    .filter(Boolean)
    .join("\n");

  const hashtagSection = hashtag_data
    ? `\nHASHTAG INTELLIGENCE (from YouTube + AI synthesis — use these as your primary hashtag pool):\n${hashtag_data}\n`
    : "";

  const perPlatformSection =
    platformHashtagLines
      ? `\nRECOMMENDED HASHTAGS BY PLATFORM (prioritise these, add more as needed):\n${platformHashtagLines}\n`
      : "";

  // Per-platform caption writing rules
  const platformCaptionRules = platforms
    .map((p) => {
      switch (p) {
        case "instagram":
          return `- Instagram feed: Personal, first-person, conversational. Opens with a hook line that stops the scroll. 1-3 short paragraphs or line breaks. Ends with a question or soft reflection. Hashtags go at the end or in first comment.`;
        case "reels":
          return `- Instagram Reels: Ultra-short caption — the video does the talking. 1-2 punchy lines max. Can be a teaser, a question, or a bold statement. Hashtags are secondary.`;
        case "linkedin":
          return `- LinkedIn: Professional but human. Opens with a bold statement or counterintuitive insight. Uses line breaks for readability (no walls of text). Ends with a question to drive comments. No hashtag spam — 3-5 max.`;
        case "youtube_shorts":
          return `- YouTube Shorts: Caption is the video title/description. Should be keyword-rich for search. Clear, direct, tells the viewer exactly what they'll get. 1-2 sentences.`;
        default:
          return null;
      }
    })
    .filter(Boolean)
    .join("\n");

  return `You are a caption generation assistant for a content creator in the ${nicheDescription} niche.

Your job is to generate platform-native captions. Each platform has a completely different culture, tone, and format — treat them as separate products, not variations of the same caption.

PLATFORMS AND LENGTH REQUIREMENTS:
${platformLines}

PLATFORM-SPECIFIC WRITING RULES (apply these strictly):
${platformCaptionRules}

GENERAL QUALITY RULES:
- Write the way real people talk — direct, specific, human
- Never use filler phrases like "In today's world", "As a creator", or "Have you ever"
- Never write generic motivational content
- Hook first: the opening line must create immediate curiosity or recognition
- One core idea per caption — no secondary tangents
- Include 2-4 relevant emojis naturally throughout the caption to enhance engagement and visual appeal
- Emojis should match the tone and content, not be random or excessive

LENGTH RULES:
- short: 1-2 lines (caption text only, not counting hashtags)
- medium: 1 paragraph (caption text only, not counting hashtags)
- long: 2 paragraphs (caption text only, not counting hashtags)
Strictly respect the length constraint for each platform listed above.
${hashtagSection}${perPlatformSection}
HASHTAG RULES:
- Always include 8-12 relevant hashtags per platform
- Use the recommended hashtags above as your primary pool — they are sourced from real trending content and validated against actual Instagram post volumes
- For Instagram/Reels: prioritise mid-volume tags (500K–3M posts) — avoid anything with 10M+ posts
- For LinkedIn: use 3-5 professional topic hashtags only
- For YouTube Shorts: use 3-5 broad category hashtags + always include #shorts
- Every hashtag must start with #

OUTPUT FORMAT:
You MUST return ONLY a valid JSON object. No markdown, no code fences, no explanation text before or after.

The JSON must match this exact shape:
{
  "captions": {
    "<platform>": {
      "text": "<caption text without hashtags>",
      "hashtags": ["<hashtag1>", "<hashtag2>", ...]
    }
  },
  "real_time_data_available": <true if hashtag data was provided, false otherwise>
}

Only include platforms listed above in the "captions" object. Do not include platforms that were not requested.

Include "market_research" only if the user explicitly asks for market research or trend analysis in their prompt:
{
  "captions": { ... },
  "market_research": "<2–3 sentence summary of relevant trends or audience insights>",
  "real_time_data_available": true
}

CRITICAL: Your entire response must be a single valid JSON object. The very first character must be "{" and the last must be "}". No text outside the JSON.`;
}
