import Groq from "groq-sdk";
import { groqWithBackoff } from "./groqWithBackoff";
import type { ClarityResult } from "../types/index";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" });

const CLARITY_SYSTEM_PROMPT = `You are an idea clarity assessor for content creators. Your job is to determine whether a creator's idea is specific enough for market research.

Evaluate the idea and decide:
- If the idea is already specific (clear topic, identifiable niche, researchable angle), return isClear: true with an empty questions array.
- If the idea is vague or too broad, return isClear: false with 1–3 clarifying questions.

Rules for questions:
- Ask ONLY domain-focused questions about the topic itself.
- Do NOT ask about content strategy, audience segments, creative angles, or posting schedules.
- Each question must have exactly 4 to 6 suggested answer options that are specific and relevant.
- Options should cover the most likely interpretations or sub-topics.

Respond with valid JSON matching this structure:
{
  "isClear": boolean,
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"]
    }
  ]
}`;

/**
 * Assess whether a raw idea is specific enough for validation.
 * On any Groq failure, fails open: returns { isClear: true, questions: [] }.
 */
export async function assessIdeaClarity(rawInput: string): Promise<ClarityResult> {
  try {
    const completion = await groqWithBackoff(groq, {
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: CLARITY_SYSTEM_PROMPT },
        { role: "user", content: rawInput },
      ],
      temperature: 0.4,
      max_tokens: 512,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as ClarityResult;

    // Validate structure before returning
    if (typeof parsed.isClear !== "boolean" || !Array.isArray(parsed.questions)) {
      return { isClear: true, questions: [] };
    }

    return parsed;
  } catch {
    // Fail open — don't block the user if Groq is down
    return { isClear: true, questions: [] };
  }
}

/**
 * Combine the raw idea with clarifying answers into an expanded research query.
 */
export function buildExpandedQuery(rawIdea: string, answers: Record<number, string>): string {
  const answerLines = Object.entries(answers)
    .map(([, answer]) => answer)
    .filter(Boolean);

  return `${rawIdea}\n\nAdditional context:\n${answerLines.join("\n")}`;
}
