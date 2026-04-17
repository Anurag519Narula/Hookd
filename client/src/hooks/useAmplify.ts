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
      console.log("📨 sendMessage called with prompt:", prompt.slice(0, 50));
      setIsLoading(true);
      setError(null);

      let sessionId = activeSessionId;

      try {
        // Step 1: create a new session if none is active
        if (sessionId === null) {
          console.log("📨 Creating new session");
          const title = prompt.slice(0, 60);
          const session = await createSession(title);
          sessionId = session.id;
          console.log("📨 New session created:", sessionId);
          setActiveSessionId(sessionId);
        } else {
          console.log("📨 Using existing session:", sessionId);
        }

        // Step 2: create user message
        const userMessage: ConversationMessage = {
          role: "user",
          content: prompt,
          timestamp: Date.now(),
        };
        console.log("📤 User message:", userMessage);

        // Step 3: call generateCaptions
        const captionResult: CaptionResult = await generateCaptions({
          prompt,
          conversation_id: sessionId,
          platforms,
          caption_length: captionLength,
        });

        // Step 4: create assistant message
        const assistantMessage: ConversationMessage = {
          role: "assistant",
          content: JSON.stringify(captionResult),
          timestamp: Date.now(),
        };
        console.log("📥 Assistant message:", assistantMessage);

        // Step 5: add both messages to state at once
        console.log("📝 Adding both messages to conversation");
        setMessages((prev) => {
          const updated = [...prev, userMessage, assistantMessage];
          console.log("📝 Final messages count:", updated.length);
          return updated;
        });

        // Step 6: persist both messages server-side
        await appendMessages(sessionId, [userMessage, assistantMessage]);
      } catch (err) {
        console.error("❌ Error in sendMessage:", err);
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
