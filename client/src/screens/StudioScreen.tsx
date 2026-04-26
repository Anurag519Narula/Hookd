import { useState, useEffect, useCallback } from "react";
import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { MarketResearchPanel } from "../components/MarketResearchPanel";
import { useCreatorProfile } from "../hooks/useCreatorProfile";
import { getIdea, createIdea } from "../api/ideas";
import { fetchInsights, type InsightResponse, QuotaExceededError } from "../api/insights";

// ── Section header — shared design language ───────────────────────────────────
function SectionHeader({ label, status }: { label: string; status?: "active" | "done" | "idle" }) {
  const dotColor = status === "done" ? "#34d399" : status === "active" ? "#14b8a6" : "var(--border)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{
        width: 6, height: 6, borderRadius: "50%",
        background: dotColor, flexShrink: 0,
        boxShadow: status === "active" ? `0 0 6px ${dotColor}` : "none",
        transition: "all 0.3s ease",
      }} />
      <span style={{
        fontSize: 12, fontWeight: 700, letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: status === "idle" ? "var(--text-4)" : "var(--text-3)",
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
  const [quotaError, setQuotaError] = useState<string | null>(null);

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

  async function handleValidate() {
    if (!idea.trim() || insightsLoading) return;
    setInsights(null);
    setInsightsFetched(false);
    setInsightsOpen(false);
    setQuotaError(null);
    if (!ideaId) {
      createIdea(idea.trim())
        .then((saved) => { savedIdeaIdRef.current = saved.id; })
        .catch(() => {});
    }
    setInsightsLoading(true);
    fetchInsights(idea, profile?.niche ?? "", ideaId ?? undefined)
      .then((result) => {
        setInsights(result);
        setInsightsFetched(true);
        setInsightsOpen(true);
      })
      .catch((err) => {
        if (err instanceof QuotaExceededError) {
          setQuotaError(err.serverMessage);
        }
      })
      .finally(() => setInsightsLoading(false));
  }

  const handleGetInsights = useCallback(async () => {
    if (insightsFetched || insightsLoading) return;
    setInsightsLoading(true);
    try {
      const result = await fetchInsights(idea, profile?.niche ?? "", ideaId ?? undefined);
      setInsights(result);
      setInsightsFetched(true);
    } catch { /* silently fail */ }
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

  const canValidate = idea.trim().length > 0 && !insightsLoading;
  const showReport = insightsLoading || insightsFetched;
  const canPlanScript = insightsFetched && insights !== null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />

      <div style={{
        maxWidth: 1100, margin: "0 auto",
        padding: "32px 48px 80px",
        display: "flex", flexDirection: "column", gap: 0,
      }}>

        {/* ── Page header ── */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 700,
            letterSpacing: "-0.03em", color: "var(--text)", margin: "0 0 6px",
            lineHeight: 1.2,
          }}>
            Idea Validation
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-3)", margin: 0, lineHeight: 1.6 }}>
            Check your idea against real Instagram and YouTube data before you film anything.
          </p>
        </div>

        {/* ── STAGE 1: Idea input ── */}
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
              placeholder="Describe your idea, story, or insight. E.g. 'Most people think consistency means posting every day. I think it means posting when you have something worth saying.'"
              rows={4}
              style={{
                display: "block", width: "100%", padding: "16px 18px",
                fontSize: 16, lineHeight: 1.7, color: "var(--text)",
                background: "var(--bg-input)", border: "none",
                borderBottom: "1px solid var(--border)",
                resize: "vertical", boxSizing: "border-box",
                outline: "none", fontFamily: "inherit",
                transition: "background 0.15s ease",
              }}
              onFocus={(e) => { e.currentTarget.style.background = "var(--bg-card)"; }}
              onBlur={(e) => { e.currentTarget.style.background = "var(--bg-input)"; }}
            />

            <div style={{ padding: "12px 18px", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => void handleValidate()}
                disabled={!canValidate}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "8px 18px", fontSize: 15, fontWeight: 600,
                  borderRadius: 6, border: "none",
                  background: canValidate ? "#14b8a6" : "var(--bg-hover)",
                  color: canValidate ? "#fff" : "var(--text-4)",
                  cursor: canValidate ? "pointer" : "not-allowed",
                  transition: "background 0.15s ease",
                  letterSpacing: "-0.01em",
                }}
                onMouseEnter={(e) => {
                  if (canValidate) (e.currentTarget as HTMLButtonElement).style.background = "#0d9488";
                }}
                onMouseLeave={(e) => {
                  if (canValidate) (e.currentTarget as HTMLButtonElement).style.background = "#14b8a6";
                }}
              >
                {insightsLoading ? (
                  <>
                    <span style={{
                      width: 12, height: 12,
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff", borderRadius: "50%",
                      display: "inline-block", animation: "spin 0.7s linear infinite",
                    }} />
                    Validating…
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                    </svg>
                    Validate Idea
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quota error */}
          {quotaError && (
            <div style={{
              marginTop: 10, padding: "12px 16px",
              background: "rgba(245,158,11,0.06)",
              border: "1px solid rgba(245,158,11,0.25)",
              borderRadius: 6,
              display: "flex", alignItems: "flex-start", gap: 10,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p style={{ fontSize: 15, color: "#f59e0b", margin: 0, lineHeight: 1.6 }}>
                {quotaError}
              </p>
            </div>
          )}
        </div>

        {/* ── STAGE 2: Validation report ── */}
        {showReport && (
          <div style={{ marginBottom: 32 }}>
            <SectionHeader
              label="Validation Report"
              status={insightsLoading ? "active" : "done"}
            />
            <MarketResearchPanel
              topic={idea.slice(0, 80)}
              isOpen={insightsOpen}
              onToggle={handleInsightsToggle}
              insights={insights?.report ?? null}
              isLoading={insightsLoading}
            />
          </div>
        )}

        {/* ── Next step: Plan Script ── */}
        {canPlanScript && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 20px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 8,
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>
                Idea validated
              </div>
              <div style={{ fontSize: 14, color: "var(--text-3)" }}>
                Plan your script with hooks and beats.
              </div>
            </div>
            <button
              onClick={handlePlanScript}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "10px 20px", fontSize: 15, fontWeight: 600,
                borderRadius: 6, border: "none",
                background: "#14b8a6", color: "#fff",
                cursor: "pointer", transition: "background 0.15s ease",
                letterSpacing: "-0.01em", flexShrink: 0,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#0d9488"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#14b8a6"; }}
            >
              Plan Your Script
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
