import { useState } from "react";
import type { Platform, GenerationState, CardState } from "../types/index";
import { generateContent } from "../api/generate";
import { regenerateContent } from "../api/regenerate";

const ALL_PLATFORMS: Platform[] = ["instagram", "linkedin", "reels", "youtube_shorts"];

function initialState(): GenerationState {
  return {
    instagram:      { status: "idle" },
    linkedin:       { status: "idle" },
    reels:          { status: "idle" },
    youtube_shorts: { status: "idle" },
  };
}

export function useGenerate() {
  const [generation, setGeneration] = useState<GenerationState>(initialState);
  const [rawContent, setRawContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(ALL_PLATFORMS);

  const generate = async (): Promise<void> => {
    // Only set loading for selected platforms; leave others idle
    setGeneration((prev) => {
      const next = { ...prev };
      for (const p of ALL_PLATFORMS) {
        next[p] = selectedPlatforms.includes(p) ? { status: "loading" } : { status: "idle" };
      }
      return next;
    });

    try {
      const result = await generateContent(rawContent, selectedPlatforms);

      setGeneration((prev) => {
        const next = { ...prev };
        for (const platform of selectedPlatforms) {
          const platformResult = result[platform];
          if (!platformResult) {
            next[platform] = { status: "error", message: "No response from server" };
          } else if ("error" in platformResult) {
            next[platform] = { status: "error", message: platformResult.error };
          } else {
            next[platform] = { status: "success", content: platformResult.content };
          }
        }
        return next;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setGeneration((prev) => {
        const next = { ...prev };
        for (const p of selectedPlatforms) {
          next[p] = { status: "error", message };
        }
        return next;
      });
    }
  };

  const regenerate = async (platform: Platform): Promise<void> => {
    setGeneration((prev) => ({
      ...prev,
      [platform]: { status: "loading" } as CardState,
    }));

    try {
      const result = await regenerateContent(platform, rawContent);

      setGeneration((prev) => ({
        ...prev,
        [platform]: result.error
          ? ({ status: "error", message: result.error } as CardState)
          : ({ status: "success", content: result.content ?? "" } as CardState),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setGeneration((prev) => ({
        ...prev,
        [platform]: { status: "error", message } as CardState,
      }));
    }
  };

  const reset = (): void => {
    setGeneration(initialState());
    setRawContent("");
    // Keep selectedPlatforms as user last set them
  };

  return {
    generation,
    rawContent,
    setRawContent,
    selectedPlatforms,
    setSelectedPlatforms,
    generate,
    regenerate,
    reset,
  };
}
