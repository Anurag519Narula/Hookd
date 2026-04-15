import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" });

const SYSTEM_INSTRUCTION = `You are a content strategist who understands platform culture practically, not theoretically. You specialize in the Indian content ecosystem (Tier 1 to Tier 3 audiences). You write the way Indian creators and their followers talk: direct, specific, human, occasionally using relatable Hinglish or localized nuance where appropriate. 

Key Rules:
1. Never use filler phrases like 'In today's world,' 'As a content creator,' or 'In this day and age.'
2. Never start a hook with 'Have you ever.'
3. Focus on the specific aspirations, challenges, and cultural touchpoints of audiences in India.
4. If a niche or sub-niche is provided, the content MUST be deeply anchored in that specific professional or hobbyist world.`;

const PLATFORM_GUIDANCE: Record<string, string> = {
  instagram: "Write an Instagram caption. Hook first line, then 2-4 short paragraphs, then a soft CTA question. End with 8-12 niche-relevant hashtags on a new line — mix high-volume (#fitness) and mid-range niche-specific tags (#homegymlife). No generic hashtags like #love or #instagood.",
  linkedin: "Write a LinkedIn post. Professional but personal. First-person, story-driven. 3-5 short paragraphs. End with a question that invites comments. Add 3-5 relevant professional hashtags at the bottom.",
  reels: "Write an Instagram Reels script or caption. Conversational, fast-paced, direct. Short sentences. Feels like you're talking to one person. Include a CTA to follow or save. Add 5-8 trending niche hashtags at the end.",
  youtube_shorts: "Write a YouTube Shorts description and script hook. Keep it under 60 seconds when spoken. Start with the hook line, then 3-5 punchy sentences that deliver the value. End with a subscribe CTA. Add 5-7 relevant YouTube hashtags (e.g. #Shorts #YourNiche) at the bottom.",
};

export interface GenerateCaptionParams {
  hook: string;
  raw_idea: string;
  platform: string;
  niche: string;
  anchor_keywords: string[];
  language: string;
}

export interface RegenerateCaptionParams {
  original_caption: string;
  feedback: string;
  platform: string;
  niche: string;
  anchor_keywords: string[];
  language: string;
}

export async function generateCaption(params: GenerateCaptionParams): Promise<string> {
  const { hook, raw_idea, platform, niche, anchor_keywords, language } = params;

  const platformGuide = PLATFORM_GUIDANCE[platform] ?? `Write a platform-native caption for ${platform}.`;
  const keywordsNote = anchor_keywords.length > 0
    ? `You MUST incorporate these keywords naturally into the caption: ${anchor_keywords.join(", ")}.`
    : "";

  const prompt = `${SYSTEM_INSTRUCTION}

${platformGuide}

CRITICAL RULE: The very first line of your output must be EXACTLY this hook, word for word, with no changes:
"${hook}"

After that first line, write the rest of the caption based on the raw idea below.

${keywordsNote}

Niche: ${niche || "general"}
Language: ${language || "English"}

HASHTAG RULE: At the end of the caption, add niche-specific hashtags that are actually used by real audiences in the ${niche || "general"} space. Do NOT use generic hashtags like #love, #instagood, #viral, #trending. Use hashtags that a real follower of this niche would search for.

Raw idea:
${raw_idea}

Output the caption only. No labels, no explanations, no "Here is your caption:". Start directly with the hook line.`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
    max_tokens: 1024,
  });

  return completion.choices[0]?.message?.content ?? "";
}

export async function regenerateCaption(params: RegenerateCaptionParams): Promise<string> {
  const { original_caption, feedback, platform, niche, anchor_keywords, language } = params;

  const platformGuide = PLATFORM_GUIDANCE[platform] ?? `Write a platform-native caption for ${platform}.`;
  const keywordsNote = anchor_keywords.length > 0
    ? `You MUST incorporate these keywords naturally into the caption: ${anchor_keywords.join(", ")}.`
    : "";

  // Extract the first line (hook) from the original caption to preserve it
  const firstLine = original_caption.split("\n")[0] ?? "";

  let prompt: string;

  if (!feedback || feedback.trim() === "") {
    // Full regeneration — rewrite the body but keep the hook
    prompt = `${SYSTEM_INSTRUCTION}

${platformGuide}

Fully rewrite the following caption. Keep the first line (the hook) EXACTLY as-is, word for word. Rewrite everything after it from scratch.

${keywordsNote}

Niche: ${niche || "general"}
Language: ${language || "English"}

Original caption:
${original_caption}

CRITICAL RULE: The very first line of your output must be EXACTLY:
"${firstLine}"

Output the rewritten caption only. No labels, no explanations. Start directly with the hook line.`;
  } else {
    // Feedback-based rewrite
    prompt = `${SYSTEM_INSTRUCTION}

${platformGuide}

Rewrite the following caption by applying this feedback: "${feedback}"

Rules:
- Keep the first line (the hook) EXACTLY as-is, word for word: "${firstLine}"
- Preserve all anchor keywords: ${anchor_keywords.join(", ")}
- Apply the feedback to improve the rest of the caption

${keywordsNote}

Niche: ${niche || "general"}
Language: ${language || "English"}

Original caption:
${original_caption}

Output the rewritten caption only. No labels, no explanations. Start directly with the hook line.`;
  }

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
    max_tokens: 1024,
  });

  return completion.choices[0]?.message?.content ?? "";
}
