import type { ScriptFormat, PsychologicalTrigger } from "../types/index";

// Format constraints — Reels now targets 45-60s (≤300 words, 5 beats) for richer content
const FORMAT_CONSTRAINTS: Record<ScriptFormat, { maxWords: number; beats: number; durationNote: string }> = {
  reels: { maxWords: 300, beats: 5, durationNote: "45–60 seconds" },
  youtube_shorts: { maxWords: 300, beats: 5, durationNote: "45–60 seconds" },
};

const ALL_TRIGGERS: PsychologicalTrigger[] = [
  "Curiosity Gap",
  "Identity Threat",
  "Controversy",
  "Surprising Stat",
  "Personal Story Angle",
  "Pattern Interrupt",
];

const STUDIO_SYSTEM_PROMPT = `You are a short-form video script strategist who understands the distinct culture and viewer behaviour of each platform.

PLATFORM DIFFERENCES YOU MUST APPLY:
- Instagram Reels: viewers scroll fast, hook must land in 1-2 seconds, casual and personal tone, creator-to-viewer intimacy, trending audio matters, 15-30 seconds is the sweet spot
- YouTube Shorts: slightly longer attention span (up to 60s), viewers are more topic-driven, slightly more educational/informational tone acceptable, strong title-hook alignment needed

Rules:
- Never use filler openers like "In today's world", "Have you ever", or "As a creator".
- Every hook must create immediate tension, curiosity, or recognition in the first 3 seconds.
- Beats must flow naturally from the hook's psychological trigger — the tone and angle must stay consistent.
- The CTA must feel earned, not bolted on. One sentence, no "follow me for more".
- Always return ONLY valid JSON. No markdown, no code fences, no explanation outside the JSON.`;

/**
 * Builds the prompt for generating 3 hook variants ONLY.
 * Beats and CTA are generated separately after the user picks a hook.
 */
export function buildHooksOnlyPrompt(
  idea: string,
  format: ScriptFormat,
  niche?: string,
  sub_niche?: string,
  language?: string
): { system: string; user: string } {
  const formatLabel = format === "reels" ? "Instagram Reels" : "YouTube Shorts";
  const nicheContext = niche ? (sub_niche ? `${niche} — specifically ${sub_niche}` : niche) : null;
  const langNote = language && language !== "English" ? ` Write in ${language}.` : "";

  const platformToneNote =
    format === "reels"
      ? `\nPLATFORM (Instagram Reels): Hook must stop a fast-scrolling viewer in 1 second. Casual, personal, direct.`
      : `\nPLATFORM (YouTube Shorts): Hook must immediately deliver on the title's promise. Slightly more informational.`;

  const user = `Generate exactly 3 hook variants for the following idea. Each hook uses a DIFFERENT psychological trigger.

IDEA: ${idea}
FORMAT: ${formatLabel}
${nicheContext ? `NICHE: ${nicheContext}` : ""}${langNote}${platformToneNote}

TRIGGERS (use exactly 3 different ones from this list):
${ALL_TRIGGERS.map((t) => `"${t}"`).join(", ")}

Each hook must:
- Be a single punchy opening line (1-2 sentences max)
- Create immediate tension, curiosity, or recognition
- Feel native to ${formatLabel} — not generic

Return ONLY a valid JSON object:
{
  "hook_variants": [
    { "hook_text": "...", "trigger": "Curiosity Gap" },
    { "hook_text": "...", "trigger": "Identity Threat" },
    { "hook_text": "...", "trigger": "Surprising Stat" }
  ]
}

The first character must be "{".`;

  return { system: STUDIO_SYSTEM_PROMPT, user };
}

/**
 * Builds the prompt for generating beats + CTA for a SELECTED hook.
 * Called after the user picks their preferred hook variant.
 */
