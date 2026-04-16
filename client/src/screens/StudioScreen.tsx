import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { HookCard } from "../components/HookCard";
import { ScriptDraft } from "../components/ScriptDraft";
import { MarketResearchPanel } from "../components/MarketResearchPanel";
import { useStudio } from "../hooks/useStudio";
import { useCreatorProfile } from "../hooks/useCreatorProfile";
import { getIdea } from "../api/ideas";
import { fetchInsights } from "../api/insights";
import type { ScriptFormat, HookVariant } from "../types/index";
import type { InsightReport } from "../types/insights";

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

export function StudioScreen() {
  const [searchParams] = useSearchParams();
  const ideaId = searchParams.get("ideaId");

  const [idea, setIdea] = useState("");
  const [format, setFormat] = useState<ScriptFormat>("reels");

  // selectedHookIndex is purely local UI state — never reset by script updates
  const [selectedHookIndex, setSelectedHookIndex] = useState<number | null>(null);
  const [hookErrors, setHookErrors] = useState<Record<number, string | null>>({});
  const [hookLoading, setHookLoading] = useState<Record<number, boolean>>({});

  // Market research state
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [insights, setInsights] = useState<InsightReport | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsFetched, setInsightsFetched] = useState(false);

  const {
    phase,
    hookVariants,
    script,
    isGeneratingHooks,
    isGeneratingScript,
    isRegenerating,
    error,
    generateHookVariants,
    buildScriptFromHook,
    tryAnotherHook,
    regenerateWithFeedback,
    saveToVault,
    reset,
  } = useStudio();

  const { profile } = useCreatorProfile();

  // Restore from Vault via ?ideaId= query param
  useEffect(() => {
    if (!ideaId) return;
    let cancelled = false;
    async function restoreIdea() {
      try {
        const saved = await getIdea(ideaId!);
        if (cancelled) return;
        setIdea(saved.raw_text);
        if (saved.format_type === "reels" || saved.format_type === "youtube_shorts") {
          setFormat(saved.format_type as ScriptFormat);
        }
      } catch {
        // silently ignore
      }
    }
    void restoreIdea();
    return () => { cancelled = true; };
  }, [ideaId]);

  // Reset selection state when hooks change (new generation)
  useEffect(() => {
    if (hookVariants.length > 0) {
      setSelectedHookIndex(null); // no hook pre-selected — user must choose
      setHookErrors({});
      setHookLoading({});
    }
  }, [hookVariants]);

  async function handleGenerate() {
    if (!idea.trim() || isGeneratingHooks) return;
    reset();
    setSelectedHookIndex(null);
    setInsights(null);
    setInsightsFetched(false);
    setInsightsOpen(false);
    // Auto-fetch insights in parallel with hook generation
    void generateHookVariants(
      idea,
      format,
      profile?.niche ?? undefined,
      profile?.sub_niche ?? undefined,
      profile?.language ?? undefined
    );
    // Start fetching insights immediately — don't wait for hooks
    setInsightsLoading(true);
    fetchInsights(idea, profile?.niche ?? "", ideaId ?? undefined)
      .then((result) => {
        setInsights(result.report);
        setInsightsFetched(true);
        setInsightsOpen(true); // auto-open when ready
      })
      .catch(() => {})
      .finally(() => setInsightsLoading(false));
  }

  async function handleSelectHook(hook: HookVariant, index: number) {
    // Update selection immediately — no async wait
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

  const handleGetInsights = useCallback(async () => {
    if (insightsFetched || insightsLoading) return;
    setInsightsLoading(true);
    try {
      const result = await fetchInsights(idea, profile?.niche ?? "", ideaId ?? undefined);
      setInsights(result.report);
      setInsightsFetched(true);
    } catch {
      // silently fail
    } finally {
      setInsightsLoading(false);
    }
  }, [idea, profile?.niche, ideaId, insightsFetched, insightsLoading]);

  function handleInsightsToggle() {
    const willOpen = !insightsOpen;
    setInsightsOpen(willOpen);
    if (willOpen && !insightsFetched && !insightsLoading && idea.trim()) {
      void handleGetInsights();
    }
  }

  const canGenerate = idea.trim().length > 0 && !isGeneratingHooks && !isGeneratingScript;
  const showHooks = isGeneratingHooks || hookVariants.length > 0;
  const showScript = phase === "script_ready" && script !== null;
  // Show validation report as soon as generation starts
  const showValidationReport = insightsLoading || insightsFetched;

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
        {/* Page header */}
        <div style={{ textAlign: "center" }}>
          <p style={{
            fontSize: 11, fontWeight: 600, letterSpacing: "0.14em",
            textTransform: "uppercase", color: "var(--text-3)", margin: "0 0 12px",
          }}>
            Script Studio
          </p>
          <h1 style={{
            fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 800,
            letterSpacing: "-0.04em", color: "var(--text)", margin: "0 0 12px",
            lineHeight: 1.1,
          }}>
            Validate your idea,{" "}
            <span style={{
              background: "linear-gradient(135deg, var(--accent), #6366f1)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              plan your content
            </span>
          </h1>
          <p style={{
            fontSize: 15, color: "var(--text-3)", margin: 0,
            lineHeight: 1.65, maxWidth: 520, marginLeft: "auto", marginRight: "auto",
          }}>
            Get a data-driven validation report, content blueprint, and hook variants — before you film a single second.
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
              Your big idea
            </label>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Describe your idea, story, or insight. E.g. 'Most people think consistency means posting every day. I think it means posting when you have something worth saying.'"
              rows={5}
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
              onClick={() => void handleGenerate()}
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
                  onClick={() => void handleGenerate()}
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
          />
        )}

        {/* ── Idea Validation Report — shown as soon as generation starts ── */}
        {showValidationReport && (
          <MarketResearchPanel
            topic={idea.slice(0, 80)}
            isOpen={insightsOpen}
            onToggle={handleInsightsToggle}
            insights={insights}
            isLoading={insightsLoading}
          />
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
