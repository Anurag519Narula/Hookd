import type { ConversationSession, ConversationMessage } from "../types/index";
import { authHeaders } from "./auth";

export async function listConversations(): Promise<ConversationSession[]> {
  const res = await fetch("/api/conversations", {
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Failed to list conversations");
  }
  return res.json() as Promise<ConversationSession[]>;
}

export async function getConversation(id: string): Promise<ConversationSession> {
  const res = await fetch(`/api/conversations/${encodeURIComponent(id)}`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Failed to fetch conversation");
  }
  return res.json() as Promise<ConversationSession>;
}

export async function createConversation(title: string): Promise<ConversationSession> {
  const res = await fetch("/api/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ title }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? "Failed to create conversation");
  return body as ConversationSession;
}

export async function appendMessages(id: string, messages: ConversationMessage[]): Promise<void> {
  const res = await fetch(`/api/conversations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Failed to append messages");
  }
}

export async function deleteConversation(id: string): Promise<void> {
  const res = await fetch(`/api/conversations/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Failed to delete conversation");
  }
}
