import { HookVariant, ScriptFormat, PsychologicalTrigger } from "../types/index";
import { HookCategory, HOOK_TEMPLATES } from "../prompts/hookTemplates";

/**
 * Maps hook template categories to psychological triggers.
 * Each category has a primary trigger that best represents its intent.
 */
const CATEGORY_TRIGGER_MAP: Record<HookCategory, PsychologicalTrigger> = {
  educational: "Curiosity Gap",
  comparison: "Surprising Stat",
  myth_busting: "Controversy",
  storytelling: "Personal Story Angle",
  authority: "Identity Threat",
  day_in_the_life: "Personal Story Angle",
  random: "Pattern Interrupt",
};

/**
 * Extracts meaningful keywords from an idea string.
 * Returns lowercase tokens stripped of common stop words.
 */
function extractKeywords(idea: string): string[] {
  const STOP_WORDS = new Set([
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "need", "dare", "ought",
    "used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
    "as", "into", "through", "during", "before", "after", "above", "below",
    "between", "out", "off", "over", "under", "again", "further", "then",
    "once", "here", "there", "when", "where", "why", "how", "all", "both",
    "each", "few", "more", "most", "other", "some", "such", "no", "nor",
    "not", "only", "own", "same", "so", "than", "too", "very", "just",
    "about", "up", "and", "but", "or", "if", "while", "because", "until",
    "that", "which", "who", "whom", "this", "these", "those", "am", "it",
    "its", "my", "your", "i", "me", "we", "you", "he", "she", "they",
    "what", "make", "get", "want", "like",
  ]);

  return idea
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Simple deterministic hash for a string. Returns a positive integer.
 */
function simpleHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Fills template placeholder blanks with keywords extracted from the idea.
 * Replaces patterns like (noun), (action), (dream result), etc. with relevant keywords.
 */
function fillTemplate(template: string, keywords: string[], hash: number): string {
  if (keywords.length === 0) return template;

  let keywordIndex = hash;
  return template.replace(/\([^)]+\)/g, () => {
    const keyword = keywords[keywordIndex % keywords.length];
    keywordIndex++;
    return keyword;
  });
}

/**
 * Deterministically selects templates from the pool based on the idea hash.
 * Ensures the same idea always produces the same selection and order.
 */
function deterministicSelect<T>(items: T[], count: number, hash: number): T[] {
  if (items.length === 0) return [];
  const selected: T[] = [];
  const indices = new Set<number>();

  let h = hash;
  while (selected.length < count && selected.length < items.length) {
    const idx = h % items.length;
    if (!indices.has(idx)) {
      indices.add(idx);
      selected.push(items[idx]);
    }
    // Simple linear congruential step for next index
    h = ((h * 1103515245) + 12345) & 0x7fffffff;
  }
  return selected;
}

/**
 * Generates deterministic fallback hooks from templates when Groq is unavailable.
 * Same idea always produces the same hooks.
 *
 * @param idea - The creator's raw idea text
 * @param format - The script format (reels or youtube_shorts)
 * @returns 3–6 HookVariant objects with valid PsychologicalTrigger values
 */
export function generateFallbackHooks(idea: string, format: ScriptFormat): HookVariant[] {
  const keywords = extractKeywords(idea);
  const hash = simpleHash(idea.trim().toLowerCase());

  // Use getRelevantTemplates to get category-matched templates,
  // but we need deterministic selection, so we replicate the category scoring
  // logic and select deterministically from the matching pool.
  const lower = idea.toLowerCase();

  const categoryScores: Record<HookCategory, number> = {
    educational: 0,
    comparison: 0,
    myth_busting: 0,
    storytelling: 0,
    authority: 0,
    day_in_the_life: 0,
    random: 0,
  };

  // Educational signals
  if (/\b(how to|learn|teach|tips?|steps?|guide|tutorial|hack|secret|mistake|avoid)\b/i.test(lower)) categoryScores.educational += 3;
  if (/\b(beginner|start|basics?|101|simple|easy)\b/i.test(lower)) categoryScores.educational += 2;

  // Comparison signals
  if (/\b(vs\.?|versus|compare|better|worse|difference|same|both)\b/i.test(lower)) categoryScores.comparison += 3;
  if (/\b(cheap|expensive|budget|premium|option)\b/i.test(lower)) categoryScores.comparison += 2;

  // Myth busting signals
  if (/\b(myth|wrong|lie|truth|actually|stop|don'?t|never|overrated|toxic|scam)\b/i.test(lower)) categoryScores.myth_busting += 3;
  if (/\b(believe|think|assume|supposed|should)\b/i.test(lower)) categoryScores.myth_busting += 1;

  // Storytelling signals
  if (/\b(story|journey|started|quit|failed|messed up|changed|realized|confession|scared)\b/i.test(lower)) categoryScores.storytelling += 3;
  if (/\b(years? ago|months? ago|when i|my life|grew up|experience)\b/i.test(lower)) categoryScores.storytelling += 2;

  // Authority signals
  if (/\b(result|transform|client|customer|grew|built|made \$|revenue|proof|before.?after)\b/i.test(lower)) categoryScores.authority += 3;
  if (/\b(expert|professional|years of|decade|career)\b/i.test(lower)) categoryScores.authority += 2;

  // Day in the life signals
  if (/\b(day in|routine|morning|daily|schedule|24 hours|come with me|work with me)\b/i.test(lower)) categoryScores.day_in_the_life += 3;

  // Random / engagement signals
  if (/\b(flex|money|rich|broke|viral|trend|challenge|bet|dare)\b/i.test(lower)) categoryScores.random += 2;

  // Sort categories by score descending
  const ranked = (Object.entries(categoryScores) as [HookCategory, number][])
    .sort((a, b) => b[1] - a[1]);

  // Select top categories (same logic as getRelevantTemplates but deterministic)
  const selectedCategories = new Set<HookCategory>();
  selectedCategories.add(ranked[0][0]);
  selectedCategories.add(ranked[1][0]);
  selectedCategories.add("educational");

  if (ranked[0][1] === 0) {
    selectedCategories.add("storytelling");
    selectedCategories.add("random");
  }

  // Filter templates by selected categories
  const pool = HOOK_TEMPLATES.filter((t) => selectedCategories.has(t.category));

  // Determine hook count: 3–6 based on hash
  const hookCount = 3 + (hash % 4); // 3, 4, 5, or 6

  // Deterministically select templates
  const selected = deterministicSelect(pool, hookCount, hash);

  // Build HookVariant objects
  const hooks: HookVariant[] = selected.map((tmpl, i) => {
    const filledText = fillTemplate(tmpl.template, keywords, hash + i);
    const trigger = CATEGORY_TRIGGER_MAP[tmpl.category];

    return {
      hook_text: filledText,
      trigger,
    };
  });

  return hooks;
}
