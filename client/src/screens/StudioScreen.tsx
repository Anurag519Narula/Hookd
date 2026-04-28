import { useState, useEffect, useCallback } from "react";
import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkle, CircleNotch, ArrowRight,
  CheckCircle, Robot, WarningCircle,
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

// ── Shared helpers ────────────────────────────────────────────────────────────

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

function SectionHeader({ label, status }: { label: string; status?: "active" | "done" | "idle" }) {
  const dotColor = status === "done" ? "#059669" : status === "active" ? "var(--accent)" : "var(--border)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
      <div style={{
        width: 6, height: 6, borderRadius: "50%",
        background: dotColor, flexShrink: 0,
        boxShadow: status === "active" ? `0 0 8px ${dotColor}` : "none",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        animation: status === "active" ? "breathe 1.5s ease-in-out infinite" : "none",
      }} />
      <span style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: status === "idle" ? "var(--text-4)" : "var(--text-3)",
        fontFamily: "var(--font-mono)",
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

export function StudioScreen() {
  const [searchParams] = useSearchParams();
  const ideaId = searchParams.get("ideaId");
  const navigate = useNavigate();

  const [idea, setIdea] = useState("");
  const [insightsOpen, setInsightsOpen] = useState(false);
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
        if (err instanceof QuotaExceededError) {
          setQuotaError(err.serverMessage);
        }
      })
      .finally(() => setInsightsLoading(false));
  }

  async function handleValidate() {
    if (!idea.trim() || insightsLoading || clarifying) return;
    setInsights(null);
    setInsightsFetched(false);
    setInsightsOpen(false);
    setQuotaError(null);
    setClarityQuestions(null);
    setInsightsError(false);

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
    setInsightsLoading(true);
    setInsightsError(false);
    try {
      const result = await fetchInsights(idea, profile?.niche ?? "", ideaId ?? undefined);
      setInsights(result);
      setInsightsFetched(true);
    } catch { setInsightsError(true); }
    finally { setInsightsLoading(false); }
  }, [idea, profile?.niche, ideaId, insightsFetched, insightsLoading]);

  function handleInsightsToggle() {
    const willOpen = !insightsOpen;
    setInsightsOpen(willOpen);
    if (willOpen && !insightsFetched && !insightsLoading && idea.trim()) {
      void handleGetInsights();
    }
  }

  function handlePlanScript() {
    navigate(`/develop`, {
      state: {
        idea,
        ideaId: ideaId ?? savedIdeaIdRef.current ?? undefined,
        insights: insights?.report ?? null,
      },
    });
  }

  const canValidate = idea.trim().length > 0 && !insightsLoading && !clarifying;
  const showReport = insightsLoading || insightsFetched;
  const canPlanScript = insightsFetched && insights !== null;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <Navbar />

      <div style={{
        maxWidth: 1100, margin: "0 auto",
        padding: "36px 48px 80px",
        display: "flex", flexDirection: "column", gap: 0,
      }}>

        {/* Page header — left-aligned, editorial */}
        <div style={{ marginBottom: 36 }}>
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
            Check your idea against real Instagram and YouTube data before you film anything.
          </p>
        </div>

        {/* STAGE 1: Idea input */}
        <div style={{ marginBottom: 36 }}>
          <SectionHeader label="Your idea" status="done" />

          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            overflow: "hidden",
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
                transition: "background 0.15s ease",
                letterSpacing: "-0.01em",
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
                onMouseEnter={(e) => {
                  if (canValidate) (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-hover)";
                }}
                onMouseLeave={(e) => {
                  if (canValidate) (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)";
                }}
              >
                {clarifying ? (
                  <>
                    <CircleNotch size={14} weight="bold" style={{ animation: "spin 0.7s linear infinite" }} />
                    Checking
                  </>
                ) : (
                  <>
                    <Sparkle size={14} weight="fill" />
                    Validate Idea
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Clarifier inline questions */}
          {clarityQuestions && clarityQuestions.length > 0 && (
            <ClarifierInline
              questions={clarityQuestions}
              onComplete={handleClarifyComplete}
              onSkip={handleClarifySkip}
            />
          )}

          {/* Quota error */}
          {quotaError && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: 12, padding: "14px 18px",
                background: "rgba(217,119,6,0.04)",
                border: "1px solid rgba(217,119,6,0.2)",
                borderRadius: 10,
                display: "flex", alignItems: "flex-start", gap: 10,
              }}
            >
              <WarningCircle size={16} weight="bold" color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 15, color: "#d97706", margin: 0, lineHeight: 1.6, letterSpacing: "-0.005em" }}>
                {quotaError}
              </p>
            </motion.div>
          )}
        </div>

        {/* STAGE 2: Validation report */}
        {showReport && (
          <div style={{ marginBottom: 36 }}>
            <SectionHeader
              label="Validation Report"
              status={insightsLoading ? "active" : "done"}
            />

            {/* Staged loader */}
            {insightsLoading && (
              <StagedLoader isLoading={insightsLoading} isError={insightsError} />
            )}

            <AnimatePresence>
              {insightsFetched && insights && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  style={{ display: "flex", flexDirection: "column", gap: 0 }}
                >
                  {/* Data sources bar */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
                      padding: "14px 24px", marginBottom: 12,
                      background: "var(--bg-card)", border: "1px solid var(--border)",
                      borderRadius: 12,
                    }}
                  >
                    <span style={{
                      fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
                      textTransform: "uppercase", color: "var(--text-4)",
                      fontFamily: "var(--font-mono)",
                    }}>Based on</span>
                    {insights.sources.youtubeCount > 0 && (
                      <SourceBadge
                        label="YouTube"
                        icon={<CheckCircle size={13} weight="fill" />}
                      />
                    )}
                    {insights.signals?.googleTrends?.available && (
                      <SourceBadge
                        label="Google Trends"
                        icon={<CheckCircle size={13} weight="fill" />}
                      />
                    )}
                    <SourceBadge
                      label="AI Interpretation"
                      icon={<Robot size={13} weight="duotone" />}
                      muted
                    />
                  </motion.div>

                  {/* 1. VERDICT */}
                  <VerdictCard insights={insights.report} />

                  {/* 2. PLATFORM FIT */}
                  <PlatformScorecard scores={insights.report.platform_scores ?? []} />

                  {/* 3. STRATEGY & ANGLES */}
                  <MarketResearchPanel
                    isOpen={insightsOpen}
                    onToggle={handleInsightsToggle}
                    insights={insights.report}
                    isLoading={false}
                  />

                  {/* 4. EVIDENCE */}
                  <div style={{ marginTop: 12 }}>
                    <ResearchPanel
                      topVideos={insights.report.topVideos ?? []}
                      youtubeData={insights.report.youtubeData}
                      platformAnalysis={insights.report.platformAnalysis ?? []}
                      platformScores={insights.report.platform_scores ?? []}
                      report={insights.report}
                      signals={insights.signals}
                      sources={insights.sources}
                    />
                  </div>

                  {/* 5. GOOGLE TRENDS */}
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
                </motion.div>
              )}
            </AnimatePresence>

            {/* Accordion in loading state */}
            {insightsLoading && (
              <MarketResearchPanel
                isOpen={false}
                onToggle={handleInsightsToggle}
                insights={null}
                isLoading={true}
              />
            )}
          </div>
        )}

        {/* Next step: Plan Script */}
        <AnimatePresence>
          {canPlanScript && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "18px 24px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
              }}
            >
              <div>
                <div style={{
                  fontSize: 15, fontWeight: 600, color: "var(--text)",
                  marginBottom: 3, letterSpacing: "-0.01em",
                }}>
                  Idea validated
                </div>
                <div style={{
                  fontSize: 14, color: "var(--text-3)",
                  letterSpacing: "-0.005em",
                }}>
                  Plan your script with hooks and beats.
                </div>
              </div>
              <button
                onClick={handlePlanScript}
                className="btn-tactile"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "11px 22px", fontSize: 15, fontWeight: 600,
                  borderRadius: 8, border: "none",
                  background: "var(--accent)", color: "#fff",
                  cursor: "pointer",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  letterSpacing: "-0.01em", flexShrink: 0,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-hover)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)"; }}
              >
                Plan Your Script
                <ArrowRight size={15} weight="bold" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
