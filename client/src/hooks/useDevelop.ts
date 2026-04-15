import { useState, useCallback, useEffect } from "react";
import type { Hook } from "../types/index";
import { generateHooks as apiGenerateHooks } from "../api/hooks";
import { generateCaption as apiGenerateCaption, regenerateCaption as apiRegenerateCaption } from "../api/captions";
import { getIdea, updateIdea } from "../api/ideas";

interface CaptionState {
  content: string | null;
  loading: boolean;
  error: string | null;
}

interface GenerateHooksParams {
  raw_idea: string;
  niche: string;
  sub_niche: string;
  language: string;
}

interface GenerateCaptionParams {
  hook: string;
  raw_idea: string;
  platform: string;
  niche: string;
  anchor_keywords: string[];
  language: string;
}

interface RegenerateCaptionParams {
  original_caption: string;
  feedback: string;
  platform: string;
  niche: string;
  anchor_keywords: string[];
  language: string;
}

export function useDevelop(initialIdeaId?: string) {
  const [ideaId, setIdeaId] = useState<string | undefined>(initialIdeaId);
  const [hooks, setHooks] = useState<Hook[] | null>(null);
  const [hooksLoading, setHooksLoading] = useState(false);
  const [hooksError, setHooksError] = useState<string | null>(null);
  const [selectedHook, setSelectedHook] = useState<Hook | null>(null);
  const [captions, setCaptions] = useState<Record<string, CaptionState>>({});

  const [rawText, setRawText] = useState<string | null>(null);

  useEffect(() => {
    if (initialIdeaId) {
      getIdea(initialIdeaId).then((idea) => {
        if (idea.raw_text) setRawText(idea.raw_text);
        if (idea.hooks) setHooks(idea.hooks);
        if (idea.captions) {
          const loadedCaptions: Record<string, CaptionState> = {};
          Object.entries(idea.captions).forEach(([platform, content]) => {
            loadedCaptions[platform] = { content, loading: false, error: null };
          });
          setCaptions(loadedCaptions);
        }
        if (idea.selected_hook) {
          // Find the hook in our list if it exists
          const found = idea.hooks?.find(h => h.hook_text === idea.selected_hook);
          if (found) setSelectedHook(found);
          else if (idea.selected_hook) setSelectedHook({ hook_text: idea.selected_hook, trigger: "Custom" });
        }
      }).catch(err => {
        console.error("Failed to load cached results:", err);
      });
    }
  }, [initialIdeaId]);

  const generateHooks = useCallback(async (params: GenerateHooksParams): Promise<string> => {
    setHooksLoading(true);
    setHooksError(null);
    setHooks(null);
    setSelectedHook(null);
    setCaptions({});

    try {
      const { hooks: data, idea_id } = await apiGenerateHooks({ ...params, idea_id: ideaId });
      setHooks(data);
      setIdeaId(idea_id);
      return idea_id;
    } catch (err) {
      setHooksError(err instanceof Error ? err.message : "Hook generation failed");
      throw err;
    } finally {
      setHooksLoading(false);
    }
  }, [ideaId]);

  const selectHook = useCallback((hook: Hook): void => {
    if (selectedHook?.hook_text === hook.hook_text) return;

    // Clear old captions since we have a new hook
    setCaptions({});
    setSelectedHook(hook);

    // Persist new choice to DB
    if (ideaId) {
      updateIdea(ideaId, { selected_hook: hook.hook_text }).catch(err => {
        console.error("Failed to save hook selection:", err);
      });
    }
  }, [selectedHook, ideaId]);

  const generateCaption = useCallback(async (params: GenerateCaptionParams): Promise<void> => {
    const { platform } = params;

    setCaptions((prev) => ({
      ...prev,
      [platform]: { content: null, loading: true, error: null },
    }));

    try {
      const data = await apiGenerateCaption({ ...params, idea_id: ideaId });
      setCaptions((prev) => ({
        ...prev,
        [platform]: { content: data.content, loading: false, error: null },
      }));
    } catch (err) {
      setCaptions((prev) => ({
        ...prev,
        [platform]: {
          content: null,
          loading: false,
          error: err instanceof Error ? err.message : "Caption generation failed",
        },
      }));
    }
  }, [ideaId]);

  const regenerateCaption = useCallback(async (params: RegenerateCaptionParams): Promise<void> => {
    const { platform } = params;

    setCaptions((prev) => ({
      ...prev,
      [platform]: { content: prev[platform]?.content ?? null, loading: true, error: null },
    }));

    try {
      const data = await apiRegenerateCaption({ ...params, idea_id: ideaId });
      setCaptions((prev) => ({
        ...prev,
        [platform]: { content: data.content, loading: false, error: null },
      }));
    } catch (err) {
      setCaptions((prev) => ({
        ...prev,
        [platform]: {
          content: prev[platform]?.content ?? null,
          loading: false,
          error: err instanceof Error ? err.message : "Caption regeneration failed",
        },
      }));
    }
  }, [ideaId]);

  const updateHooks = useCallback(async (newHooks: Hook[]): Promise<void> => {
    setHooks(newHooks);
    if (ideaId) {
      await updateIdea(ideaId, { hooks: newHooks });
    }
  }, [ideaId]);

  return {
    ideaId,
    rawText,
    hooks,
    hooksLoading,
    hooksError,
    selectedHook,
    captions,
    generateHooks,
    updateHooks,
    selectHook,
    generateCaption,
    regenerateCaption,
  };
}
