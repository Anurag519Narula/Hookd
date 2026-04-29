import { useState, useEffect, useCallback } from "react";
import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkle, CircleNotch, ArrowRight,
  CheckCircle, Robot, WarningCircle,
  ArrowsClockwise, TrendUp, TrendDown, ArrowRight as ArrowRightIcon, ShieldCheck,
  Trophy, Clock, Crown, Crosshair,
  Lightning, FilmStrip, Users,
  FilmReel, VideoCamera, TextAa,
} from "@phosphor-icons/react";
import { Navbar } from "../components/Navbar";
import { MarketResearchPanel } from "../components/MarketResearchPanel";
import { ClarifierInline } from "../components/ClarifierInline";
import { ResearchPanel } from "../components/ResearchPanel";
import { VerdictCard } from "../components/VerdictCard";
import { PlatformScorecard } from "../components/PlatformScorecard";
import { StagedLoader } from "../components/StagedLoader";
import { SearchTrendsSection } from "../components/SearchTrendsSection";
import { InstagramPlaybook } from "../components/InstagramPlaybook";
import { useCreatorProfile } from "../hooks/useCreatorProfile";
import { getIdea, createIdea } from "../api/ideas";
import { fetchInsights, type InsightResponse, QuotaExceededError } from "../api/insights";
import { clarifyIdea } from "../api/studio";
import type { ClarityQuestion } from "../types/insights";
import { scoreColor, compColor, SIGNAL_COLORS, Badge } from "../components/ui";

// ── Reel volume estimate from real competition signals ────────────────────────
// Derived from YouTube competition data + Instagram saturation score.
// No LLM — pure math from existing API data.

function reelVolumeEstimate(
  sig: NonNullable<import("../api/insights").InsightResponse["signals"]>,
  ig: import("../api/insights").InstagramSignals | undefined
): string {
  const satScore = ig?.saturation.score ?? 50;
  const totalVideos = sig.competition.totalVideos;
  const uniqueChannels = sig.competition.uniqueChannels;

  // Combine saturation score (0–100) with channel breadth to bucket reel volume
  // High saturation + many channels → massive reel pool
  const breadthBoost = Math.min(30, uniqueChannels * 4);
  const composite = satScore + breadthBoost;

  if (composite >= 90 || totalVideos >= 12) return "50M+";
  if (composite >= 75 || totalVideos >= 9) return "10M+";
  if (composite >= 55 || totalVideos >= 6) return "1M+";
  if (composite >= 35 || totalVideos >= 3) return "100K+";
  return "10K+";
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function SourceBadge({ label, icon, muted }: { label: string; icon?: React.ReactNode; muted?: boolean }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 6,
      fontSize: 12, fontWeight: 600,
      color: muted ? "#78716c" : "var(--accent)",
      background: muted ? "rgba(120,113,108,0.06)" : "rgba(5,150,105,0.06)",
      border: `1px solid ${muted ? "rgba(120,113,108,0.15)" : "rgba(5,150,105,0.15)"}`,
      letterSpacing: "0.01em",
    }}>
      {icon} {label}
    </span>
  );
}

// ── Stat card for hero strip ──────────────────────────────────────────────────

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


function HeroStat({ icon, label, value, valueColor, sub }: {
  icon: React.ReactNode; label: string; value: string; valueColor?: string; sub?: string;
}) {
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 12, padding: "18px 20px",
      display: "flex", flexDirection: "column", gap: 10,
      transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = "var(--border-strong)";
      e.currentTarget.style.boxShadow = "var(--shadow-sm)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = "var(--border)";
      e.currentTarget.style.boxShadow = "none";
    }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {icon}
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
          textTransform: "uppercase", color: "var(--text-4)",
          fontFamily: "var(--font-mono)",
        }}>{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{
          fontSize: 22, fontWeight: 800, letterSpacing: "-0.04em",
          color: valueColor ?? "var(--text)", fontFamily: "var(--font-sans)",
          lineHeight: 1,
        }}>{value}</span>
        {sub && (
          <span style={{
            fontSize: 12, color: "var(--text-4)", fontWeight: 500,
            fontFamily: "var(--font-mono)",
          }}>{sub}</span>
        )}
      </div>
    </div>
  );
}

// ── Sticky sidebar item ───────────────────────────────────────────────────────

