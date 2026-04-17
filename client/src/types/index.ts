export type Platform = "instagram" | "linkedin" | "reels" | "youtube_shorts";
export type CaptionLength = "short" | "medium" | "long";
export type ScriptFormat = "reels" | "youtube_shorts";
export type PsychologicalTrigger =
  | "Curiosity Gap"
  | "Identity Threat"
  | "Controversy"
  | "Surprising Stat"
  | "Personal Story Angle"
  | "Pattern Interrupt";

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
  selected_hook: string | null;
  status: "raw" | "developed" | "used";
  insights?: object | null;
  insights_cached_at?: number | null;
}

export interface CreatorSettings {
  niche: string;
  sub_niche: string;
  language: string;
  platform_priority: Platform[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: number;
  niche: string | null;
  sub_niche: string | null;
  language: string;
  platform_priority: Platform[];
  onboarding_complete: boolean;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface ConversationSession {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
  messages?: ConversationMessage[];
}

export interface CaptionResult {
  captions: Partial<Record<Platform, { text: string; hashtags: string[] }>>;
  market_research?: string;
  real_time_data_available: boolean;
}

export interface HookVariant {
  hook_text: string;
  trigger: PsychologicalTrigger;
}

export interface ScriptBeat {
  timestamp: string;
  text: string;
}

export interface Script {
  format: ScriptFormat;
  selected_hook: HookVariant;
  hook_variants: HookVariant[];
  beats: ScriptBeat[];
  cta: string;
  word_count: number;
}

export interface AmplifyRequest {
  prompt: string;
  conversation_id: string | null;
  platforms: Platform[];
  caption_length?: CaptionLength;
}

export interface AuthResponse {
  token: string;
  user: User;
}
