import { useState, useEffect, useCallback } from "react";
import type { ConversationSession } from "../types/index";
import {
  listConversations,
  createConversation,
  deleteConversation,
} from "../api/conversations";

export interface UseConversationsResult {
  sessions: ConversationSession[];
  loading: boolean;
  error: string | null;
  createSession: (title: string) => Promise<ConversationSession>;
  deleteSession: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useConversations(): UseConversationsResult {
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await listConversations();
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  const createSession = useCallback(async (title: string): Promise<ConversationSession> => {
    const session = await createConversation(title);
    setSessions((prev) => [session, ...prev]);
    return session;
  }, []);

  const deleteSession = useCallback(async (id: string): Promise<void> => {
    await deleteConversation(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    await fetchSessions();
  }, [fetchSessions]);

  return { sessions, loading, error, createSession, deleteSession, refresh };
}