function SidebarItem({ icon, label, value }: {
  icon: React.ReactNode; label: string; value: React.ReactNode;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "12px 0",
      borderBottom: "1px solid var(--border)",
    }}>
      <div style={{ flexShrink: 0, marginTop: 2 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
          textTransform: "uppercase", color: "var(--text-4)",
          marginBottom: 4, fontFamily: "var(--font-mono)",
        }}>{label}</div>
        <div style={{
          fontSize: 15, color: "var(--text)", fontWeight: 500,
          lineHeight: 1.5, letterSpacing: "-0.005em",
        }}>{value}</div>
      </div>
    </div>
  );
}

// ── Circle score graph ────────────────────────────────────────────────────────

function CircleScore({ label, score }: { label: string; score: number }) {
  const size = 72;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;
  const color = scoreColor(score);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="var(--border)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)" }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{
            fontSize: 16, fontWeight: 800, color,
            fontFamily: "var(--font-sans)", letterSpacing: "-0.03em",
          }}>{score}</span>
        </div>
      </div>
      <span style={{
        fontSize: 10, fontWeight: 600, letterSpacing: "0.1em",
        textTransform: "uppercase", color: "var(--text-4)",
        fontFamily: "var(--font-mono)", textAlign: "center",
      }}>{label}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function StudioScreen() {
  const [searchParams] = useSearchParams();
  const ideaId = searchParams.get("ideaId");
  const navigate = useNavigate();

  const [idea, setIdea] = useState("");
  const [insightsOpen, setInsightsOpen] = useState(true);
  const [insights, setInsights] = useState<InsightResponse | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsFetched, setInsightsFetched] = useState(false);
  const [insightsError, setInsightsError] = useState(false);
  const [quotaError, setQuotaError] = useState<string | null>(null);

  const [clarifying, setClarifying] = useState(false);
  const [clarityQuestions, setClarityQuestions] = useState<ClarityQuestion[] | null>(null);

  const { profile } = useCreatorProfile();
  const savedIdeaIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (!ideaId) return;
    let cancelled = false;
    async function restoreIdea() {
      try {
        const saved = await getIdea(ideaId!);
        if (cancelled) return;
        setIdea(saved.raw_text);
      } catch { /* silently ignore */ }
    }
    void restoreIdea();
    return () => { cancelled = true; };
  }, [ideaId]);

  function runValidation(queryText: string) {
    setInsightsLoading(true);
    setInsightsError(false);
    fetchInsights(queryText, profile?.niche ?? "", ideaId ?? undefined)
      .then((result) => {
        setInsights(result);
        setInsightsFetched(true);
        setInsightsOpen(true);
      })
      .catch((err) => {
        setInsightsError(true);
        if (err instanceof QuotaExceededError) setQuotaError(err.serverMessage);
      })
      .finally(() => setInsightsLoading(false));
  }

  async function handleValidate() {
    if (!idea.trim() || insightsLoading || clarifying) return;
    setInsights(null); setInsightsFetched(false); setInsightsOpen(true);
    setQuotaError(null); setClarityQuestions(null); setInsightsError(false);

    if (!ideaId) {
      createIdea(idea.trim())
        .then((saved) => { savedIdeaIdRef.current = saved.id; })
        .catch(() => {});
    }

    setClarifying(true);
    try {
      const clarity = await clarifyIdea(idea.trim());
      if (!clarity.isClear && clarity.questions.length > 0) {
        setClarityQuestions(clarity.questions);
        setClarifying(false);
        return;
      }
    } catch { /* fail open */ }
    setClarifying(false);
    runValidation(idea.trim());
  }

  function handleRevalidate() {
    if (!idea.trim() || insightsLoading) return;
    setInsights(null); setInsightsFetched(false); setInsightsOpen(true);
    setQuotaError(null); setInsightsError(false);
    runValidation(idea.trim());
  }

  function handleClarifyComplete(answers: Record<number, string>) {
    const answerTexts = Object.values(answers).filter(Boolean);
    const expandedQuery = `${idea.trim()}\n\nAdditional context:\n${answerTexts.join("\n")}`;
    setClarityQuestions(null);
    runValidation(expandedQuery);
  }

  function handleClarifySkip() {
    setClarityQuestions(null);
    runValidation(idea.trim());
  }

  const handleGetInsights = useCallback(async () => {
    if (insightsFetched || insightsLoading) return;
    setInsightsLoading(true); setInsightsError(false);
    try {
      const result = await fetchInsights(idea, profile?.niche ?? "", ideaId ?? undefined);
      setInsights(result); setInsightsFetched(true);
    } catch { setInsightsError(true); }
    finally { setInsightsLoading(false); }
  }, [idea, profile?.niche, ideaId, insightsFetched, insightsLoading]);

  function handleInsightsToggle() {
    const willOpen = !insightsOpen;
    setInsightsOpen(willOpen);
    if (willOpen && !insightsFetched && !insightsLoading && idea.trim()) void handleGetInsights();
  }

  function handlePlanScript(selectedHook?: string) {
    navigate(`/develop`, {
      state: {
        idea,
        ideaId: ideaId ?? savedIdeaIdRef.current ?? undefined,
        insights: insights?.report ?? null,
        selectedHook: selectedHook ?? undefined,
      },
    });
  }

  function handleSelectHookForDevelop(hook: string) {
    handlePlanScript(hook);
  }

  function handlePlanScriptClick() {
    handlePlanScript();
  }

  const canValidate = idea.trim().length > 0 && !insightsLoading && !clarifying;
  const canPlanScript = insightsFetched && insights !== null;
  const r = insights?.report;
  const sig = insights?.signals;
  const ig = insights?.instagram;
  const mc = insights?.marketContext;

  // Derive sidebar data
  const bestPlatform = r?.platform_scores?.[0];
  const topChannel = r?.youtubeData?.topChannels?.[0];

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <Navbar />

      <div style={{
        maxWidth: 1200, margin: "0 auto",
        padding: "32px 48px 80px",
      }}>

        {/* ═══════════════════════════════════════════════════════════════════
            PAGE HEADER + IDEA INPUT (always visible, full width)
        ═══════════════════════════════════════════════════════════════════ */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{
              fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 800,
              letterSpacing: "-0.04em", color: "var(--text)", margin: "0 0 6px",
              lineHeight: 1.1, fontFamily: "var(--font-sans)",
            }}>
              Idea Validation
            </h1>
            <p style={{
              fontSize: 15, color: "var(--text-3)", margin: 0,
              lineHeight: 1.6, maxWidth: "50ch", letterSpacing: "-0.005em",
            }}>
              Check your idea against real market signals before you film.
            </p>
          </div>

          <SectionHeader label="Your idea" status="done" />

          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 12, overflow: "hidden",
            transition: "border-color 0.15s ease",
          }}>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Describe your idea, story, or insight..."
              rows={4}
              style={{
                display: "block", width: "100%", padding: "18px 20px",
                fontSize: 16, lineHeight: 1.7, color: "var(--text)",
                background: "var(--bg-input)", border: "none",
                borderBottom: "1px solid var(--border)",
                resize: "vertical", boxSizing: "border-box",
                outline: "none", fontFamily: "var(--font-sans)",
                transition: "background 0.15s ease", letterSpacing: "-0.01em",
              }}
              onFocus={(e) => {
                e.currentTarget.style.background = "var(--bg-card)";
                (e.currentTarget.parentElement as HTMLElement).style.borderColor = "var(--border-strong)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.background = "var(--bg-input)";
                (e.currentTarget.parentElement as HTMLElement).style.borderColor = "var(--border)";
              }}
            />
            <div style={{ padding: "12px 20px", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => void handleValidate()}
                disabled={!canValidate}
                className="btn-tactile"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "9px 20px", fontSize: 15, fontWeight: 600,
                  borderRadius: 8, border: "none",
                  background: canValidate ? "var(--accent)" : "var(--bg-hover)",
                  color: canValidate ? "#fff" : "var(--text-4)",
                  cursor: canValidate ? "pointer" : "not-allowed",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  letterSpacing: "-0.01em",
                }}
                onMouseEnter={(e) => { if (canValidate) (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-hover)"; }}
                onMouseLeave={(e) => { if (canValidate) (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)"; }}
              >
                {clarifying ? (
                  <><CircleNotch size={14} weight="bold" style={{ animation: "spin 0.7s linear infinite" }} /> Checking</>
                ) : (
                  <><Sparkle size={14} weight="fill" /> Validate Idea</>
                )}
              </button>
            </div>
          </div>

          {clarityQuestions && clarityQuestions.length > 0 && (
            <ClarifierInline questions={clarityQuestions} onComplete={handleClarifyComplete} onSkip={handleClarifySkip} />
          )}

          {quotaError && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: 12, padding: "14px 18px",
                background: "rgba(217,119,6,0.04)", border: "1px solid rgba(217,119,6,0.2)",
                borderRadius: 10, display: "flex", alignItems: "flex-start", gap: 10,
              }}>
              <WarningCircle size={16} weight="bold" color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 15, color: "#d97706", margin: 0, lineHeight: 1.6 }}>{quotaError}</p>
            </motion.div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            STAGE 2: LOADING STATE
        ═══════════════════════════════════════════════════════════════════ */}
        {insightsLoading && (
          <div>
            <StagedLoader isLoading={insightsLoading} isError={insightsError} />
            <MarketResearchPanel isOpen={false} onToggle={handleInsightsToggle} insights={null} isLoading={true} />
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STAGE 3: DASHBOARD REPORT (full width)
        ═══════════════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {insightsFetched && insights && r && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* ── HERO BAR ─────────────────────────────────────────────── */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 24, marginBottom: 24, flexWrap: "wrap",
              }}
              className="dashboard-hero-bar">
                {/* Left: sources */}
                <div style={{ flex: 1, minWidth: 280 }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap",
                  }}>
                    <span style={{
                      fontSize: 14, color: "var(--text-3)", letterSpacing: "-0.005em",
                    }}>Validated using real market signals</span>
                    <span style={{ color: "var(--border-strong)" }}>·</span>
                    {insights.sources.youtubeCount > 0 && (
                      <SourceBadge label="YouTube" icon={<CheckCircle size={12} weight="fill" />} />
                    )}
                    {sig?.googleTrends?.available && (
                      <SourceBadge label="Google Trends" icon={<CheckCircle size={12} weight="fill" />} />
                    )}
                    <SourceBadge label="AI Interpretation" icon={<Robot size={12} weight="duotone" />} muted />
                    {mc && (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "3px 10px", borderRadius: 6,
                        fontSize: 12, fontWeight: 600,
                        color: mc.type === "feed_driven" ? "#c13584"
                          : mc.type === "search_driven" ? "#2563eb"
                          : mc.type === "trend_driven" ? "#d97706"
                          : mc.type === "authority_driven" ? "#7c3aed"
                          : "#0d9488",
                        background: mc.type === "feed_driven" ? "rgba(193,53,132,0.06)"
                          : mc.type === "search_driven" ? "rgba(37,99,235,0.06)"
                          : mc.type === "trend_driven" ? "rgba(217,119,6,0.06)"
                          : mc.type === "authority_driven" ? "rgba(124,58,237,0.06)"
                          : "rgba(13,148,136,0.06)",
                        border: `1px solid ${
                          mc.type === "feed_driven" ? "rgba(193,53,132,0.15)"
                          : mc.type === "search_driven" ? "rgba(37,99,235,0.15)"
                          : mc.type === "trend_driven" ? "rgba(217,119,6,0.15)"
                          : mc.type === "authority_driven" ? "rgba(124,58,237,0.15)"
                          : "rgba(13,148,136,0.15)"
                        }`,
                        letterSpacing: "0.01em",
                      }}
                      title={mc.description}
                      >
                        {mc.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: CTAs */}
                <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}
                  className="dashboard-hero-ctas">
                  <button
                    onClick={handleRevalidate}
                    disabled={insightsLoading}
                    className="btn-tactile"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "9px 16px", fontSize: 14, fontWeight: 600,
                      borderRadius: 8, border: "1px solid var(--border)",
                      background: "var(--bg-card)", color: "var(--text-2)",
                      cursor: "pointer", transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                  >
                    <ArrowsClockwise size={14} weight="bold" /> Revalidate
                  </button>
                  {canPlanScript && (
                    <button
                      onClick={handlePlanScriptClick}
                      className="btn-tactile"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        padding: "9px 20px", fontSize: 14, fontWeight: 600,
                        borderRadius: 8, border: "none",
                        background: "var(--accent)", color: "#fff",
                        cursor: "pointer", transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                        letterSpacing: "-0.01em",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-hover)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)"; }}
                    >
                      Plan Your Script <ArrowRight size={14} weight="bold" />
                    </button>
                  )}
                </div>
              </div>

              {/* ── STAT STRIP ───────────────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 12, marginBottom: 24,
                }}
                className="hero-stats"
              >
                <HeroStat
                  icon={<ShieldCheck size={16} weight="duotone" color={scoreColor(r.opportunityScore)} />}
                  label="Verdict"
                  value={r.verdictLabel.split(" ")[0]}
                  valueColor={scoreColor(r.opportunityScore)}
                  sub={r.verdictLabel.split(" ").slice(1).join(" ")}
                />
                <HeroStat
                  icon={<Trophy size={16} weight="duotone" color={scoreColor(r.opportunityScore)} />}
                  label="Opportunity"
                  value={`${r.opportunityScore}`}
                  valueColor={scoreColor(r.opportunityScore)}
                  sub="/100"
                />
                <HeroStat
                  icon={<Crosshair size={16} weight="duotone" color={compColor(r.competitionLevel)} />}
                  label="Competition"
                  value={r.competitionLevel}
                  valueColor={compColor(r.competitionLevel)}
                />
                <HeroStat
                  icon={
                    r.trendDirection === "rising"
                      ? <TrendUp size={16} weight="duotone" color={SIGNAL_COLORS[r.trendDirection]} />
                      : r.trendDirection === "declining"
                      ? <TrendDown size={16} weight="duotone" color={SIGNAL_COLORS[r.trendDirection]} />
                      : <ArrowRightIcon size={16} weight="duotone" color={SIGNAL_COLORS[r.trendDirection] ?? "var(--text-3)"} />
                  }
                  label="Trend"
                  value={r.trendDirection}
                  valueColor={SIGNAL_COLORS[r.trendDirection] ?? "var(--text-3)"}
                />
                {sig && (
                  <>
                    <HeroStat
                      icon={<Lightning size={16} weight="duotone" color={SIGNAL_COLORS[sig.trend.velocity] ?? "var(--text-3)"} />}
                      label="Momentum"
                      value={sig.trend.velocity}
                      valueColor={SIGNAL_COLORS[sig.trend.velocity] ?? "var(--text-3)"}
                    />
                    <HeroStat
                      icon={<FilmStrip size={16} weight="duotone" color={ig ? (ig.saturation.label === "Low" ? "#059669" : ig.saturation.label === "Medium" ? "#d97706" : "#dc2626") : "var(--text-3)"} />}
                      label="Reels on Topic"
                      value={reelVolumeEstimate(sig, ig)}
                      valueColor={ig ? (ig.saturation.label === "Low" ? "#059669" : ig.saturation.label === "Medium" ? "#d97706" : "#dc2626") : "var(--text-3)"}
                    />
                    <HeroStat
                      icon={<Users size={16} weight="duotone" color={scoreColor(r.audienceFit.score)} />}
                      label="Audience Fit"
                      value={`${r.audienceFit.score}`}
                      valueColor={scoreColor(r.audienceFit.score)}
                      sub="/100"
                    />
                  </>
                )}
              </motion.div>

              {/* ── 12-COL GRID: LEFT 8 + RIGHT 4 ───────────────────────── */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 340px",
                gap: 24,
                alignItems: "start",
              }}
              className="dashboard-grid">

                {/* ════════ LEFT COLUMN (8 cols equivalent) ════════ */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>

                  {/* Verdict Card */}
                  <VerdictCard insights={r} />

                  {/* Platform Scorecard */}
                  <PlatformScorecard scores={r.platform_scores ?? []} />

                  {/* Instagram Playbook */}
                  {ig && (
                    <InstagramPlaybook
                      instagram={ig}
                      onSelectHook={handleSelectHookForDevelop}
                    />
                  )}

                  {/* Strategy & Angles */}
                  <MarketResearchPanel
                    isOpen={insightsOpen}
                    onToggle={handleInsightsToggle}
                    insights={r}
                    isLoading={false}
                  />

                  {/* Evidence & Data */}
                  <ResearchPanel
                    topVideos={r.topVideos ?? []}
                    youtubeData={r.youtubeData}
                    platformAnalysis={r.platformAnalysis ?? []}
                    platformScores={r.platform_scores ?? []}
                    report={r}
                    signals={sig}
                    sources={insights.sources}
                  />

                  {/* Google Search Trends */}
                  {insights.googleTrends && (
                    <SearchTrendsSection
                      interest={insights.googleTrends.interest}
                      avgInterest={insights.googleTrends.avgInterest}
                      peakInterest={insights.googleTrends.peakInterest}
                      timeline={insights.googleTrends.timeline}
                      risingQueries={insights.googleTrends.risingQueries}
                      topQueries={insights.googleTrends.topQueries}
                    />
                  )}
                </div>

                {/* ════════ RIGHT COLUMN — STICKY SIDEBAR ════════ */}
                <div style={{
                  position: "sticky", top: 72,
                  display: "flex", flexDirection: "column", gap: 0,
                  background: "var(--bg-card)", border: "1px solid var(--border)",
                  borderRadius: 12, padding: "20px 20px 16px",
                }}
                className="dashboard-sidebar">
                  <div style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
                    textTransform: "uppercase", color: "var(--text-4)",
                    fontFamily: "var(--font-mono)", marginBottom: 8,
                  }}>Quick Summary</div>

                  <p style={{
                    fontSize: 15, color: "var(--text-2)", lineHeight: 1.6,
                    marginBottom: 12, letterSpacing: "-0.005em",
                    paddingBottom: 12, borderBottom: "1px solid var(--border)",
                  }}>
                    {r.keyInsight}
                  </p>

                  {bestPlatform && (
                    <SidebarItem
                      icon={<Crown size={15} weight="duotone" color="var(--accent)" />}
                      label="Best Platform"
                      value={
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span>{bestPlatform.platform}</span>
                          <Badge label={bestPlatform.tier} color={
                            bestPlatform.tier === "Excellent" ? "#059669"
                            : bestPlatform.tier === "Strong" ? "#0d9488"
                            : bestPlatform.tier === "Moderate" ? "#d97706" : "#dc2626"
                          } />
                        </div>
                      }
                    />
                  )}

                  <SidebarItem
                    icon={<Clock size={15} weight="duotone" color="var(--text-3)" />}
                    label="Best Time to Post"
                    value={
                      <span>
                        {r.audienceFit.bestDays.slice(0, 2).join(", ")}
                        {r.audienceFit.bestPostingTimes.length > 0 && ` · ${r.audienceFit.bestPostingTimes[0]}`}
                      </span>
                    }
                  />

                  {topChannel && (
                    <SidebarItem
                      icon={<Trophy size={15} weight="duotone" color="var(--text-3)" />}
                      label="Top Channel Spotted"
                      value={topChannel}
                    />
                  )}

                  {/* Instagram sidebar items */}
                  {ig && (
                    <>
                      <SidebarItem
                        icon={<FilmReel size={15} weight="duotone" color={
                          ig.reelPotential.label === "High" ? "#059669"
                          : ig.reelPotential.label === "Medium" ? "#d97706" : "#dc2626"
                        } />}
                        label="Reel Potential"
                        value={
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span>{ig.reelPotential.score}/100</span>
                            <Badge label={ig.reelPotential.label} color={
                              ig.reelPotential.label === "High" ? "#059669"
                              : ig.reelPotential.label === "Medium" ? "#d97706" : "#dc2626"
                            } />
                          </div>
                        }
                      />
                      <SidebarItem
                        icon={<VideoCamera size={15} weight="duotone" color="var(--text-3)" />}
                        label="Best Format"
                        value={ig.bestFormat}
                      />
                      <SidebarItem
                        icon={<TextAa size={15} weight="duotone" color="var(--text-3)" />}
                        label="Caption Style"
                        value={ig.captionStyle}
                      />
                    </>
                  )}

                  {/* Opportunity + Audience Fit circle graphs */}
                  <div style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
                    padding: "16px 0 12px",
                    borderBottom: "1px solid var(--border)",
                  }}>
                    <CircleScore label="Opportunity" score={r.opportunityScore} />
                    <CircleScore label="Audience Fit" score={r.audienceFit.score} />
                  </div>

                  {/* Plan Script CTA in sidebar */}
                  {canPlanScript && (
                    <button
                      onClick={handlePlanScriptClick}
                      className="btn-tactile"
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        width: "100%", padding: "12px 20px", marginTop: 16,
                        fontSize: 15, fontWeight: 600, borderRadius: 10,
                        border: "none", background: "var(--accent)", color: "#fff",
                        cursor: "pointer", transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                        letterSpacing: "-0.01em",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-hover)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)"; }}
                    >
                      Plan Your Script <ArrowRight size={15} weight="bold" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Responsive overrides ─────────────────────────────────────────── */}
      <style>{`
        @media (max-width: 1100px) {
          .dashboard-grid { grid-template-columns: 1fr !important; }
          .dashboard-sidebar { position: static !important; }
          .hero-stats { grid-template-columns: repeat(3, 1fr) !important; }
          .ig-playbook-scores { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .hero-stats { grid-template-columns: repeat(2, 1fr) !important; }
          .dashboard-hero-bar { flex-direction: column !important; align-items: stretch !important; }
          .dashboard-hero-ctas { justify-content: stretch !important; }
          .dashboard-hero-ctas button { flex: 1; justify-content: center; }
          .ig-playbook-scores { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
