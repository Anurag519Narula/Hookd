import { useState, useEffect, useRef, useCallback } from "react";
import type { Idea } from "../types/index";
import { authHeaders } from "../api/auth";

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_MS = 30000;

export function useVault() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track active poll timers: ideaId -> { intervalId, startTime }
  const pollTimers = useRef<Map<string, { intervalId: ReturnType<typeof setInterval>; startTime: number }>>(new Map());

  const stopPolling = useCallback((id: string) => {
    const entry = pollTimers.current.get(id);
    if (entry) {
      clearInterval(entry.intervalId);
      pollTimers.current.delete(id);
    }
  }, []);

  const startPolling = useCallback(
    (id: string) => {
      if (pollTimers.current.has(id)) return;

      const startTime = Date.now();
      const intervalId = setInterval(async () => {
        if (Date.now() - startTime >= POLL_MAX_MS) {
          stopPolling(id);
          return;
        }
        try {
          const res = await fetch(`/api/ideas/${id}`, { headers: { ...authHeaders() } });
          if (!res.ok) return;
          const updated: Idea = await res.json();
          if (updated.tags !== null) {
            setIdeas((prev) => prev.map((idea) => (idea.id === id ? updated : idea)));
            stopPolling(id);
          }
        } catch {
          // ignore transient errors; keep polling
        }
      }, POLL_INTERVAL_MS);

      pollTimers.current.set(id, { intervalId, startTime });
    },
    [stopPolling]
  );

  // Fetch all ideas on mount
  useEffect(() => {
    let cancelled = false;

    const fetchIdeas = async () => {
      try {
        const res = await fetch("/api/ideas", { headers: { ...authHeaders() } });
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            throw new Error("AUTH_ERROR");
          }
          if (res.status >= 500) {
            throw new Error("SERVER_ERROR");
          }
          throw new Error(`HTTP_${res.status}`);
        }
        const data: Idea[] = await res.json();
        if (!cancelled) {
          setIdeas(data);
          setLoading(false);
          // Start polling for any untagged ideas
          data.forEach((idea) => {
            if (idea.tags === null) startPolling(idea.id);
          });
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "UNKNOWN";
          // Distinguish network errors from HTTP errors
          const isNetwork = err instanceof TypeError && (err as TypeError).message.toLowerCase().includes("fetch");
          setError(isNetwork ? "NETWORK_ERROR" : msg);
          setLoading(false);
        }
      }
    };

    fetchIdeas();

    return () => {
      cancelled = true;
    };
  }, [startPolling]);

  // Cleanup all poll timers on unmount
  useEffect(() => {
    return () => {
      pollTimers.current.forEach((entry) => clearInterval(entry.intervalId));
      pollTimers.current.clear();
    };
  }, []);

  const addIdea = useCallback(
    (idea: Idea) => {
      setIdeas((prev) => [idea, ...prev]);
      if (idea.tags === null) startPolling(idea.id);
    },
    [startPolling]
  );

  const updateIdea = useCallback((id: string, updates: Partial<Idea>) => {
    setIdeas((prev) => prev.map((idea) => (idea.id === id ? { ...idea, ...updates } : idea)));
  }, []);

  const removeIdea = useCallback(
    (id: string) => {
      stopPolling(id);
      setIdeas((prev) => prev.filter((idea) => idea.id !== id));
    },
    [stopPolling]
  );

  return { ideas, addIdea, updateIdea, removeIdea, loading, error };
}
