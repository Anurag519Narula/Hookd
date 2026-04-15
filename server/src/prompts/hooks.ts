import Groq from "groq-sdk";
import type { Hook } from "../types/index";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" });

const SYSTEM_INSTRUCTION = `You are a content strategist who understands platform culture practically, not theoretically. You specialize in the Indian content ecosystem (Tier 1 to Tier 3 audiences). You write the way Indian creators and their followers talk: direct, specific, human, occasionally using relatable Hinglish or localized nuance where appropriate. 

Key Rules:
1. Never use filler phrases like 'In today's world,' 'As a content creator,' or 'In this day and age.'
2. Never start a hook with 'Have you ever.'
3. Focus on the specific aspirations, challenges, and cultural touchpoints of audiences in India.
4. If a niche or sub-niche is provided, the hooks MUST be deeply anchored in that specific professional or hobbyist world.`;

export interface GenerateHooksParams {
  raw_idea: string;
  niche: string;
  sub_niche: string;
  language: string;
}

export async function generateHooks(params: GenerateHooksParams): Promise<Hook[]> {
  const { raw_idea, niche, sub_niche, language } = params;

  const nicheContext = sub_niche ? `${niche} (specifically ${sub_niche})` : niche;

  const prompt = `System: ${SYSTEM_INSTRUCTION}

User:
Generate exactly 5 hooks for the following raw idea. Each hook must use a DISTINCT psychological trigger.

Audience: People and Content Creators in India.
Context (Niche): ${nicheContext || "General Content"}
Language Preference: ${language || "English"}

Use exactly 5 of these 6 triggers (pick the 5 that best fit the idea):
- Curiosity Gap: tease something without revealing it
- Identity Threat: challenge the reader's self-image or beliefs (e.g., "Most Indian creators are doing X wrong")
- Controversy: take a polarizing stance
- Surprising Stat: lead with an unexpected number or fact
- Personal Story Angle: open with a specific personal moment
- Pattern Interrupt: say something that breaks the reader's mental autopilot

Raw idea:
${raw_idea}

Return ONLY a valid JSON array of exactly 5 objects. Each object must have:
- "hook_text": the hook line (string)
- "trigger": the trigger name exactly as listed above (string)

No explanation, no markdown, no code fences. Just the JSON array.`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
    max_tokens: 512,
  });

  const text = completion.choices[0]?.message?.content ?? "";
  const parsed = JSON.parse(text) as Hook[];
  return parsed;
}

const ALLOWED_TRIGGERS = [
  "Curiosity Gap",
  "Identity Threat",
  "Controversy",
  "Surprising Stat",
  "Personal Story Angle",
  "Pattern Interrupt",
] as const;

export { ALLOWED_TRIGGERS };
