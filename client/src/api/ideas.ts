import type { Idea } from "../types/index";
import { authHeaders } from "./auth";

export async function createIdea(raw_text: string): Promise<Idea> {
  const response = await fetch("/api/ideas", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ raw_text }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `HTTP error: ${response.status}`);
  }

  return response.json() as Promise<Idea>;
}

export async function getIdeas(filters?: {
  score?: string;
  format?: string;
  status?: string;
}): Promise<Idea[]> {
  const params = new URLSearchParams();
  if (filters?.score) params.set("score", filters.score);
  if (filters?.format) params.set("format", filters.format);
  if (filters?.status) params.set("status", filters.status);

  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await fetch(`/api/ideas${query}`, {
    headers: { ...authHeaders() },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `HTTP error: ${response.status}`);
  }

  return response.json() as Promise<Idea[]>;
}

export async function getIdea(id: string): Promise<Idea> {
  const response = await fetch(`/api/ideas/${id}`, {
    headers: { ...authHeaders() },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `HTTP error: ${response.status}`);
  }

  return response.json() as Promise<Idea>;
}

export async function updateIdea(id: string, updates: Partial<Idea>): Promise<Idea> {
  const response = await fetch(`/api/ideas/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `HTTP error: ${response.status}`);
  }

  return response.json() as Promise<Idea>;
}

export async function deleteIdea(id: string): Promise<void> {
  const response = await fetch(`/api/ideas/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `HTTP error: ${response.status}`);
  }
}
