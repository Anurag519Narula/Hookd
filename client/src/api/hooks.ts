import type { Hook } from "../types/index";
import { authHeaders } from "./auth";

export async function generateHooks(params: {
  raw_idea: string;
  niche: string;
  sub_niche: string;
  language: string;
  idea_id?: string;
}): Promise<{ hooks: Hook[]; idea_id: string }> {
  const response = await fetch("/api/hooks", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `HTTP error: ${response.status}`);
  }

  return response.json() as Promise<{ hooks: Hook[]; idea_id: string }>;
}
