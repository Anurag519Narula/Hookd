import { authHeaders } from "./auth";

export async function generateCaption(params: {
  hook: string;
  raw_idea: string;
  platform: string;
  niche: string;
  anchor_keywords: string[];
  language: string;
  idea_id?: string;
}): Promise<{ content: string }> {
  const response = await fetch("/api/captions", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `HTTP error: ${response.status}`);
  }

  return response.json() as Promise<{ content: string }>;
}

export async function regenerateCaption(params: {
  original_caption: string;
  feedback: string;
  platform: string;
  niche: string;
  anchor_keywords: string[];
  language: string;
  idea_id?: string;
}): Promise<{ content: string }> {
  const response = await fetch("/api/captions/regenerate", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `HTTP error: ${response.status}`);
  }

  return response.json() as Promise<{ content: string }>;
}
