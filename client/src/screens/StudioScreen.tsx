import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { MarketResearchPanel } from "../components/MarketResearchPanel";
import { useCreatorProfile } from "../hooks/useCreatorProfile";
import { getIdea } from "../api/ideas";
import { fetchInsights, type InsightResponse } from "../api/insights";

const SparkleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

export function StudioScreen() {
  const [searchParams] = useSearchParams();
  const ideaId = searchParams.get("ideaId");
  const navigate = useNavigate();

  const [idea, setIdea] = useState("");

  // Market research state
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [insights, setInsights] = useState<InsightResponse | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsFetched, setInsightsFetched] = useState(false);

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
      } catch {
        // silently ignore
      }
    }
    void restoreIdea();
    return () => { cancelled = true; };
  }, [ideaId]);

  async function handleValidate() {
    if (!idea.trim() || insightsLoading) return;
    setInsights(null);
    setInsightsFetched(false);
    setInsightsOpen(false);
    // Fetch insights
    setInsightsLoading(true);
    fetchInsights(idea, profile?.niche ?? "", ideaId ?? undefined)
      .then((result) => {
        console.log("✅ Insights fetched successfully in Studio", result);
        setInsights(result);
        setInsightsFetched(true);
        setInsightsOpen(true); // auto-open when ready
      })
      .catch(() => {})
      .finally(() => setInsightsLoading(false));
  }

  const handleGetInsights = useCallback(async () => {
    if (insightsFetched || insightsLoading) return;
    setInsightsLoading(true);
    try {
      const result = await fetchInsights(idea, profile?.niche ?? "", ideaId ?? undefined);
      console.log("✅ Insights fetched on demand in Studio", result);
      setInsights(result);
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

  function handlePlanScript() {
    // Navigate to develop page with the idea and insights via state (clean URL)
    navigate(`/develop`, {
      state: {
        idea,
        ideaId: ideaId ?? undefined,
        insights: insights?.report ?? null
      }
    });
  }

  const canValidate = idea.trim().length > 0 && !insightsLoading;
  const showValidationReport = insightsLoading || insightsFetched;
  const canPlanScript = insightsFetched && insights !== null;

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
            Idea Validation Studio
          </p>
          <h1 style={{
            fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 800,
            letterSpacing: "-0.04em", color: "var(--text)", margin: "0 0 12px",
            lineHeight: 1.1,
          }}>
            Validate your idea with{" "}
            <span style={{
              background: "linear-gradient(135deg, var(--accent), #6366f1)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              real data
            </span>
          </h1>
          <p style={{
            fontSize: 15, color: "var(--text-3)", margin: 0,
            lineHeight: 1.65, maxWidth: 560, marginLeft: "auto", marginRight: "auto",
          }}>
            Get a comprehensive validation report with YouTube data, trend analysis, competition insights, and content blueprint — before you create anything.
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
            {/* Validate button */}
            <button
              onClick={() => void handleValidate()}
              disabled={!canValidate}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 8, width: "100%", padding: "15px 24px", fontSize: 15,
                fontWeight: 700, color: "#fff",
                background: canValidate
                  ? "linear-gradient(135deg, var(--accent) 0%, #6366f1 100%)"
                  : "var(--text-4)",
                border: "none", borderRadius: "var(--radius-md)",
                cursor: canValidate ? "pointer" : "not-allowed",
                transition: "all var(--transition)",
                boxShadow: canValidate ? "0 4px 20px rgba(13,148,136,0.3)" : "none",
                letterSpacing: "-0.01em",
              }}
              onMouseEnter={(e) => {
                if (canValidate) {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.transform = "translateY(-1px)";
                  b.style.boxShadow = "0 6px 28px rgba(13,148,136,0.4)";
                }
              }}
              onMouseLeave={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.transform = "translateY(0)";
                b.style.boxShadow = canValidate ? "0 4px 20px rgba(13,148,136,0.3)" : "none";
              }}
            >
              {insightsLoading ? (
                <>
                  <span style={{
                    width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)",
                    borderTopColor: "#fff", borderRadius: "50%",
                    display: "inline-block", animation: "spin 0.7s linear infinite",
                  }} />
                  Validating idea…
                </>
              ) : (
                <>
                  <SparkleIcon />
                  Validate Idea
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Idea Validation Report ── */}
        {showValidationReport && (
          <MarketResearchPanel
            topic={idea.slice(0, 80)}
            isOpen={insightsOpen}
            onToggle={handleInsightsToggle}
            insights={insights?.report ?? null}
            isLoading={insightsLoading}
          />
        )}

        {/* ── Plan Script Button ── */}
        {canPlanScript && (
          <div style={{
            display: "flex",
            justifyContent: "center",
            paddingTop: 8,
          }}>
            <button
              onClick={handlePlanScript}
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
              Plan Your Script <ArrowRightIcon />
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
