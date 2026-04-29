/**
 * Instagram Intelligence V1 Types
 *
 * Additive types for the Instagram Reels intelligence layer.
 * These are computed from existing signals + LLM generation.
 */

export type ReelPotentialLabel = "High" | "Medium" | "Low";
export type HookStrengthLabel = "Strong" | "Moderate" | "Weak";
export type SaveabilityLabel = "High" | "Medium" | "Low";
export type SaturationLabel = "High" | "Medium" | "Low";

export type ReelFormat =
  | "Talking Head"
  | "Faceless B-roll"
  | "Carousel Reel"
  | "Voiceover Story"
  | "Screen Recording"
  | "Before / After Style"
  | "Green Screen Commentary";

export type CaptionStyle =
  | "Bold"
  | "Curious"
  | "Authority"
  | "Personal"
  | "Minimal"
  | "Storytelling";

export interface InstagramSignals {
  reelPotential: {
    score: number; // 0–100
    label: ReelPotentialLabel;
  };

  hookStrength: {
    score: number; // 0–100
    label: HookStrengthLabel;
  };

  saveability: {
    score: number; // 0–100
    label: SaveabilityLabel;
  };

  saturation: {
    score: number; // 0–100
    label: SaturationLabel;
  };

  bestFormat: ReelFormat;
  captionStyle: CaptionStyle;
  hookIdeas: string[]; // 3 viral-ready hooks
  hashtagPack: string[]; // 8–12 tags
}