export function buildScriptFromHookPrompt(
  idea: string,
  format: ScriptFormat,
  selectedHook: { hook_text: string; trigger: PsychologicalTrigger },
  niche?: string,
  sub_niche?: string,
  language?: string
): { system: string; user: string } {
  const { maxWords, beats, durationNote } = FORMAT_CONSTRAINTS[format];
  const formatLabel = format === "reels" ? "Instagram Reels" : "YouTube Shorts";
  const nicheContext = niche ? (sub_niche ? `${niche} — specifically ${sub_niche}` : niche) : null;
  const langNote = language && language !== "English" ? ` Write in ${language}.` : "";

  const platformToneNote =
    format === "reels"
      ? `\nPLATFORM TONE (Instagram Reels): Casual, personal, conversational. Beats feel like a natural continuation of the hook — not a lecture. Target ${durationNote}.`
      : `\nPLATFORM TONE (YouTube Shorts): Slightly more structured. Beats deliver on the hook's promise step by step. Target ${durationNote}.`;

  const user = `Generate the full script body for the following hook.

IDEA: ${idea}
FORMAT: ${formatLabel}
${nicheContext ? `NICHE: ${nicheContext}` : ""}${langNote}
SELECTED HOOK: "${selectedHook.hook_text}"
HOOK TRIGGER: ${selectedHook.trigger}${platformToneNote}

REQUIREMENTS:
- Write exactly ${beats} body beats, each tonally consistent with the "${selectedHook.trigger}" trigger
- Total word count (hook + beats + CTA) must be between 200 and ${maxWords} words — aim for the upper end
- Each beat: a punchy sentence or action cue with a realistic timestamp (e.g. "0:05", "0:12", "0:20")
- Beats should build momentum — each one escalates or deepens the hook's angle
- End with a single earned CTA (not "follow me for more")

Return ONLY a valid JSON object:
{
  "beats": [
    { "timestamp": "0:05", "text": "..." },
    { "timestamp": "0:12", "text": "..." },
    { "timestamp": "0:20", "text": "..." },
    { "timestamp": "0:28", "text": "..." },
    { "timestamp": "0:38", "text": "..." }
  ],
  "cta": "...",
  "word_count": 240
}

The first character must be "{".`;

  return { system: STUDIO_SYSTEM_PROMPT, user };
}

/**
 * @deprecated Use buildHooksOnlyPrompt + buildScriptFromHookPrompt instead.
 * Kept for backward compatibility with regenerate flow.
 */
export function buildScriptGeneratePrompt(
  idea: string,
  format: ScriptFormat,
  niche?: string,
  sub_niche?: string,
  language?: string
): { system: string; user: string } {
  const { maxWords, beats, durationNote } = FORMAT_CONSTRAINTS[format];
  const formatLabel = format === "reels" ? "Instagram Reels" : "YouTube Shorts";
  const nicheContext = niche
    ? sub_niche
      ? `${niche} — specifically ${sub_niche}`
      : niche
    : null;
  const langNote = language && language !== "English" ? ` Write in ${language}.` : "";

  // Platform-specific tone guidance injected directly into the user prompt
  const platformToneNote =
    format === "reels"
      ? `\nPLATFORM TONE (Instagram Reels): Casual, personal, fast-paced. Viewer is scrolling — the hook must stop them in 1 second. Beats should feel like a conversation, not a lecture. CTA should feel natural, not salesy. Target ${durationNote}.`
      : `\nPLATFORM TONE (YouTube Shorts): Slightly more informational than Reels. Viewer clicked because of the title — the hook must immediately deliver on that promise. Beats can be slightly more structured. CTA can reference the channel. Target ${durationNote}.`;

  const user = `Generate a short-form video script for the following idea.

IDEA: ${idea}
FORMAT: ${formatLabel}
${nicheContext ? `NICHE: ${nicheContext}` : ""}${langNote}${platformToneNote}

REQUIREMENTS:
- Produce exactly 3 hook variants, each using a DIFFERENT psychological trigger from this list:
  ${ALL_TRIGGERS.map((t) => `"${t}"`).join(", ")}
- Write exactly ${beats} body beats that follow the first hook's trigger angle.
- Keep total word count (hook + beats + CTA) ≤ ${maxWords} words.
- Each beat must have a realistic timestamp (e.g. "0:03", "0:08").
- End with a single-sentence CTA.

Return ONLY a valid JSON object matching this exact shape:
{
  "hook_variants": [
    { "hook_text": "...", "trigger": "Curiosity Gap" },
    { "hook_text": "...", "trigger": "Identity Threat" },
    { "hook_text": "...", "trigger": "Surprising Stat" }
  ],
  "beats": [
    { "timestamp": "0:03", "text": "..." }
  ],
  "cta": "...",
  "word_count": 87
}

The "trigger" values must be exactly as listed above. The first character of your response must be "{".`;

  return { system: STUDIO_SYSTEM_PROMPT, user };
}

