export type Platform = "instagram" | "linkedin" | "reels" | "youtube_shorts";

export type CardState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; content: string }
  | { status: "error"; message: string };

export type GenerationState = Record<Platform, CardState>;

export interface GenerateRequest {
  rawContent: string;
  platforms: Platform[];
}

export type GenerateResponse = Partial<Record<Platform, { content: string } | { error: string }>>;

export interface RegenerateResponse {
  content?: string;
  error?: string;
}

export type Screen = "input" | "loading" | "results";

export interface Hook {
  hook_text: string;
  trigger: string;
}

export interface Idea {
  id: string;
  raw_text: string;
  created_at: number;
  tags: string[] | null;
  format_type: string | null;
  emotion_angle: string | null;
  potential_score: "low" | "medium" | "high" | null;
  hooks: Hook[] | null;
  captions: Record<string, string> | null;
  status: "raw" | "developed" | "used";
}

export interface CreatorSettings {
  niche: string;
  sub_niche: string;
  language: string;
  platform_priority: Platform[];
}
