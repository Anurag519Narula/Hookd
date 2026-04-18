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
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

export function AmplifyScreen() {
  const location = useLocation();
  const { profile } = useCreatorProfile();
  const { sessions, loading: sessionsLoading, createSession, deleteSession } = useConversations();
  const { activeSessionId, messages, isLoading, isSessionLoading, error, sendMessage, startNewSession, loadSession } = useAmplify();

  const stateData = (location.state as { idea?: string; ideaId?: string }) ?? {};
  const ideaFromState = stateData.idea ?? "";

  const hasNavigationState = location.state !== null;
  const didResetRef = useRef(false);
  useEffect(() => {
    if (!hasNavigationState && !didResetRef.current) {
      didResetRef.current = true;
      startNewSession();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [prompt, setPrompt] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [captionLength, setCaptionLength] = useState<CaptionLength>("medium");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastAutoSentIdeaRef = useRef<string | null>(null);

  useEffect(() => {
    if (profile?.platform_priority && profile.platform_priority.length > 0) {
      setSelectedPlatforms(profile.platform_priority);
    }
  }, [profile?.platform_priority]);

  useEffect(() => {
    if (!ideaFromState) return;
    if (lastAutoSentIdeaRef.current === ideaFromState) return;
    lastAutoSentIdeaRef.current = ideaFromState;
    const platformsToUse = selectedPlatforms.length > 0 ? selectedPlatforms : ["instagram" as Platform];
    setPrompt("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    void sendMessage(ideaFromState, platformsToUse, captionLength);
  }, [ideaFromState, selectedPlatforms, captionLength, sendMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 110) + "px";
  };

  const canSend = prompt.trim().length > 0 && selectedPlatforms.length > 0 && !isLoading;

  const handleSend = useCallback(async () => {
    if (!canSend) return;
    const text = prompt.trim();
    setPrompt("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    await sendMessage(text, selectedPlatforms, captionLength);
  }, [canSend, prompt, selectedPlatforms, captionLength, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSend(); }
  };

  void createSession;
  const hasMessages = messages.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg)", overflow: "hidden" }}>
      <Navbar />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* ── Sidebar ── */}
        <ConversationSidebar
          sessions={sessions}
          activeId={activeSessionId}
          onSelect={(id) => void loadSession(id)}
          onNew={() => startNewSession()}
          onDelete={async (id) => {
            await deleteSession(id);
            if (id === activeSessionId) startNewSession();
          }}
          loading={sessionsLoading}
        />

        {/* ── Chat area ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

          {/* Message list */}
          <div
            style={{ flex: 1, overflowY: "auto", padding: "24px 24px 8px" }}
            aria-live="polite"
            aria-label="Conversation messages"
          >
            {!hasMessages ? (
              isSessionLoading ? (
                /* Loading skeleton */
                <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 680, margin: "0 auto", width: "100%" }} aria-busy="true">
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5, maxWidth: "55%" }}>
                      <div className="shimmer-line" style={{ height: 13, borderRadius: 4 }} />
                      <div className="shimmer-line" style={{ height: 13, width: "70%", borderRadius: 4, alignSelf: "flex-end" }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-start" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5, maxWidth: "65%" }}>
                      <div className="shimmer-line" style={{ height: 13, borderRadius: 4 }} />
                      <div className="shimmer-line" style={{ height: 13, borderRadius: 4 }} />
                      <div className="shimmer-line" style={{ height: 13, width: "50%", borderRadius: 4 }} />
                    </div>
                  </div>
                </div>
              ) : (
                /* Empty state */
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", height: "100%", minHeight: 280,
                  textAlign: "center", padding: "0 24px", gap: 20,
                }}>
                  {/* Signal icon — not a sparkle, not a circle. A waveform. */}
                  <div style={{
                    width: 40, height: 40,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="32" height="20" viewBox="0 0 32 20" fill="none">
                      <path d="M1 10 Q4 2 7 10 Q10 18 13 10 Q16 2 19 10 Q22 18 25 10 Q28 2 31 10" stroke="#14b8a6" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6"/>
                    </svg>
                  </div>
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
                      What do you want to create?
                    </h2>
                    <p style={{ fontSize: 13, color: "var(--text-3)", margin: 0, lineHeight: 1.6, maxWidth: 360 }}>
                      Describe your idea or topic. Select platforms and get platform-native captions with trending hashtags.
                    </p>
                  </div>
                  <div style={{ maxWidth: 520, width: "100%", textAlign: "left" }}>
                    <TrendingHashtagsBar
                      limit={12}
                      onSelect={(tag) => setPrompt((prev) => prev ? `${prev} ${tag}` : tag)}
                    />
                  </div>
                </div>
              )
            ) : (
              /* Messages */
              <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 680, margin: "0 auto", width: "100%" }}>
                {messages.map((msg, i) => (
                  <ChatMessage key={`${msg.timestamp}-${i}`} message={msg} />
                ))}
                {isLoading && <div style={{ paddingLeft: 2 }}><TypingIndicator /></div>}
                {error && !isLoading && (
                  <div role="alert" style={{
                    padding: "10px 14px",
                    background: "rgba(248,113,113,0.06)",
                    border: "1px solid rgba(248,113,113,0.2)",
                    borderRadius: 6, fontSize: 12, color: "var(--error)", maxWidth: "70%",
                  }}>
                    {error}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
            {!hasMessages && <div ref={messagesEndRef} />}
          </div>

          {/* ── Input bar ── */}
          <div style={{
            borderTop: "1px solid var(--border)",
            background: "var(--bg-card)",
            padding: "12px 20px 14px",
            flexShrink: 0,
          }}>
            <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 8 }}>

              {/* Platform + length row */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <PlatformToggle selected={selectedPlatforms} onChange={setSelectedPlatforms} />
                </div>
                <div style={{ flexShrink: 0 }}>
                  <LengthSelector value={captionLength} onChange={setCaptionLength} />
                </div>
              </div>

              {/* Textarea + send */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
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
                    flex: 1, resize: "none",
                    padding: "9px 12px", fontSize: 13, lineHeight: "20px",
                    color: "var(--text)", background: "var(--bg-input)",
                    border: "1px solid var(--border)",
                    borderRadius: 6, outline: "none", fontFamily: "inherit",
                    transition: "border-color 0.15s ease",
                    overflowY: "auto", minHeight: 38, maxHeight: 110,
                    boxSizing: "border-box", opacity: isLoading ? 0.6 : 1,
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#14b8a6"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                />

                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={!canSend}
                  aria-label="Send message"
                  style={{
                    flexShrink: 0, width: 38, height: 38,
                    borderRadius: 6, border: "none",
                    background: canSend ? "#14b8a6" : "var(--bg-subtle)",
                    color: canSend ? "#fff" : "var(--text-4)",
                    cursor: canSend ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (canSend) (e.currentTarget as HTMLButtonElement).style.background = "#0d9488";
                  }}
                  onMouseLeave={(e) => {
                    if (canSend) (e.currentTarget as HTMLButtonElement).style.background = "#14b8a6";
                  }}
                >
                  <SendIcon />
                </button>
              </div>

              <p style={{ fontSize: 11, color: "var(--text-4)", margin: 0, textAlign: "center" }}>
                Enter to send · Shift+Enter for new line
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
