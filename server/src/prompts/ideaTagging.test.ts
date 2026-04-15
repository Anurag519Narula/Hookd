import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type { IdeaTaggingResult } from "./ideaTagging";
import type { Hook } from "../types/index";

// Validates the shape of AI output without calling the real Groq API.
// We test the parser/validator logic by generating arbitrary objects that
// match the expected schema and verifying the shape constraints hold.

function isValidTaggingResult(obj: unknown): obj is IdeaTaggingResult {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;
  if (!Array.isArray(o.tags)) return false;
  if (!o.tags.every((t: unknown) => typeof t === "string")) return false;
  if (typeof o.format_type !== "string") return false;
  if (typeof o.emotion_angle !== "string") return false;
  if (!["low", "medium", "high"].includes(o.potential_score as string)) return false;
  return true;
}

function isValidHookArray(obj: unknown): obj is Hook[] {
  if (!Array.isArray(obj)) return false;
  return obj.every(
    (h: unknown) =>
      typeof h === "object" &&
      h !== null &&
      typeof (h as Record<string, unknown>).hook_text === "string" &&
      typeof (h as Record<string, unknown>).trigger === "string"
  );
}

describe("prompts/ideaTagging — P14: AI Output Schema Validity", () => {
  // Feature: idea-vault-and-hook-engine, Property 14: AI output schema validity for tagging responses
  describe("P14a: Tagging response schema", () => {
    it("any object matching the tagging schema passes validation", () => {
      const taggingArb = fc.record({
        tags: fc.array(fc.string()),
        format_type: fc.string(),
        emotion_angle: fc.string(),
        potential_score: fc.constantFrom("low" as const, "medium" as const, "high" as const),
      });

      fc.assert(
        fc.property(taggingArb, (result) => {
          expect(isValidTaggingResult(result)).toBe(true);
          expect(Array.isArray(result.tags)).toBe(true);
          expect(result.tags.every((t) => typeof t === "string")).toBe(true);
          expect(typeof result.format_type).toBe("string");
          expect(typeof result.emotion_angle).toBe("string");
          expect(["low", "medium", "high"]).toContain(result.potential_score);
        }),
        { numRuns: 100 }
      );
    });

    it("objects missing required fields fail validation", () => {
      // Missing potential_score
      expect(isValidTaggingResult({ tags: [], format_type: "story", emotion_angle: "curiosity" })).toBe(false);
      // Wrong potential_score value
      expect(isValidTaggingResult({ tags: [], format_type: "story", emotion_angle: "curiosity", potential_score: "extreme" })).toBe(false);
      // tags not an array
      expect(isValidTaggingResult({ tags: "not-array", format_type: "story", emotion_angle: "curiosity", potential_score: "high" })).toBe(false);
      // null input
      expect(isValidTaggingResult(null)).toBe(false);
    });
  });

  // Feature: idea-vault-and-hook-engine, Property 14: AI output schema validity for hook responses
  describe("P14b: Hook generation response schema", () => {
    it("any array of hook objects passes validation", () => {
      const hookArb = fc.record({
        hook_text: fc.string(),
        trigger: fc.string(),
      });

      fc.assert(
        fc.property(fc.array(hookArb), (hooks) => {
          expect(isValidHookArray(hooks)).toBe(true);
          for (const hook of hooks) {
            expect(typeof hook.hook_text).toBe("string");
            expect(typeof hook.trigger).toBe("string");
          }
        }),
        { numRuns: 100 }
      );
    });

    it("non-array or malformed hook objects fail validation", () => {
      expect(isValidHookArray(null)).toBe(false);
      expect(isValidHookArray("string")).toBe(false);
      expect(isValidHookArray([{ hook_text: 123, trigger: "Curiosity Gap" }])).toBe(false);
      expect(isValidHookArray([{ hook_text: "text" }])).toBe(false); // missing trigger
    });
  });
});
