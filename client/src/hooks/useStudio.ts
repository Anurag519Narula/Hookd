import { useState, useCallback } from "react";
import type { Script, ScriptFormat, HookVariant, ScriptBeat } from "../types/index";
import { generateHooks, generateScriptFromHook, regenerateScript } from "../api/studio";
import { authHeaders } from "../api/auth";

export type StudioPhase = "idle" | "hooks_ready" | "script_ready";

export interface UseStudioResult {
  // State
  phase: StudioPhase;
  hookVariants: HookVariant[];
  script: Script | null;
  isGeneratingHooks: boolean;
  isGeneratingScript: boolean;
  isRegenerating: boolean;
  error: string | null;
  // Stored idea/format for regeneration calls
  currentIdea: string;
  currentFormat: ScriptFormat;
  // Actions
  generateHookVariants: (
    idea: string,
    format: ScriptFormat,
    niche?: string,
    sub_niche?: string,
    language?: string
  ) => Promise<void>;
  buildScriptFromHook: (hook: HookVariant, index: number) => Promise<void>;
  tryAnotherHook: (index: number) => Promise<void>;
  regenerateWithFeedback: (feedback: string) => Promise<void>;
  saveToVault: () => Promise<void>;
  reset: () => void;
}

export function useStudio(): UseStudioResult {
  const [phase, setPhase] = useState<StudioPhase>("idle");
  const [hookVariants, setHookVariants] = useState<HookVariant[]>([]);
  const [script, setScript] = useState<Script | null>(null);
  const [isGeneratingHooks, setIsGeneratingHooks] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIdea, setCurrentIdea] = useState("");
  const [currentFormat, setCurrentFormat] = useState<ScriptFormat>("reels");
  const [currentNiche, setCurrentNiche] = useState<string | undefined>();
  const [currentSubNiche, setCurrentSubNiche] = useState<string | undefined>();
  const [currentLanguage, setCurrentLanguage] = useState<string | undefined>();

  // ── Step 1: Generate hooks only ───────────────────────────────────────────

  const generateHookVariants = useCallback(
    async (
      idea: string,
      format: ScriptFormat,
      niche?: string,
      sub_niche?: string,
      language?: string
    ): Promise<void> => {
      setIsGeneratingHooks(true);
      setError(null);
      setHookVariants([]);
      setScript(null);
      setPhase("idle");
      setCurrentIdea(idea);
      setCurrentFormat(format);
      setCurrentNiche(niche);
      setCurrentSubNiche(sub_niche);
      setCurrentLanguage(language);

      try {
        const result = await generateHooks({ idea, format, niche, sub_niche, language });
        setHookVariants(result.hook_variants ?? []);
        setPhase("hooks_ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Hook generation failed");
      } finally {
        setIsGeneratingHooks(false);
      }
    },
    []
  );

  // ── Step 2: Build script from selected hook ────────────────────────────────

  const buildScriptFromHook = useCallback(
    async (hook: HookVariant, _index: number): Promise<void> => {
      if (!currentIdea) return;
      setIsGeneratingScript(true);
      setError(null);

      try {
        const result = await generateScriptFromHook({
          idea: currentIdea,
          format: currentFormat,
          niche: currentNiche,
          sub_niche: currentSubNiche,
          language: currentLanguage,
          selected_hook: hook,
        });

        setScript({
          format: currentFormat,
          selected_hook: hook,
          hook_variants: hookVariants,
          beats: result.beats,
          cta: result.cta,
          word_count: result.word_count,
        });
        setPhase("script_ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Script generation failed");
      } finally {
        setIsGeneratingScript(false);
      }
    },
    [currentIdea, currentFormat, currentNiche, currentSubNiche, currentLanguage, hookVariants]
  );

  // ── Try another hook (replace one slot) ───────────────────────────────────

  const tryAnotherHook = useCallback(
    async (index: number): Promise<void> => {
      if (!currentIdea) return;
      setIsRegenerating(true);
      setError(null);

      try {
        const existingTriggers = hookVariants.map((h) => h.trigger);
        const result = await regenerateScript({
          idea: currentIdea,
          format: currentFormat,
          current_hooks: hookVariants,
          regenerate_target: "hook",
          hook_index: index,
        });

        // Server returns the new hook object directly
        const newHook = result as unknown as HookVariant;
        if (!newHook?.hook_text) return;

        setHookVariants((prev) => {
          const updated = [...prev];
          updated[index] = newHook;
          return updated;
        });

        // Also update hook_variants in script if script exists
        setScript((prev) => {
          if (!prev) return prev;
          const updated = [...prev.hook_variants];
          updated[index] = newHook;
          return { ...prev, hook_variants: updated };
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Hook regeneration failed");
      } finally {
        setIsRegenerating(false);
      }
    },
    [currentIdea, currentFormat, hookVariants]
  );

  // ── Regenerate script body with feedback ──────────────────────────────────

  const regenerateWithFeedback = useCallback(
    async (feedback: string): Promise<void> => {
      if (!script || !currentIdea) return;
      setIsRegenerating(true);
      setError(null);

      try {
        const result = await regenerateScript({
          idea: currentIdea,
          format: currentFormat,
          current_hooks: script.hook_variants,
          selected_hook: script.selected_hook,
          feedback,
          regenerate_target: "script",
        });

        setScript((prev) =>
          prev
            ? {
                ...prev,
                beats: (result.beats as ScriptBeat[]) ?? prev.beats,
                cta: result.cta ?? prev.cta,
                word_count: result.word_count ?? prev.word_count,
              }
            : prev
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Script regeneration failed");
      } finally {
        setIsRegenerating(false);
      }
    },
    [script, currentIdea, currentFormat]
  );

  // ── Save to vault ──────────────────────────────────────────────────────────

  const saveToVault = useCallback(async (): Promise<void> => {
    if (!script) return;

    const rawText = [
      script.selected_hook.hook_text,
      ...script.beats.map((b) => `[${b.timestamp}] ${b.text}`),
      script.cta,
    ].join("\n\n");

    const res = await fetch("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        raw_text: rawText,
        format_type: script.format,
        hooks: script.hook_variants.map((h) => ({ hook_text: h.hook_text, trigger: h.trigger })),
        status: "developed",
      }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((body as { error?: string }).error ?? "Failed to save to vault");
  }, [script]);

  // ── Reset ──────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setPhase("idle");
    setHookVariants([]);
    setScript(null);
    setError(null);
    setCurrentIdea("");
  }, []);

  return {
    phase,
    hookVariants,
    script,
    isGeneratingHooks,
    isGeneratingScript,
    isRegenerating,
    error,
    currentIdea,
    currentFormat,
    generateHookVariants,
    buildScriptFromHook,
    tryAnotherHook,
    regenerateWithFeedback,
    saveToVault,
    reset,
  };
}
