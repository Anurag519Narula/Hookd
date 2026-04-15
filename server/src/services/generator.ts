import Groq from "groq-sdk";
import { INSTAGRAM_PROMPT } from "../prompts/instagram";
import { LINKEDIN_PROMPT } from "../prompts/linkedin";
import { REELS_PROMPT } from "../prompts/reels";
import { YOUTUBE_SHORTS_PROMPT } from "../prompts/youtubeShorts";
import type { Platform, GenerateResponse } from "../types/index";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" });

const PLATFORM_PROMPTS: Record<Platform, string> = {
  instagram:      INSTAGRAM_PROMPT,
  linkedin:       LINKEDIN_PROMPT,
  reels:          REELS_PROMPT,
  youtube_shorts: YOUTUBE_SHORTS_PROMPT,
};

export function buildPrompt(platform: Platform, rawContent: string): string {
  return `${PLATFORM_PROMPTS[platform]}\n\nCreator's raw idea / text:\n${rawContent}`;
}

export async function generateForPlatform(
  platform: Platform,
  rawContent: string
): Promise<{ content: string } | { error: string }> {
  try {
    const prompt = buildPrompt(platform, rawContent);
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 1024,
    });
    const text = completion.choices[0]?.message?.content ?? "";
    return { content: text };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { error: message };
  }
}

export async function generateSelected(
  platforms: Platform[],
  rawContent: string
): Promise<GenerateResponse> {
  const results = await Promise.all(
    platforms.map((p) => generateForPlatform(p, rawContent))
  );
  const response: GenerateResponse = {};
  platforms.forEach((p, i) => {
    response[p] = results[i];
  });
  return response;
}

// Keep generateAll for any internal use
export async function generateAll(rawContent: string): Promise<GenerateResponse> {
  const platforms: Platform[] = ["instagram", "linkedin", "reels", "youtube_shorts"];
  return generateSelected(platforms, rawContent);
}
