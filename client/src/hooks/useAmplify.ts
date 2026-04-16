import { useState, useEffect, useCallback } from "react";
import type { ConversationMessage, CaptionResult, Platform, CaptionLength } from "../types/index";
import { getConversation, appendMessages } from "../api/conversations";
import { generateCaptions } from "../api/amplify";
import { useConversations } from "./useConversations";

export interface UseAmplifyResult {
  activeSessionId: string | null;
  messages: ConversationMessage[];
  isLoading: boolean;
  isSessionLoading: boolean;
  error: string | null;
  sendMessage: (
    prompt: string,
    platforms: Platform[],
    captionLength?: CaptionLength
  ) => Promise<void>;
  startNewSession: () => void;
  loadSession: (id: string) => Promise<void>;
}

export function useAmplify(): UseAmplifyResult {
  const { sessions, createSession } = useConversations();

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSessionLoading, setIsSessionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);

  // On mount: load the most recent session once sessions are available
  useEffect(() => {
    if (initialized) return;
    if (sessions.length === 0) return;

    const mostRecent = sessions[0];
    setInitialized(true);

    void (async () => {
      setIsSessionLoading(true);
      try {
        const session = await getConversation(mostRecent.id);
        setActiveSessionId(session.id);
        setMessages(session.messages ?? []);
      } catch {
        // If we can't load the session, start fresh
        setActiveSessionId(null);
        setMessages([]);
      } finally {
        setIsSessionLoading(false);
      }
    })();
  }, [sessions, initialized]);

  const sendMessage = useCallback(
    async (
      prompt: string,
      platforms: Platform[],
      captionLength?: CaptionLength
    ): Promise<void> => {
      setIsLoading(true);
      setError(null);

      let sessionId = activeSessionId;

      try {
        // Step 1: create a new session if none is active
        if (sessionId === null) {
          const title = prompt.slice(0, 60);
          const session = await createSession(title);
          sessionId = session.id;
          setActiveSessionId(sessionId);
        }

        // Step 2: append user message to local state immediately
        const userMessage: ConversationMessage = {
          role: "user",
          content: prompt,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, userMessage]);

        // Step 3: call generateCaptions
        const captionResult: CaptionResult = await generateCaptions({
          prompt,
          conversation_id: sessionId,
          platforms,
          caption_length: captionLength,
        });

        // Step 4: append assistant message to local state
        const assistantMessage: ConversationMessage = {
          role: "assistant",
          content: JSON.stringify(captionResult),
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Step 5: persist both messages server-side
        await appendMessages(sessionId, [userMessage, assistantMessage]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
      } finally {
        setIsLoading(false);
      }
    },
    [activeSessionId, createSession]
  );

  const startNewSession = useCallback((): void => {
    setActiveSessionId(null);
    setMessages([]);
    setError(null);
  }, []);

  const loadSession = useCallback(async (id: string): Promise<void> => {
    setError(null);
    try {
      const session = await getConversation(id);
      setActiveSessionId(session.id);
      setMessages(session.messages ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load session");
    }
  }, []);

  return {
    activeSessionId,
    messages,
    isLoading,
    isSessionLoading,
    error,
    sendMessage,
    startNewSession,
    loadSession,
  };
}
