import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { HookCard } from "../components/HookCard";
import { ScriptDraft } from "../components/ScriptDraft";
import { useStudio } from "../hooks/useStudio";
import { useCreatorProfile } from "../hooks/useCreatorProfile";
import type { ScriptFormat, HookVariant } from "../types/index";

const SparkleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

const BackIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

export function DevelopScreen() {
  const navigate = useNavigate();
  const location = useLocation();

  // Get idea, ideaId, and insights from navigation state
  const stateData = (location.state as { idea?: string; ideaId?: string; insights?: any }) ?? {};
  const ideaFromState = stateData.idea ?? "";
  const ideaIdFromState = stateData.ideaId ?? null;
  const insightsFromState = stateData.insights ?? null;

  const [idea, setIdea] = useState(ideaFromState);
  const [format, setFormat] = useState<ScriptFormat>("reels");

  // selectedHookIndex is purely local UI state
  const [selectedHookIndex, setSelectedHookIndex] = useState<number | null>(null);
  const [hookErrors, setHookErrors] = useState<Record<number, string | null>>({});
  const [hookLoading, setHookLoading] = useState<Record<number, boolean>>({});

  const {
    phase,
    hookVariants,
    script,
    isGeneratingHooks,
    isGeneratingScript,
    isRegenerating,
    error,
    currentIdea,
    generateHookVariants,
    buildScriptFromHook,
    tryAnotherHook,
    regenerateWithFeedback,
    saveToVault,
    reset,
  } = useStudio();

  const { profile } = useCreatorProfile();

  // Reset selection state when hooks change (new generation)
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
    
    await generateHookVariants(
      idea,
      format,
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
      setHookErrors((prev) => ({
        ...prev,
        [index]: err instanceof Error ? err.message : "Failed to build script",
      }));
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
      setHookErrors((prev) => ({
        ...prev,
        [index]: err instanceof Error ? err.message : "Failed to regenerate hook",
      }));
    } finally {
      setHookLoading((prev) => ({ ...prev, [index]: false }));
    }
  }

  function handleGenerateCaptions() {
    // Navigate to amplify page with the idea via state (clean URL)
    // Use the local idea state, not currentIdea from useStudio
    const ideaToSend = idea || currentIdea;
    console.log("🎨 Navigating to Amplify with idea:", ideaToSend);
    navigate(`/amplify`, {
      state: {
        idea: ideaToSend,
        ideaId: ideaIdFromState ?? undefined
      }
    });
  }

  const canGenerate = idea.trim().length > 0 && !isGeneratingHooks && !isGeneratingScript;
  const showHooks = isGeneratingHooks || hookVariants.length > 0;
  const showScript = phase === "script_ready" && script !== null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", position: "relative", overflow: "hidden" }}>
      <div style={{
        position: "fixed", top: -200, right: -200, width: 600, height: 600,
        background: "radial-gradient(circle, rgba(13,148,136,0.07) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "fixed", bottom: -100, left: -100, width: 400, height: 400,
        background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      <Navbar />

      <div style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "40px 24px 80px",
        position: "relative",
        zIndex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 32,
      }}>
        {/* Back button */}
        <button
          onClick={() => navigate("/studio")}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 11, fontWeight: 500, color: "var(--text-3)",
            background: "none", border: "none", cursor: "pointer", padding: 0,
            transition: "color var(--transition)",
            letterSpacing: "0.04em", textTransform: "uppercase",
            alignSelf: "flex-start",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--accent-text)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)"; }}
        >
          <BackIcon /> Back to Studio
        </button>

        {/* Page header */}
        <div style={{ textAlign: "center" }}>
          <p style={{
            fontSize: 11, fontWeight: 600, letterSpacing: "0.14em",
            textTransform: "uppercase", color: "var(--text-3)", margin: "0 0 12px",
          }}>
            Script Planning
          </p>
          <h1 style={{
            fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 800,
            letterSpacing: "-0.04em", color: "var(--text)", margin: "0 0 12px",
            lineHeight: 1.1,
          }}>
            Plan your{" "}
            <span style={{
              background: "linear-gradient(135deg, var(--accent), #6366f1)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              perfect script
            </span>
          </h1>
          <p style={{
            fontSize: 15, color: "var(--text-3)", margin: 0,
            lineHeight: 1.65, maxWidth: 520, marginLeft: "auto", marginRight: "auto",
          }}>
            Generate hook variants with psychological triggers, then build a complete script with beats and CTA.
          </p>
        </div>

        {/* ── Input section ── */}
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-xl)",
          overflow: "hidden",
          boxShadow: "var(--shadow-lg)",
        }}>
          <div style={{ padding: "24px 24px 20px", borderBottom: "1px solid var(--border)" }}>
            <label style={{
              display: "block", fontSize: 13, fontWeight: 600,
              color: "var(--text-2)", marginBottom: 10, letterSpacing: "-0.01em",
            }}>
              Your content idea
            </label>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Your validated idea from the Studio..."
              rows={4}
              style={{
                display: "block", width: "100%", padding: "14px 16px",
                fontSize: 14, lineHeight: 1.75, color: "var(--text)",
                background: "var(--bg-input)", border: "1.5px solid var(--border)",
                borderRadius: "var(--radius-md)", resize: "vertical",
                boxSizing: "border-box", outline: "none",
                transition: "border-color var(--transition)", fontFamily: "inherit",
              }}
              onFocus={(e) => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = "var(--accent)"; }}
              onBlur={(e) => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = "var(--border)"; }}
            />
          </div>

          <div style={{ padding: "20px 24px 24px" }}>
            {/* Format toggle */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)", margin: "0 0 10px" }}>
                Format
              </p>
              <div style={{
                display: "inline-flex", background: "var(--bg-subtle)",
                border: "1px solid var(--border)", borderRadius: "var(--radius-md)",
                padding: 3, gap: 2,
              }}>
                {(["reels", "youtube_shorts"] as ScriptFormat[]).map((f) => {
                  const label = f === "reels" ? "Reels" : "YouTube Shorts";
                  const isActive = format === f;
                  return (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      style={{
                        padding: "7px 18px", fontSize: 13,
                        fontWeight: isActive ? 600 : 500,
                        borderRadius: "var(--radius-sm)", border: "none",
                        background: isActive ? "var(--accent)" : "transparent",
                        color: isActive ? "#fff" : "var(--text-3)",
                        cursor: "pointer", transition: "all var(--transition)", whiteSpace: "nowrap",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Generate hooks button */}
            <button
              onClick={() => void handleGenerateHooks()}
              disabled={!canGenerate}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 8, width: "100%", padding: "15px 24px", fontSize: 15,
                fontWeight: 700, color: "#fff",
                background: canGenerate
                  ? "linear-gradient(135deg, var(--accent) 0%, #6366f1 100%)"
                  : "var(--text-4)",
                border: "none", borderRadius: "var(--radius-md)",
                cursor: canGenerate ? "pointer" : "not-allowed",
                transition: "all var(--transition)",
                boxShadow: canGenerate ? "0 4px 20px rgba(13,148,136,0.3)" : "none",
                letterSpacing: "-0.01em",
              }}
              onMouseEnter={(e) => {
                if (canGenerate) {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.transform = "translateY(-1px)";
                  b.style.boxShadow = "0 6px 28px rgba(13,148,136,0.4)";
                }
              }}
              onMouseLeave={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.transform = "translateY(0)";
                b.style.boxShadow = canGenerate ? "0 4px 20px rgba(13,148,136,0.3)" : "none";
              }}
            >
              {isGeneratingHooks ? (
                <>
                  <span style={{
                    width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)",
                    borderTopColor: "#fff", borderRadius: "50%",
                    display: "inline-block", animation: "spin 0.7s linear infinite",
                  }} />
                  Generating hooks…
                </>
              ) : (
                <>
                  <SparkleIcon />
                  Generate Hooks
                </>
              )}
            </button>

            {/* Error */}
            {error && !isGeneratingHooks && !isGeneratingScript && (
              <div style={{
                marginTop: 12, padding: "12px 16px",
                background: "var(--error-subtle)",
                border: "1px solid rgba(248, 113, 113, 0.25)",
                borderRadius: "var(--radius-md)",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
              }}>
                <p style={{ fontSize: 13, color: "var(--error)", margin: 0, lineHeight: 1.5 }}>
                  {error}
                </p>
                <button
                  onClick={() => void handleGenerateHooks()}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "6px 12px", fontSize: 12, fontWeight: 600,
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid rgba(248, 113, 113, 0.4)",
                    background: "transparent", color: "var(--error)",
                    cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                    transition: "all var(--transition)",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(248, 113, 113, 0.1)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  <RefreshIcon />
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Content Blueprint (from validation) ── */}
        {insightsFromState?.contentBlueprint && (
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-xl)",
            overflow: "hidden",
            boxShadow: "var(--shadow-lg)",
            padding: "24px",
          }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 8,
              }}>
                <span style={{ fontSize: 20 }}>🎬</span>
                <h2 style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--text)",
                  margin: 0,
                  letterSpacing: "-0.01em",
                }}>
                  Content Blueprint
                </h2>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-3)", margin: 0, lineHeight: 1.6 }}>
                Your validated content strategy from the Studio
              </p>
            </div>

            {/* Opening hook */}
            <div style={{
              padding: "12px 14px",
              borderRadius: "var(--radius-sm)",
              background: "rgba(20,184,166,0.08)",
              border: "1px solid rgba(20,184,166,0.2)",
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 4 }}>
                ⚡ Opening Hook (first 3 seconds)
              </div>
              <p style={{ fontSize: 13, color: "var(--text)", fontWeight: 500, lineHeight: 1.6, margin: 0 }}>
                {insightsFromState.contentBlueprint.openingHook}
              </p>
            </div>

            {/* Core message */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
                Core Message
              </div>
              <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>
                {insightsFromState.contentBlueprint.coreMessage}
              </p>
            </div>

            {/* Key points */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 10 }}>
                Key Points
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {insightsFromState.contentBlueprint.keyPoints.map((kp: any, i: number) => (
                  <div key={i} style={{
                    padding: "12px 14px",
                    background: "var(--bg-subtle)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)",
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: "var(--accent)",
                          color: "#fff",
                          fontSize: 10,
                          fontWeight: 800,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          {i + 1}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                          {kp.point}
                        </span>
                      </div>
                      <span style={{
                        padding: "1px 7px",
                        borderRadius: 99,
                        fontSize: 10,
                        fontWeight: 600,
                        background: "var(--bg-card)",
                        color: "var(--text-3)",
                        border: "1px solid var(--border)",
                        flexShrink: 0,
                      }}>
                        {kp.timestamp}
                      </span>
                    </div>
                    <div style={{ paddingLeft: 28 }}>
                      <p style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 4, lineHeight: 1.5, margin: "0 0 4px" }}>
                        <span style={{ fontWeight: 600, color: "var(--text-3)" }}>Why: </span>
                        {kp.why}
                      </p>
                      <p style={{ fontSize: 12, color: "var(--accent)", lineHeight: 1.5, margin: 0 }}>
                        <span style={{ fontWeight: 600 }}>💡 Tip: </span>
                        {kp.deliveryTip}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Closing CTA */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
                Closing CTA
              </div>
              <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>
                {insightsFromState.contentBlueprint.closingCTA}
              </p>
            </div>

            {/* Visual + Audio notes */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div style={{
                padding: "10px 12px",
                background: "var(--bg-subtle)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 4 }}>
                  🎥 Visual Notes
                </div>
                <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5, margin: 0 }}>
                  {insightsFromState.contentBlueprint.visualNotes}
                </p>
              </div>
              <div style={{
                padding: "10px 12px",
                background: "var(--bg-subtle)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 4 }}>
                  🎵 Audio Notes
                </div>
                <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5, margin: 0 }}>
                  {insightsFromState.contentBlueprint.audioNotes}
                </p>
              </div>
            </div>

            {/* Duration target */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: "var(--text-3)" }}>⏱ Target duration:</span>
              <span style={{
                padding: "2px 10px",
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 700,
                background: "rgba(20,184,166,0.1)",
                color: "var(--accent)",
                border: "1px solid rgba(20,184,166,0.2)",
              }}>
                {insightsFromState.contentBlueprint.durationTarget}
              </span>
            </div>
          </div>
        )}

        {/* ── Hook grid ── */}
        {showHooks && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)", margin: "0 0 4px" }}>
                {isGeneratingHooks ? "Generating hooks…" : "Choose your hook"}
              </p>
              <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0 }}>
                {isGeneratingHooks
                  ? "Crafting 3 hook variants with different psychological triggers"
                  : selectedHookIndex === null
                  ? "Pick the hook that resonates — the full script will be built around it"
                  : isGeneratingScript
                  ? "Building your script around the selected hook…"
                  : "Script generated. Select a different hook to rebuild, or edit below."}
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }} className="hook-grid">
              {isGeneratingHooks
                ? [0, 1, 2].map((i) => (
                    <HookCard
                      key={i}
                      hook={{ hook_text: "", trigger: "Curiosity Gap" }}
                      isSelected={false}
                      isLoading={true}
                      error={null}
                      onSelect={() => {}}
                      onTryAnother={() => {}}
                    />
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

            {/* Script generating indicator */}
            {isGeneratingScript && (
              <div style={{
                marginTop: 16, padding: "14px 18px",
                background: "var(--accent-subtle)",
                border: "1px solid rgba(20,184,166,0.2)",
                borderRadius: "var(--radius-md)",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{
                  width: 14, height: 14, border: "2px solid rgba(20,184,166,0.3)",
                  borderTopColor: "var(--accent)", borderRadius: "50%",
                  display: "inline-block", animation: "spin 0.7s linear infinite", flexShrink: 0,
                }} />
                <p style={{ fontSize: 13, color: "var(--accent-text)", margin: 0 }}>
                  Building your 45–60 second script…
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Script draft ── */}
        {showScript && (
          <ScriptDraft
            script={script!}
            onRegenerateWithFeedback={regenerateWithFeedback}
            onSaveToVault={saveToVault}
            isRegenerating={isRegenerating}
            insights={null}
          />
        )}

        {/* ── Generate Captions Button ── */}
        {showScript && (
          <div style={{
            display: "flex",
            justifyContent: "center",
            paddingTop: 8,
          }}>
            <button
              onClick={handleGenerateCaptions}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "14px 28px", fontSize: 15, fontWeight: 600,
                borderRadius: 99, border: "none",
                background: "var(--text)", color: "var(--bg)",
                cursor: "pointer", transition: "all var(--transition)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
              }}
              onMouseEnter={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.opacity = "0.9";
                b.style.transform = "translateY(-2px)";
                b.style.boxShadow = "0 6px 24px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.opacity = "1";
                b.style.transform = "translateY(0)";
                b.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)";
              }}
            >
              Generate Captions <ArrowRightIcon />
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 700px) {
          .hook-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
