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

function SectionHeader({ label, status }: { label: string; status?: "active" | "done" | "idle" }) {
  const dotColor = status === "done" ? "#34d399" : status === "active" ? "#14b8a6" : "var(--border)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{
        width: 6, height: 6, borderRadius: "50%", background: dotColor, flexShrink: 0,
        boxShadow: status === "active" ? `0 0 6px ${dotColor}` : "none",
        transition: "all 0.3s ease",
      }} />
      <span style={{
        fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
        color: status === "idle" ? "var(--text-4)" : "var(--text-3)",
      }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

export function DevelopScreen() {
  const navigate = useNavigate();
  const location = useLocation();

  const stateData = (location.state as { idea?: string; ideaId?: string; insights?: any; selectedHook?: string }) ?? {};
  const ideaFromState = stateData.idea ?? "";
  const ideaIdFromState = stateData.ideaId ?? null;
  const insightsFromState = stateData.insights ?? null;
  const selectedHookFromState = stateData.selectedHook ?? null;
  const hasBlueprint = !!insightsFromState?.contentBlueprint;

  const [idea, setIdea] = useState(ideaFromState);
  const [format, setFormat] = useState<ScriptFormat>("reels");
  const [blueprintCollapsed, setBlueprintCollapsed] = useState(false);

  // Blueprint reveal state
  const [blueprintState, setBlueprintState] = useState<"thinking" | "ready" | "idle">(
    hasBlueprint ? "thinking" : "idle"
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
    if (hookVariants.length > 0) { setSelectedHookIndex(null); setHookErrors({}); setHookLoading({}); }
  }, [hookVariants]);

  async function handleGenerateHooks() {
    if (!idea.trim() || isGeneratingHooks) return;
    reset(); setSelectedHookIndex(null);
    if (!ideaIdFromState && autoSavedIdeaRef.current !== idea.trim()) {
      autoSavedIdeaRef.current = idea.trim();
      createIdea(idea.trim()).catch(() => {});
    }
    await generateHookVariants(idea, format, profile?.niche ?? undefined, profile?.sub_niche ?? undefined, profile?.language ?? undefined);
  }

  async function handleSelectHook(hook: HookVariant, index: number) {
    setSelectedHookIndex(index);
    setHookLoading((p) => ({ ...p, [index]: true }));
    setHookErrors((p) => ({ ...p, [index]: null }));
    try { await buildScriptFromHook(hook, index); }
    catch (err) { setHookErrors((p) => ({ ...p, [index]: err instanceof Error ? err.message : "Failed" })); }
    finally { setHookLoading((p) => ({ ...p, [index]: false })); }
  }

  async function handleTryAnother(index: number) {
    setHookLoading((p) => ({ ...p, [index]: true }));
    setHookErrors((p) => ({ ...p, [index]: null }));
    try { await tryAnotherHook(index); }
    catch (err) { setHookErrors((p) => ({ ...p, [index]: err instanceof Error ? err.message : "Failed" })); }
    finally { setHookLoading((p) => ({ ...p, [index]: false })); }
  }

  function handleGenerateCaptions() {
    navigate(`/amplify`, { state: { idea: idea || currentIdea, ideaId: ideaIdFromState ?? undefined } });
  }

  const canGenerate = idea.trim().length > 0 && !isGeneratingHooks && !isGeneratingScript;
  const showHooks = isGeneratingHooks || hookVariants.length > 0;
  const showScript = phase === "script_ready" && script !== null;
  const hooksStatus = showScript ? "done" : showHooks ? "active" : "idle";
  const scriptStatus = showScript ? "active" : "idle";
  const bp = insightsFromState?.contentBlueprint;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <Navbar />

      {/* Page header */}
      <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", padding: "24px 48px 0" }}>
        <button
          onClick={() => navigate("/studio")}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 13, fontWeight: 600, letterSpacing: "0.08em",
            textTransform: "uppercase", color: "var(--text-3)",
            background: "none", border: "none", cursor: "pointer", padding: 0,
            marginBottom: 16, transition: "color 0.15s ease",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#14b8a6"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)"; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Studio
        </button>
        <h1 style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text)", margin: "0 0 6px" }}>
          Script Planning
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-3)", margin: "0 0 24px", lineHeight: 1.6 }}>
          Reference your blueprint on the left. Build your script on the right.
        </p>
      </div>

      {/* ── Split pane layout ── */}
      <div style={{
        maxWidth: 1200, margin: "0 auto", width: "100%",
        padding: "0 48px 80px", flex: 1,
        display: "flex", gap: 24, alignItems: "flex-start",
      }} className="develop-split">

        {/* ── LEFT: Blueprint panel ── */}
        {hasBlueprint && (
          blueprintCollapsed ? (
            /* Collapsed rail */
            <div
              onClick={() => setBlueprintCollapsed(false)}
              style={{
                width: 36, flexShrink: 0,
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                cursor: "pointer",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                padding: "16px 0",
                transition: "border-color 0.15s ease",
                position: "sticky", top: 72,
                minHeight: 200,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#14b8a6"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; }}
            >
              <span style={{
                writingMode: "vertical-rl", textOrientation: "mixed",
                fontSize: 12, fontWeight: 700, letterSpacing: "0.12em",
                textTransform: "uppercase", color: "var(--text-3)",
                transform: "rotate(180deg)",
              }}>
                Blueprint
              </span>
            </div>
          ) : (
            /* Expanded blueprint panel */
            <div style={{
              width: 340, flexShrink: 0,
              position: "sticky", top: 72,
              maxHeight: "calc(100vh - 90px)",
              overflowY: "auto",
              overflowX: "hidden",
              display: "flex", flexDirection: "column", gap: 0,
              scrollbarWidth: "thin",
            }}>
              <div style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                overflow: "visible",
              }}>
                {/* Panel header */}
                <div style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "var(--bg-subtle)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: blueprintState === "ready" ? "#34d399" : "#14b8a6",
                      boxShadow: blueprintState === "thinking" ? "0 0 6px #14b8a6" : "none",
                    }} />
                    <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)" }}>
                      Content Blueprint
                    </span>
                  </div>
                  <button
                    onClick={() => setBlueprintCollapsed(true)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--text-4)", fontSize: 16, padding: "2px 4px",
                      display: "flex", alignItems: "center", transition: "color 0.15s ease",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-4)"; }}
                    title="Collapse blueprint"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                </div>

                {/* Thinking state */}
                {blueprintState === "thinking" && (
                  <div style={{ padding: "18px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#14b8a6", animation: "pulse-glow 1.4s ease-in-out infinite" }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>Building blueprint…</span>
                    </div>
                    {["Analysing validation report", "Mapping key points", "Structuring hook and CTA"].map((s, i) => (
                      <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, animation: `fadeInStep 0.4s ease ${i * 0.5}s both` }}>
                        <span style={{ fontSize: 12, color: "var(--text-4)", fontVariantNumeric: "tabular-nums" }}>{String(i + 1).padStart(2, "0")}</span>
                        <span style={{ fontSize: 14, color: "var(--text-3)" }}>{s}</span>
                      </div>
                    ))}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                      <div className="shimmer-line" style={{ height: 36, borderRadius: 6 }} />
                      <div className="shimmer-line" style={{ height: 10, width: "55%", borderRadius: 4 }} />
                      <div className="shimmer-line" style={{ height: 48, borderRadius: 6 }} />
                    </div>
                  </div>
                )}

                {/* Ready state — blueprint content */}
                {blueprintState === "ready" && bp && (
                  <div style={{ animation: "fadeInBlueprint 0.5s ease both" }}>
                    {/* Opening hook */}
                    <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "rgba(20,184,166,0.04)" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#14b8a6", marginBottom: 5 }}>
                        Opening Hook
                      </div>
                      <p style={{ fontSize: 14, color: "var(--text)", fontWeight: 500, lineHeight: 1.6, margin: 0 }}>
                        {bp.openingHook}
                      </p>
                    </div>

                    {/* Core message */}
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 5 }}>
                        Core Message
                      </div>
                      <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>{bp.coreMessage}</p>
                    </div>

                    {/* Key points */}
                    <div style={{ borderBottom: "1px solid var(--border)" }}>
                      <div style={{ padding: "10px 16px 6px", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)" }}>
                        Key Points
                      </div>
                      {bp.keyPoints.map((kp: any, i: number) => (
                        <div key={i} style={{ padding: "8px 16px", borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#14b8a6", fontVariantNumeric: "tabular-nums" }}>
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <span style={{ fontSize: 9, color: "var(--text-4)" }}>{kp.timestamp}</span>
                          </div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: "0 0 3px", lineHeight: 1.4 }}>{kp.point}</p>
                          <p style={{ fontSize: 12, color: "var(--text-3)", margin: "0 0 3px", lineHeight: 1.5 }}>{kp.why}</p>
                          <p style={{ fontSize: 12, color: "#14b8a6", margin: 0, lineHeight: 1.5, paddingLeft: 8, borderLeft: "2px solid rgba(20,184,166,0.25)" }}>
                            {kp.deliveryTip}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 4 }}>CTA</div>
                      <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>{bp.closingCTA}</p>
                    </div>

                    {/* Production notes */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--border)" }}>
                      <div style={{ padding: "10px 14px", background: "var(--bg-card)" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 4 }}>Visual</div>
                        <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5, margin: 0 }}>{bp.visualNotes}</p>
                      </div>
                      <div style={{ padding: "10px 14px", background: "var(--bg-card)" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 4 }}>Audio</div>
                        <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5, margin: 0 }}>{bp.audioNotes}</p>
                        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 10, color: "var(--text-4)" }}>Target:</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#14b8a6", background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)", borderRadius: 3, padding: "1px 5px" }}>
                            {bp.durationTarget}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {/* ── RIGHT: Script planning ── */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 0 }}>

          {/* Idea input */}
          <div style={{ marginBottom: 28 }}>
            {/* Selected hook from Instagram Playbook */}
            {selectedHookFromState && (
              <div style={{
                marginBottom: 12, padding: "12px 16px",
                background: "rgba(193,53,132,0.04)",
                border: "1px solid rgba(193,53,132,0.15)",
                borderRadius: 8,
                display: "flex", alignItems: "flex-start", gap: 10,
              }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "#c13584",
                  flexShrink: 0, marginTop: 3,
                }}>Hook</span>
                <p style={{
                  fontSize: 14, color: "var(--text)", fontWeight: 500,
                  lineHeight: 1.5, margin: 0,
                }}>"{selectedHookFromState}"</p>
              </div>
            )}
            <SectionHeader label="Your idea" status="done" />
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
              <textarea
                value={idea} onChange={(e) => setIdea(e.target.value)}
                placeholder="Your validated idea from Studio…" rows={3}
                style={{
                  display: "block", width: "100%", padding: "14px 16px",
                  fontSize: 15, lineHeight: 1.7, color: "var(--text)",
                  background: "var(--bg-input)", border: "none",
                  borderBottom: "1px solid var(--border)",
                  resize: "vertical", boxSizing: "border-box",
                  outline: "none", fontFamily: "inherit",
                }}
                onFocus={(e) => { e.currentTarget.style.background = "var(--bg-card)"; }}
                onBlur={(e) => { e.currentTarget.style.background = "var(--bg-input)"; }}
              />
              <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ display: "inline-flex", background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: 6, padding: 2, gap: 2 }}>
                  {(["reels", "youtube_shorts"] as ScriptFormat[]).map((f) => {
                    const isActive = format === f;
                    return (
                      <button key={f} onClick={() => setFormat(f)} style={{
                        padding: "4px 12px", fontSize: 13, fontWeight: isActive ? 600 : 500,
                        borderRadius: 4, border: "none",
                        background: isActive ? "#14b8a6" : "transparent",
                        color: isActive ? "#fff" : "var(--text-3)",
                        cursor: "pointer", transition: "all 0.15s ease",
                      }}>
                        {f === "reels" ? "Reels" : "YT Shorts"}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => void handleGenerateHooks()} disabled={!canGenerate}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "7px 16px", fontSize: 14, fontWeight: 600,
                    borderRadius: 6, border: "none",
                    background: canGenerate ? "#14b8a6" : "var(--bg-hover)",
                    color: canGenerate ? "#fff" : "var(--text-4)",
                    cursor: canGenerate ? "pointer" : "not-allowed",
                    transition: "background 0.15s ease", marginLeft: "auto",
                  }}
                  onMouseEnter={(e) => { if (canGenerate) (e.currentTarget as HTMLButtonElement).style.background = "#0d9488"; }}
                  onMouseLeave={(e) => { if (canGenerate) (e.currentTarget as HTMLButtonElement).style.background = "#14b8a6"; }}
                >
                  {isGeneratingHooks ? (
                    <><span style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />Generating…</>
                  ) : (
                    <><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>Generate Hooks</>
                  )}
                </button>
              </div>
            </div>
            {error && !isGeneratingHooks && !isGeneratingScript && (
              <div style={{ marginTop: 8, padding: "10px 14px", background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <span style={{ fontSize: 13, color: "var(--error)", lineHeight: 1.5 }}>{error}</span>
                <button onClick={() => void handleGenerateHooks()} style={{ padding: "4px 10px", fontSize: 12, fontWeight: 600, borderRadius: 4, border: "1px solid rgba(248,113,113,0.3)", background: "transparent", color: "var(--error)", cursor: "pointer", flexShrink: 0 }}>Retry</button>
              </div>
            )}
          </div>

          {/* Hooks */}
          {showHooks && (
            <div style={{ marginBottom: 28 }}>
              <SectionHeader label="Choose your hook" status={hooksStatus} />
              <p style={{ fontSize: 14, color: "var(--text-3)", margin: "0 0 12px", lineHeight: 1.6 }}>
                {isGeneratingHooks ? "Crafting 6 variants…" : selectedHookIndex === null ? "Click a hook to select it." : isGeneratingScript ? "Building script…" : "Script generated. Select a different hook to rebuild."}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }} className="hook-grid">
                {isGeneratingHooks
                  ? [0, 1, 2, 3, 4, 5].map((i) => <HookCard key={i} hook={{ hook_text: "", trigger: "Curiosity Gap" }} isSelected={false} isLoading={true} error={null} onSelect={() => {}} onTryAnother={() => {}} />)
                  : hookVariants.map((hook, i) => (
                    <HookCard key={`${hook.hook_text.slice(0, 20)}-${i}`} hook={hook} isSelected={selectedHookIndex === i} isLoading={hookLoading[i] ?? false} error={hookErrors[i] ?? null} onSelect={() => void handleSelectHook(hook, i)} onTryAnother={() => void handleTryAnother(i)} />
                  ))}
              </div>
              {isGeneratingScript && (
                <div style={{ marginTop: 10, padding: "10px 14px", background: "rgba(20,184,166,0.04)", border: "1px solid rgba(20,184,166,0.15)", borderRadius: 6, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 12, height: 12, border: "2px solid rgba(20,184,166,0.25)", borderTopColor: "#14b8a6", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                  <span style={{ fontSize: 13, color: "#14b8a6" }}>Building script…</span>
                </div>
              )}
            </div>
          )}

          {/* Script */}
          {showScript && (
            <div style={{ marginBottom: 28 }}>
              <SectionHeader label="Script Draft" status={scriptStatus} />
              <ScriptDraft script={script!} onRegenerateWithFeedback={regenerateWithFeedback} onSaveToVault={(insights) => saveToVault(insights, ideaIdFromState ?? autoSavedIdeaRef.current)} isRegenerating={isRegenerating} insights={null} />
            </div>
          )}

          {/* Generate Captions */}
          {showScript && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>Script ready</div>
                <div style={{ fontSize: 14, color: "var(--text-3)" }}>Generate platform-native captions.</div>
              </div>
              <button onClick={handleGenerateCaptions} style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "9px 18px", fontSize: 14, fontWeight: 600,
                borderRadius: 6, border: "none", background: "#14b8a6", color: "#fff",
                cursor: "pointer", transition: "background 0.15s ease", flexShrink: 0,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#0d9488"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#14b8a6"; }}
              >
                Generate Captions
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInStep { from { opacity: 0; transform: translateX(-6px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeInBlueprint { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 900px) {
          .develop-split { flex-direction: column !important; }
          .develop-split > div:first-child { width: 100% !important; position: static !important; max-height: none !important; }
          .hook-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
