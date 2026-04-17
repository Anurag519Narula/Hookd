import { useState } from "react";
import type { CreatorSettings, Platform } from "../types/index";

const STORAGE_KEY = "hookd-settings";

const DEFAULTS: CreatorSettings = {
  niche: "",
  sub_niche: "",
  language: "English",
  platform_priority: ["instagram", "linkedin", "reels", "youtube_shorts"],
};

const VALID_PLATFORMS: Platform[] = ["instagram", "linkedin", "reels", "youtube_shorts"];

function loadSettings(): CreatorSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS, platform_priority: [...DEFAULTS.platform_priority] };
    const parsed = JSON.parse(raw) as CreatorSettings;

    // Migrate: remove any invalid platforms (e.g. old "twitter" entries)
    const validPriority = (parsed.platform_priority ?? []).filter(
      (p): p is Platform => VALID_PLATFORMS.includes(p as Platform)
    );
    // If after filtering we have fewer than 4, fill with missing valid platforms
    const missing = VALID_PLATFORMS.filter((p) => !validPriority.includes(p));
    const finalPriority = [...validPriority, ...missing] as CreatorSettings["platform_priority"];

    return { ...parsed, platform_priority: finalPriority };
  } catch {
    return { ...DEFAULTS, platform_priority: [...DEFAULTS.platform_priority] };
  }
}

/**
 * @deprecated Use `useCreatorProfile` from `./useCreatorProfile` instead.
 * This hook persists settings only in localStorage and is not synced with the server.
 */
export function useSettings(): [CreatorSettings, (settings: CreatorSettings) => void] {
  const [settings, setSettingsState] = useState<CreatorSettings>(loadSettings);

  const setSettings = (next: CreatorSettings): void => {
    setSettingsState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore write errors
    }
  };

  return [settings, setSettings];
}
