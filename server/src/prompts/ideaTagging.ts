import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" });

const SYSTEM_INSTRUCTION = `You are a content strategist who understands platform culture practically, not theoretically. You write the way creators talk: direct, specific, human, occasionally imperfect. You never use filler phrases like 'In today's world,' 'As a content creator,' or 'In this day and age.' You never start a hook with 'Have you ever.' The best content comes from a specific perspective — your job is to amplify specificity, not sand it down into something generic.`;

export interface IdeaTaggingResult {
  tags: string[];
  format_type: string;
  emotion_angle: string;
  potential_score: "low" | "medium" | "high";
}

export async function tagIdea(raw_text: string): Promise<IdeaTaggingResult> {
  const prompt = `${SYSTEM_INSTRUCTION}

Analyze the following raw idea and return a JSON object with these fields:
- "tags": an array of 2-3 lowercase strings (no hashtags) that categorize the idea
- "format_type": the best content format for this idea (e.g., "story", "talking head", "listicle", "tutorial", "rant", "hot take")
- "emotion_angle": the primary emotional angle or feeling this idea evokes (e.g., "frustration", "inspiration", "curiosity", "nostalgia", "pride")
- "potential_score": "high" if the idea is specific, personal, counterintuitive, or emotionally charged; "low" if it is vague or generic; "medium" otherwise

Return ONLY valid JSON. No explanation, no markdown, no code fences.

Raw idea:
${raw_text}`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4,
    max_tokens: 256,
  });

  const text = completion.choices[0]?.message?.content ?? "";
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  const parsed = JSON.parse(cleaned) as IdeaTaggingResult;
  return parsed;
}
