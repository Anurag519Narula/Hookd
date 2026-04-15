// Feature: idea-vault-and-hook-engine, Property 12: Settings Round-Trip via localStorage

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import * as fc from "fast-check";
import { useSettings } from "./useSettings";
import type { CreatorSettings } from "../types/index";

const STORAGE_KEY = "repurpose-ai-settings";

beforeEach(() => {
  localStorage.clear();
});

describe("useSettings — P12: Settings round-trip via localStorage", () => {
  it("saving settings and re-mounting the hook returns deeply equal value", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          niche: fc.string(),
          sub_niche: fc.string(),
          language: fc.string(),
          platform_priority: fc.shuffledSubarray(
            ["instagram", "linkedin", "reels", "youtube_shorts"] as const,
            { minLength: 4, maxLength: 4 }
          ),
        }),
        async (settings) => {
          localStorage.clear();

          // Mount hook and save settings
          const { result: r1, unmount: u1 } = renderHook(() => useSettings());
          act(() => {
            r1.current[1](settings as CreatorSettings);
          });
          u1();

          // Re-mount hook — should read from localStorage
          const { result: r2, unmount: u2 } = renderHook(() => useSettings());
          const [loaded] = r2.current;
          u2();

          expect(loaded).toEqual(settings);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("defaults are returned when localStorage is empty", () => {
    localStorage.clear();
    const { result } = renderHook(() => useSettings());
    const [settings] = result.current;
    expect(settings.language).toBe("English");
    expect(settings.platform_priority).toEqual(["instagram", "linkedin", "reels", "youtube_shorts"]);
  });

  it("falls back to defaults when localStorage contains malformed JSON", () => {
    localStorage.setItem(STORAGE_KEY, "not-valid-json{{{");
    const { result } = renderHook(() => useSettings());
    const [settings] = result.current;
    expect(settings.language).toBe("English");
  });
});
