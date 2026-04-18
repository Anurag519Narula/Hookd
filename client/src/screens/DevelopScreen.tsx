import { useState, useEffect } from "react";
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { HookCard } from "../components/HookCard";
import { ScriptDraft } from "../components/ScriptDraft";
import { useStudio } from "../hooks/useStudio";
import { useCreatorProfile } from "../hooks/useCreatorProfile";
import { createIdea } from "../api/ideas";
import type { ScriptFormat, HookVariant } from "../types/index";

// ── Section header — same pattern as MarketResearchPanel ─────────────────────
function SectionHeader({ label, status }: { label: string; status?: "active" | "done" | "idle" }) {
  const dotColor = status === "done" ? "#34d399" : status === "active" ? "#14b8a6" : "var(--border)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{
        width: 6, height: 6, borderRadius: "50%",
        background: dotColor,
        flexShrink: 0,
        boxShadow: status === "active" ? `0 0 6px ${dotColor}` : "none",
        transition: "all 0.3s ease",
      }} />
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: status === "idle" ? "var(--text-4)" : "var(--text-3)",
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

export function DevelopScreen() {
  const navigate = useNavigate();
  const location = useLocation();

  const stateData = (location.state as { idea?: string; ideaId?: string; insights?: any }) ?? {};
  const ideaFromState = stateData.idea ?? "";
  const ideaIdFromState = stateData.ideaId ?? null;
  const insightsFromState = stateData.insights ?? null;

  const [idea, setIdea] = useState(ideaFromState);
  const [format, setFormat] = useState<ScriptFormat>("reels");

  // Blueprint reveal state
  const [blueprintState, setBlueprintState] = useState<"thinking" | "ready" | "idle">(
    insightsFromState?.contentBlueprint ? "thinking" : "idle"
  );

  useEffect(() => {
    if (blueprintState !== "thinking") return;
    const timer = setTimeout(() => setBlueprintState("ready"), 2200);
    return () => clearTimeout(timer);
  }, [blueprintState]);

  const [selectedHookIndex, setSelectedHookIndex] = useState<number | null>(null);
  const [hookErrors, setHookErrors] = useState<Record<number, string | null>>({});
  const [hookLoading, setHookLoading] = useState<Record<number, boolean>>({});

  const {
    phase, hookVariants, script,
    isGeneratingHooks, isGeneratingScript, isRegenerating,
    error, currentIdea,
    generateHookVariants, buildScriptFromHook, tryAnotherHook,
    regenerateWithFeedback, saveToVault, reset,
  } = useStudio();

  const { profile } = useCreatorProfile();
  const autoSavedIdeaRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (hookVariants.length > 0) {
      setSelectedHookIndex(null);
      setHookErrors({});
      setHookLoading({});
    }
  }, [hookVariants]);

  async function handleGenerateHooks() {
    if (!idea.trim() || isGeneratingHooks) return;
    reset();
    setSelectedHookIndex(null);
    if (!ideaIdFromState && autoSavedIdeaRef.current !== idea.trim()) {
      autoSavedIdeaRef.current = idea.trim();
      createIdea(idea.trim()).catch(() => {});
    }
    await generateHookVariants(
      idea, format,
      profile?.niche ?? undefined,
      profile?.sub_niche ?? undefined,
      profile?.language ?? undefined
    );
  }

  async function handleSelectHook(hook: HookVariant, index: number) {
    setSelectedHookIndex(index);
    setHookLoading((prev) => ({ ...prev, [index]: true }));
    setHookErrors((prev) => ({ ...prev, [index]: null }));
    try {
      await buildScriptFromHook(hook, index);
    } catch (err) {
      setHookErrors((prev) => ({ ...prev, [index]: err instanceof Error ? err.message : "Failed to build script" }));
    } finally {
      setHookLoading((prev) => ({ ...prev, [index]: false }));
    }
  }

  async function handleTryAnother(index: number) {
    setHookLoading((prev) => ({ ...prev, [index]: true }));
    setHookErrors((prev) => ({ ...prev, [index]: null }));
    try {
      await tryAnotherHook(index);
    } catch (err) {
      setHookErrors((prev) => ({ ...prev, [index]: err instanceof Error ? err.message : "Failed to regenerate hook" }));
    } finally {
      setHookLoading((prev) => ({ ...prev, [index]: false }));
    }
  }

  function handleGenerateCaptions() {
    const ideaToSend = idea || currentIdea;
    navigate(`/amplify`, { state: { idea: ideaToSend, ideaId: ideaIdFromState ?? undefined } });
  }

  const canGenerate = idea.trim().length > 0 && !isGeneratingHooks && !isGeneratingScript;
  const showHooks = isGeneratingHooks || hookVariants.length > 0;
  const showScript = phase === "script_ready" && script !== null;

  // Stage status for section headers
  const blueprintStatus = blueprintState === "ready" ? "done" : blueprintState === "thinking" ? "active" : "idle";
  const hooksStatus = showScript ? "done" : showHooks ? "active" : "idle";
  const scriptStatus = showScript ? "active" : "idle";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />

      <div style={{
        maxWidth: 860,
        margin: "0 auto",
        padding: "32px 24px 80px",
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}>

        {/* ── Page header — minimal, left-aligned ── */}
        <div style={{ marginBottom: 32 }}>
          <button
            onClick={() => navigate("/studio")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
              textTransform: "uppercase", color: "var(--text-3)",
              background: "none", border: "none", cursor: "pointer", padding: 0,
              marginBottom: 20, transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#14b8a6"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)"; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Studio
          </button>

          <h1 style={{
            fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 700,
            letterSpacing: "-0.03em", color: "var(--text)", margin: "0 0 6px",
            lineHeight: 1.2,
          }}>
            Script Planning
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-3)", margin: 0, lineHeight: 1.6 }}>
            Blueprint → Hooks → Script. Three steps before the camera rolls.
          </p>
        </div>

        {/* ── STAGE 1: Idea input + generate ── */}
        <div style={{ marginBottom: 32 }}>
          <SectionHeader label="Your idea" status="done" />

          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            overflow: "hidden",
          }}>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Your validated idea from Studio…"
              rows={3}
              style={{
                display: "block", width: "100%", padding: "16px 18px",
                fontSize: 14, lineHeight: 1.7, color: "var(--text)",
                background: "var(--bg-input)", border: "none",
                borderBottom: "1px solid var(--border)",
                resize: "vertical", boxSizing: "border-box",
                outline: "none", fontFamily: "inherit",
                transition: "background 0.15s ease",
              }}
              onFocus={(e) => { e.currentTarget.style.background = "var(--bg-card)"; }}
              onBlur={(e) => { e.currentTarget.style.background = "var(--bg-input)"; }}
            />

            <div style={{
              padding: "12px 18px",
              display: "flex", alignItems: "center", gap: 12,
              flexWrap: "wrap",
            }}>
              {/* Format toggle */}
              <div style={{
                display: "inline-flex",
                background: "var(--bg-subtle)",
                border: "1px solid var(--border)",
                borderRadius: 6, padding: 2, gap: 2,
              }}>
                {(["reels", "youtube_shorts"] as ScriptFormat[]).map((f) => {
                  const label = f === "reels" ? "Reels" : "YT Shorts";
                  const isActive = format === f;
                  return (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      style={{
                        padding: "5px 14px", fontSize: 12,
                        fontWeight: isActive ? 600 : 500,
                        borderRadius: 4, border: "none",
                        background: isActive ? "#14b8a6" : "transparent",
                        color: isActive ? "#fff" : "var(--text-3)",
                        cursor: "pointer", transition: "all 0.15s ease",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Generate button */}
              <button
                onClick={() => void handleGenerateHooks()}
                disabled={!canGenerate}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "8px 18px", fontSize: 13, fontWeight: 600,
                  borderRadius: 6, border: "none",
                  background: canGenerate ? "#14b8a6" : "var(--bg-hover)",
                  color: canGenerate ? "#fff" : "var(--text-4)",
                  cursor: canGenerate ? "pointer" : "not-allowed",
                  transition: "all 0.15s ease",
                  letterSpacing: "-0.01em",
                  marginLeft: "auto",
                }}
                onMouseEnter={(e) => {
                  if (canGenerate) {
                    (e.currentTarget as HTMLButtonElement).style.background = "#0d9488";
                  }
                }}
                onMouseLeave={(e) => {
                  if (canGenerate) {
                    (e.currentTarget as HTMLButtonElement).style.background = "#14b8a6";
                  }
                }}
              >
                {isGeneratingHooks ? (
                  <>
                    <span style={{
                      width: 12, height: 12,
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff", borderRadius: "50%",
                      display: "inline-block", animation: "spin 0.7s linear infinite",
                    }} />
                    Generating…
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                    </svg>
                    Generate Hooks
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && !isGeneratingHooks && !isGeneratingScript && (
            <div style={{
              marginTop: 8, padding: "10px 14px",
              background: "rgba(248,113,113,0.06)",
              border: "1px solid rgba(248,113,113,0.2)",
              borderRadius: 6,
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
            }}>
              <span style={{ fontSize: 12, color: "var(--error)", lineHeight: 1.5 }}>{error}</span>
              <button
                onClick={() => void handleGenerateHooks()}
                style={{
                  padding: "4px 10px", fontSize: 11, fontWeight: 600,
                  borderRadius: 4, border: "1px solid rgba(248,113,113,0.3)",
                  background: "transparent", color: "var(--error)",
                  cursor: "pointer", flexShrink: 0,
                }}
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* ── STAGE 2: Content Blueprint ── */}
        {insightsFromState?.contentBlueprint && (
          <div style={{ marginBottom: 32 }}>
            <SectionHeader label="Content Blueprint" status={blueprintStatus} />

            {blueprintState === "thinking" && (
              <div style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "20px 20px",
                display: "flex", flexDirection: "column", gap: 14,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%", background: "#14b8a6",
                    display: "inline-block", animation: "pulse-glow 1.4s ease-in-out infinite",
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", letterSpacing: "-0.01em" }}>
                    Building your content blueprint…
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {["Analysing your validation report", "Mapping key points to timestamps", "Structuring opening hook and CTA"].map((step, i) => (
                    <div key={step} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      animation: `fadeInStep 0.4s ease ${i * 0.5}s both`,
                    }}>
                      <span style={{ fontSize: 11, color: "var(--text-4)", fontVariantNumeric: "tabular-nums" }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--text-3)" }}>{step}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                  <div className="shimmer-line" style={{ height: 40, borderRadius: 6 }} />
                  <div className="shimmer-line" style={{ height: 12, width: "60%", borderRadius: 4 }} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {[0,1,2].map(i => <div key={i} className="shimmer-line" style={{ height: 52, borderRadius: 6 }} />)}
                  </div>
                </div>
              </div>
            )}

            {blueprintState === "ready" && (
              <div style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                overflow: "hidden",
                animation: "fadeInBlueprint 0.5s ease both",
              }}>
                {/* Opening hook — most important, gets top billing */}
                <div style={{
                  padding: "16px 18px",
                  borderBottom: "1px solid var(--border)",
                  background: "rgba(20,184,166,0.04)",
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#14b8a6", marginBottom: 6 }}>
                    Opening Hook — first 3 seconds
                  </div>
                  <p style={{ fontSize: 14, color: "var(--text)", fontWeight: 500, lineHeight: 1.65, margin: 0, letterSpacing: "-0.01em" }}>
                    {insightsFromState.contentBlueprint.openingHook}
                  </p>
                </div>

                {/* Core message */}
                <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
                    Core Message
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.65, margin: 0 }}>
                    {insightsFromState.contentBlueprint.coreMessage}
                  </p>
                </div>

                {/* Key points — table layout */}
                <div style={{ borderBottom: "1px solid var(--border)" }}>
                  <div style={{ padding: "12px 18px 8px", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)" }}>
                    Key Points
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)" }}>
                    {insightsFromState.contentBlueprint.keyPoints.map((kp: any, i: number) => (
                      <div key={i} style={{
                        display: "grid",
                        gridTemplateColumns: "44px 1fr",
                        background: "var(--bg-card)",
                      }}>
                        <div style={{
                          padding: "12px 10px",
                          borderRight: "1px solid var(--border)",
                          display: "flex", flexDirection: "column",
                          alignItems: "center", justifyContent: "flex-start",
                          gap: 4, paddingTop: 14,
                        }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#14b8a6", fontVariantNumeric: "tabular-nums" }}>
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span style={{ fontSize: 9, color: "var(--text-4)", fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em" }}>
                            {kp.timestamp}
                          </span>
                        </div>
                        <div style={{ padding: "12px 14px" }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 5, lineHeight: 1.4 }}>
                            {kp.point}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.55, marginBottom: 4 }}>
                            {kp.why}
                          </div>
                          <div style={{
                            fontSize: 11, color: "#14b8a6", lineHeight: 1.5,
                            paddingLeft: 8, borderLeft: "2px solid rgba(20,184,166,0.3)",
                          }}>
                            {kp.deliveryTip}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA + production notes */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, background: "var(--border)" }}>
                  <div style={{ padding: "14px 16px", background: "var(--bg-card)" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
                      Closing CTA
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>
                      {insightsFromState.contentBlueprint.closingCTA}
                    </p>
                  </div>
                  <div style={{ padding: "14px 16px", background: "var(--bg-card)" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
                      Visual Notes
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>
                      {insightsFromState.contentBlueprint.visualNotes}
                    </p>
                  </div>
                  <div style={{ padding: "14px 16px", background: "var(--bg-card)" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
                      Audio Notes
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>
                      {insightsFromState.contentBlueprint.audioNotes}
                    </p>
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 10, color: "var(--text-4)" }}>Target:</span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: "#14b8a6",
                        background: "rgba(20,184,166,0.08)",
                        border: "1px solid rgba(20,184,166,0.2)",
                        borderRadius: 3, padding: "1px 6px",
                      }}>
                        {insightsFromState.contentBlueprint.durationTarget}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STAGE 3: Hooks ── */}
        {showHooks && (
          <div style={{ marginBottom: 32 }}>
            <SectionHeader label="Choose your hook" status={hooksStatus} />

            <p style={{ fontSize: 12, color: "var(--text-3)", margin: "0 0 14px", lineHeight: 1.6 }}>
              {isGeneratingHooks
                ? "Crafting 3 variants with different psychological triggers…"
                : selectedHookIndex === null
                ? "Click a hook to select it — the full script builds around your choice."
                : isGeneratingScript
                ? "Building your script around the selected hook…"
                : "Script generated. Select a different hook to rebuild."}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }} className="hook-grid">
              {isGeneratingHooks
                ? [0, 1, 2].map((i) => (
                    <HookCard key={i} hook={{ hook_text: "", trigger: "Curiosity Gap" }}
                      isSelected={false} isLoading={true} error={null}
                      onSelect={() => {}} onTryAnother={() => {}} />
                  ))
                : hookVariants.map((hook, i) => (
                    <HookCard
                      key={`${hook.hook_text.slice(0, 20)}-${i}`}
                      hook={hook}
                      isSelected={selectedHookIndex === i}
                      isLoading={hookLoading[i] ?? false}
                      error={hookErrors[i] ?? null}
                      onSelect={() => void handleSelectHook(hook, i)}
                      onTryAnother={() => void handleTryAnother(i)}
                    />
                  ))}
            </div>

            {isGeneratingScript && (
              <div style={{
                marginTop: 12, padding: "12px 16px",
                background: "rgba(20,184,166,0.04)",
                border: "1px solid rgba(20,184,166,0.15)",
                borderRadius: 6,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{
                  width: 12, height: 12,
                  border: "2px solid rgba(20,184,166,0.25)",
                  borderTopColor: "#14b8a6", borderRadius: "50%",
                  display: "inline-block", animation: "spin 0.7s linear infinite", flexShrink: 0,
                }} />
                <span style={{ fontSize: 12, color: "#14b8a6" }}>
                  Building your 45–60 second script…
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── STAGE 4: Script ── */}
        {showScript && (
          <div style={{ marginBottom: 32 }}>
            <SectionHeader label="Script Draft" status={scriptStatus} />
            <ScriptDraft
              script={script!}
              onRegenerateWithFeedback={regenerateWithFeedback}
              onSaveToVault={saveToVault}
              isRegenerating={isRegenerating}
              insights={null}
            />
          </div>
        )}

        {/* ── Next step: Generate Captions ── */}
        {showScript && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 20px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 8,
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>
                Script ready
              </div>
              <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                Generate platform-native captions for every channel.
              </div>
            </div>
            <button
              onClick={handleGenerateCaptions}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "10px 20px", fontSize: 13, fontWeight: 600,
                borderRadius: 6, border: "none",
                background: "#14b8a6", color: "#fff",
                cursor: "pointer", transition: "background 0.15s ease",
                letterSpacing: "-0.01em", flexShrink: 0,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#0d9488"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#14b8a6"; }}
            >
              Generate Captions
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInStep {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInBlueprint {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 700px) {
          .hook-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
