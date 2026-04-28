import { useState, useEffect, useCallback } from "react";
import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkle, CircleNotch, ArrowRight,
  CheckCircle, Robot, WarningCircle,
  ArrowsClockwise, TrendUp, ShieldCheck,
  Trophy, Users, Clock, Crown, Crosshair,
} from "@phosphor-icons/react";
import { Navbar } from "../components/Navbar";
import { MarketResearchPanel } from "../components/MarketResearchPanel";
import { ClarifierInline } from "../components/ClarifierInline";
import { ResearchPanel } from "../components/ResearchPanel";
import { VerdictCard } from "../components/VerdictCard";
import { PlatformScorecard } from "../components/PlatformScorecard";
import { StagedLoader } from "../components/StagedLoader";
import { SearchTrendsSection } from "../components/SearchTrendsSection";
import { useCreatorProfile } from "../hooks/useCreatorProfile";
import { getIdea, createIdea } from "../api/ideas";
import { fetchInsights, type InsightResponse, QuotaExceededError } from "../api/insights";
import { clarifyIdea } from "../api/studio";
import type { ClarityQuestion } from "../types/insights";
import { scoreColor, compColor, SIGNAL_COLORS, Badge } from "../components/ui";

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
          fontSize: 14, color: "var(--text)", fontWeight: 500,
          lineHeight: 1.5, letterSpacing: "-0.005em",
        }}>{value}</div>
      </div>
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

  function handlePlanScript() {
    navigate(`/develop`, {
      state: { idea, ideaId: ideaId ?? savedIdeaIdRef.current ?? undefined, insights: insights?.report ?? null },
    });
  }

  const canValidate = idea.trim().length > 0 && !insightsLoading && !clarifying;
  const canPlanScript = insightsFetched && insights !== null;
  const r = insights?.report;
  const sig = insights?.signals;

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
                display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                gap: 24, marginBottom: 24, flexWrap: "wrap",
              }}
              className="dashboard-hero-bar">
                {/* Left: idea + sources */}
                <div style={{ flex: 1, minWidth: 280 }}>
                  <h1 style={{
                    fontSize: "clamp(20px, 2.5vw, 28px)", fontWeight: 800,
                    letterSpacing: "-0.04em", color: "var(--text)", margin: "0 0 6px",
                    lineHeight: 1.2, fontFamily: "var(--font-sans)",
                    display: "-webkit-box", WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical" as any, overflow: "hidden",
                  }}>
                    {idea.trim().slice(0, 120)}{idea.trim().length > 120 ? "..." : ""}
                  </h1>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 8,
                  }}>
                    <span style={{
                      fontSize: 13, color: "var(--text-3)", letterSpacing: "-0.005em",
                    }}>Validated using real market signals</span>
                    <span style={{ color: "var(--border-strong)" }}>·</span>
                    {insights.sources.youtubeCount > 0 && (
                      <SourceBadge label="YouTube" icon={<CheckCircle size={12} weight="fill" />} />
                    )}
                    {sig?.googleTrends?.available && (
                      <SourceBadge label="Google Trends" icon={<CheckCircle size={12} weight="fill" />} />
                    )}
                    <SourceBadge label="AI Interpretation" icon={<Robot size={12} weight="duotone" />} muted />
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
                      onClick={handlePlanScript}
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

              {/* ── 4-COLUMN STAT STRIP ──────────────────────────────────── */}
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
                  icon={<TrendUp size={16} weight="duotone" color={SIGNAL_COLORS[r.trendDirection] ?? "var(--text-3)"} />}
                  label="Trend"
                  value={r.trendDirection}
                  valueColor={SIGNAL_COLORS[r.trendDirection] ?? "var(--text-3)"}
                />
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

                  {/* Verdict Card — full detail */}
                  <VerdictCard insights={r} />

                  {/* Platform Scorecard */}
                  <PlatformScorecard scores={r.platform_scores ?? []} />

                  {/* Google Trends — large chart card */}
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

                  {/* Strategy & Angles — tabbed */}
                  <MarketResearchPanel
                    isOpen={insightsOpen}
                    onToggle={handleInsightsToggle}
                    insights={r}
                    isLoading={false}
                  />

                  {/* Evidence & Data — compact metrics */}
                  <ResearchPanel
                    topVideos={r.topVideos ?? []}
                    youtubeData={r.youtubeData}
                    platformAnalysis={r.platformAnalysis ?? []}
                    platformScores={r.platform_scores ?? []}
                    report={r}
                    signals={sig}
                    sources={insights.sources}
                  />
                </div>

                {/* ════════ RIGHT COLUMN — STICKY SIDEBAR ════════ */}
                <div style={{
                  position: "sticky", top: 24,
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
                    fontSize: 14, color: "var(--text-2)", lineHeight: 1.6,
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

                  <SidebarItem
                    icon={<Users size={15} weight="duotone" color="var(--text-3)" />}
                    label="Audience Fit"
                    value={
                      <div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                          <span style={{
                            fontSize: 18, fontWeight: 800, color: scoreColor(r.audienceFit.score),
                            fontFamily: "var(--font-sans)", letterSpacing: "-0.03em",
                          }}>{r.audienceFit.score}</span>
                          <span style={{ fontSize: 11, color: "var(--text-4)", fontFamily: "var(--font-mono)" }}>/100</span>
                        </div>
                        <span style={{ fontSize: 13, color: "var(--text-3)" }}>{r.audienceFit.primaryAudience}</span>
                      </div>
                    }
                  />

                  {topChannel && (
                    <SidebarItem
                      icon={<Trophy size={15} weight="duotone" color="var(--text-3)" />}
                      label="Top Channel Spotted"
                      value={topChannel}
                    />
                  )}

                  {/* Plan Script CTA in sidebar */}
                  {canPlanScript && (
                    <button
                      onClick={handlePlanScript}
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
          .hero-stats { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .hero-stats { grid-template-columns: 1fr !important; }
          .dashboard-hero-bar { flex-direction: column !important; align-items: stretch !important; }
          .dashboard-hero-ctas { justify-content: stretch !important; }
          .dashboard-hero-ctas button { flex: 1; justify-content: center; }
        }
      `}</style>
    </div>
  );
}
