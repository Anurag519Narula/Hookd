import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { ConversationSidebar } from "../components/ConversationSidebar";
import { ChatMessage } from "../components/ChatMessage";
import { TypingIndicator } from "../components/TypingIndicator";
import { PlatformToggle } from "../components/PlatformToggle";
import { LengthSelector } from "../components/LengthSelector";
import { TrendingHashtagsBar } from "../components/TrendingHashtagsBar";
import { useAmplify } from "../hooks/useAmplify";
import { useConversations } from "../hooks/useConversations";
import { useCreatorProfile } from "../hooks/useCreatorProfile";
import type { Platform, CaptionLength } from "../types";

const SendIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const SparkleIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"
      fill="var(--accent)"
      opacity="0.3"
    />
  </svg>
);

export function AmplifyScreen() {
  const location = useLocation();
  const { profile } = useCreatorProfile();
  const { sessions, loading: sessionsLoading, createSession, deleteSession } = useConversations();
  const { activeSessionId, messages, isLoading, isSessionLoading, error, sendMessage, startNewSession, loadSession } =
    useAmplify();

  // Get idea from navigation state
  const stateData = (location.state as { idea?: string; ideaId?: string }) ?? {};
  const ideaFromState = stateData.idea ?? "";

  // Input state
  const [prompt, setPrompt] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [captionLength, setCaptionLength] = useState<CaptionLength>("medium");

  // Textarea auto-resize ref
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Scroll-to-bottom ref
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Track the last idea we auto-sent to prevent duplicates
  const lastAutoSentIdeaRef = useRef<string | null>(null);

  // Pre-select platforms from user's platform_priority on mount
  useEffect(() => {
    if (profile?.platform_priority && profile.platform_priority.length > 0) {
      setSelectedPlatforms(profile.platform_priority);
    }
  }, [profile?.platform_priority]);

  // Auto-send idea if it came from Develop page
  useEffect(() => {
    if (!ideaFromState) {
      console.log("🎨 No idea from state, skipping auto-send");
      return;
    }

    // Check if we've already sent this exact idea in this session
    if (lastAutoSentIdeaRef.current === ideaFromState) {
      console.log("🎨 Already sent this exact idea, skipping");
      return;
    }

    console.log("🎨 AmplifyScreen auto-send effect running");
    console.log("🎨 ideaFromState:", ideaFromState.slice(0, 50));
    
    // Mark this idea as sent
    lastAutoSentIdeaRef.current = ideaFromState;
    
    console.log("✅ Auto-sending idea to Amplify");
    
    // Use selected platforms or default to Instagram if none selected
    const platformsToUse = selectedPlatforms.length > 0 
      ? selectedPlatforms 
      : ["instagram" as Platform];
    
    // Clear the prompt and textarea
    setPrompt("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    
    // Send immediately
    void sendMessage(ideaFromState, platformsToUse, captionLength);
  }, [ideaFromState, selectedPlatforms, captionLength, sendMessage]);

  // Auto-scroll to bottom when messages change or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    const lineHeight = 22; // approx px per line
    const maxHeight = lineHeight * 4 + 24; // 4 rows + padding
    el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
  };

  const canSend = prompt.trim().length > 0 && selectedPlatforms.length > 0 && !isLoading;

  const handleSend = useCallback(async () => {
    if (!canSend) return;
    const text = prompt.trim();
    setPrompt("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    await sendMessage(text, selectedPlatforms, captionLength);
  }, [canSend, prompt, selectedPlatforms, captionLength, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleNewConversation = () => {
    startNewSession();
  };

  const handleSelectSession = async (id: string) => {
    await loadSession(id);
  };

  const handleDeleteSession = async (id: string) => {
    await deleteSession(id);
    // If we deleted the active session, start fresh
    if (id === activeSessionId) {
      startNewSession();
    }
  };

  // Suppress unused warning — createSession is used by useAmplify internally
  void createSession;

  const hasMessages = messages.length > 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "var(--bg)",
        overflow: "hidden",
      }}
    >
      <Navbar />

      {/* Main layout: sidebar + chat area */}
      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Left sidebar */}
        <ConversationSidebar
          sessions={sessions}
          activeId={activeSessionId}
          onSelect={(id) => void handleSelectSession(id)}
          onNew={handleNewConversation}
          onDelete={(id) => void handleDeleteSession(id)}
          loading={sessionsLoading}
        />

        {/* Right: main chat area */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minWidth: 0,
          }}
        >
          {/* Scrollable message list */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "24px 24px 8px",
            }}
            aria-live="polite"
            aria-label="Conversation messages"
          >
            {!hasMessages ? (
              /* Empty state or session loading skeleton */
              isSessionLoading ? (
                /* Skeleton chat bubbles while initial session loads */
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    maxWidth: 720,
                    margin: "0 auto",
                    width: "100%",
                  }}
                  aria-busy="true"
                  aria-label="Loading conversation"
                >
                  {/* User message skeleton */}
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: "60%" }}>
                      <div className="shimmer-line" style={{ height: 14, borderRadius: 6 }} />
                      <div className="shimmer-line" style={{ height: 14, width: "75%", borderRadius: 6, alignSelf: "flex-end" }} />
                    </div>
                  </div>
                  {/* Assistant message skeleton */}
                  <div style={{ display: "flex", justifyContent: "flex-start" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: "70%" }}>
                      <div className="shimmer-line" style={{ height: 14, borderRadius: 6 }} />
                      <div className="shimmer-line" style={{ height: 14, borderRadius: 6 }} />
                      <div className="shimmer-line" style={{ height: 14, width: "55%", borderRadius: 6 }} />
                    </div>
                  </div>
                  {/* Second user message skeleton */}
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: "50%" }}>
                      <div className="shimmer-line" style={{ height: 14, borderRadius: 6 }} />
                    </div>
                  </div>
                </div>
              ) : (
              /* Empty state */
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  minHeight: 300,
                  textAlign: "center",
                  padding: "0 24px",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "var(--accent-subtle)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <SparkleIcon />
                </div>
                <div>
                  <h2
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: "var(--text)",
                      margin: "0 0 8px",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    What do you want to create today?
                  </h2>
                  <p
                    style={{
                      fontSize: 14,
                      color: "var(--text-3)",
                      margin: 0,
                      lineHeight: 1.6,
                      maxWidth: 400,
                    }}
                  >
                    Describe your idea, story, or topic below. Select your platforms and let Amplify
                    craft platform-native captions for you.
                  </p>
                </div>
                {/* Trending hashtags — click to pre-fill the input */}
                <div style={{ maxWidth: 560, width: "100%", textAlign: "left" }}>
                  <TrendingHashtagsBar
                    limit={12}
                    onSelect={(tag) => {
                      setPrompt((prev) => prev ? `${prev} ${tag}` : tag);
                    }}
                  />
                </div>
              </div>
              )
            ) : (
              /* Message list */
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  maxWidth: 720,
                  margin: "0 auto",
                  width: "100%",
                }}
              >
                {messages.map((msg, i) => (
                  <ChatMessage key={`${msg.timestamp}-${i}`} message={msg} />
                ))}

                {/* Typing indicator */}
                {isLoading && (
                  <div style={{ paddingLeft: 2 }}>
                    <TypingIndicator />
                  </div>
                )}

                {/* Error message */}
                {error && !isLoading && (
                  <div
                    role="alert"
                    style={{
                      padding: "10px 14px",
                      background: "var(--error-subtle)",
                      border: "1px solid var(--error)",
                      borderRadius: "var(--radius-md)",
                      fontSize: 13,
                      color: "var(--error)",
                      maxWidth: "75%",
                    }}
                  >
                    {error}
                  </div>
                )}

                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Scroll anchor for empty state too */}
            {!hasMessages && <div ref={messagesEndRef} />}
          </div>

          {/* Sticky input bar */}
          <div
            style={{
              borderTop: "1px solid var(--border)",
              background: "var(--bg-card)",
              padding: "12px 24px 16px",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                maxWidth: 720,
                margin: "0 auto",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {/* Platform toggle + length selector row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <PlatformToggle
                    selected={selectedPlatforms}
                    onChange={setSelectedPlatforms}
                  />
                </div>
                <div style={{ flexShrink: 0 }}>
                  <LengthSelector value={captionLength} onChange={setCaptionLength} />
                </div>
              </div>

              {/* Textarea + send button row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 10,
                }}
              >
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your idea or topic…"
                  disabled={isLoading}
                  rows={1}
                  aria-label="Message input"
                  style={{
                    flex: 1,
                    resize: "none",
                    padding: "10px 14px",
                    fontSize: 14,
                    lineHeight: "22px",
                    color: "var(--text)",
                    background: "var(--bg-input)",
                    border: "1.5px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    outline: "none",
                    fontFamily: "inherit",
                    transition: "border-color var(--transition)",
                    overflowY: "auto",
                    minHeight: 42,
                    maxHeight: 112, // ~4 rows
                    boxSizing: "border-box",
                    opacity: isLoading ? 0.6 : 1,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                  }}
                />

                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={!canSend}
                  aria-label="Send message"
                  style={{
                    flexShrink: 0,
                    width: 42,
                    height: 42,
                    borderRadius: "var(--radius-md)",
                    border: "none",
                    background: canSend
                      ? "linear-gradient(135deg, var(--accent), #6366f1)"
                      : "var(--bg-subtle)",
                    color: canSend ? "#fff" : "var(--text-4)",
                    cursor: canSend ? "pointer" : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all var(--transition)",
                    boxShadow: canSend ? "0 2px 12px rgba(13,148,136,0.3)" : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (canSend) {
                      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                      (e.currentTarget as HTMLButtonElement).style.boxShadow =
                        "0 4px 16px rgba(13,148,136,0.4)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = canSend
                      ? "0 2px 12px rgba(13,148,136,0.3)"
                      : "none";
                  }}
                >
                  <SendIcon />
                </button>
              </div>

              <p
                style={{
                  fontSize: 11,
                  color: "var(--text-4)",
                  margin: 0,
                  textAlign: "center",
                }}
              >
                Press Enter to send · Shift+Enter for new line
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