/**
 * Builds the user message for regenerating beats + CTA consistent with a selected hook.
 * The system prompt (STUDIO_SYSTEM_PROMPT) stays the same — caller reuses it.
 */
export function buildScriptRegeneratePrompt(
  idea: string,
  format: ScriptFormat,
  selectedHook: { hook_text: string; trigger: PsychologicalTrigger },
  feedback?: string
): string {
  const { maxWords, beats, durationNote } = FORMAT_CONSTRAINTS[format];
  const formatLabel = format === "reels" ? "Instagram Reels" : "YouTube Shorts";
  const feedbackNote = feedback ? `\nCREATOR FEEDBACK: ${feedback}` : "";

  return `Regenerate the body beats and CTA for the following script.

IDEA: ${idea}
FORMAT: ${formatLabel}
SELECTED HOOK: "${selectedHook.hook_text}"
HOOK TRIGGER: ${selectedHook.trigger}${feedbackNote}

REQUIREMENTS:
- Write exactly ${beats} body beats tonally consistent with the "${selectedHook.trigger}" trigger
- Total word count (hook + beats + CTA) must be between 200 and ${maxWords} words — aim for the upper end
- Each beat has a realistic timestamp (e.g. "0:05", "0:12")
- Target duration: ${durationNote}
- End with a single earned CTA

Return ONLY a valid JSON object:
{
  "beats": [
    { "timestamp": "0:05", "text": "..." }
  ],
  "cta": "...",
  "word_count": 240
}

The first character must be "{".`;
}

/**
 * Builds the user message for generating one new hook using a trigger
 * not already present in existingTriggers.
 * The system prompt (STUDIO_SYSTEM_PROMPT) stays the same — caller reuses it.
 */
export function buildHookRegeneratePrompt(
  idea: string,
  format: ScriptFormat,
  existingTriggers: PsychologicalTrigger[],
  feedback?: string
): string {
  const formatLabel = format === "reels" ? "Instagram Reels" : "YouTube Shorts";
  const availableTriggers = ALL_TRIGGERS.filter((t) => !existingTriggers.includes(t));
  const feedbackNote = feedback ? `\nCREATOR FEEDBACK: ${feedback}` : "";

  return `Generate one new hook for the following idea using a trigger that has NOT been used yet.

IDEA: ${idea}
FORMAT: ${formatLabel}
ALREADY USED TRIGGERS: ${existingTriggers.map((t) => `"${t}"`).join(", ")}
AVAILABLE TRIGGERS (pick one): ${availableTriggers.map((t) => `"${t}"`).join(", ")}${feedbackNote}

REQUIREMENTS:
- Choose exactly one trigger from the AVAILABLE TRIGGERS list.
- Write a single hook line that immediately grabs attention using that trigger.
- The hook must be platform-native for ${formatLabel} — punchy, specific, no filler.

Return ONLY a valid JSON object matching this exact shape:
{
  "hook_text": "...",
  "trigger": "Pattern Interrupt"
}

The "trigger" value must be exactly one of the available triggers listed above. The first character of your response must be "{".`;
}

export { STUDIO_SYSTEM_PROMPT, ALL_TRIGGERS, FORMAT_CONSTRAINTS };
