import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { useSettings } from "../hooks/useSettings";
import { fetchInsights } from "../api/insights";
import type { InsightReport } from "../types/insights";
import type { Idea } from "../types/index";

// ── Icons ──────────────────────────────────────────────────────────────────────
const ArrowRight = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

const BackIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

// ── Helpers ────────────────────────────────────────────────────────────────────
function TrendBadge({ direction }: { direction: InsightReport["trendDirection"] }) {
  const config = {
    rising:   { label: "Rising ↑", bg: "rgba(20,184,166,0.12)", color: "#14b8a6", border: "rgba(20,184,166,0.3)" },
    peaked:   { label: "Peaked →", bg: "rgba(251,191,36,0.12)", color: "#f59e0b", border: "rgba(251,191,36,0.3)" },
    declining:{ label: "Declining ↓", bg: "rgba(239,68,68,0.1)", color: "#ef4444", border: "rgba(239,68,68,0.3)" },
    stable:   { label: "Stable —", bg: "rgba(148,163,184,0.12)", color: "#94a3b8", border: "rgba(148,163,184,0.3)" },
  }[direction];

  return (
    <span style={{
      fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 99,
      background: config.bg, color: config.color, border: `1px solid ${config.border}`,
    }}>
      {config.label}
    </span>
  );
}

function CompetitionBadge({ level }: { level: InsightReport["competitionLevel"] }) {
  const config = {
    low:    { label: "Low competition", bg: "rgba(20,184,166,0.1)", color: "#14b8a6" },
    medium: { label: "Medium competition", bg: "rgba(251,191,36,0.1)", color: "#f59e0b" },
    high:   { label: "High competition", bg: "rgba(239,68,68,0.1)", color: "#ef4444" },
  }[level];

  return (
    <span style={{
      fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 99,
      background: config.bg, color: config.color,
    }}>
      {config.label}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? "#14b8a6" : score >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{
        flex: 1, height: 6, borderRadius: 99,
        background: "var(--bg-hover)", overflow: "hidden",
      }}>
        <div style={{
          width: `${score}%`, height: "100%",
          background: color, borderRadius: 99,
          transition: "width 1s ease",
        }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color, minWidth: 36 }}>{score}/100</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)", overflow: "hidden",
    }}>
      <div style={{
        padding: "14px 20px", borderBottom: "1px solid var(--border)",
        background: "var(--bg-subtle)",
      }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)", margin: 0 }}>
          {title}
        </p>
      </div>
      <div style={{ padding: "20px" }}>
        {children}
      </div>
    </div>
  );
}

// ── Shimmer ────────────────────────────────────────────────────────────────────
function InsightSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {[180, 140, 200, 160].map((h, i) => (
        <div key={i} style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)", padding: 20, height: h,
          display: "flex", flexDirection: "column", gap: 12,
        }}>
          <div className="shimmer-line" style={{ height: 12, width: "30%", borderRadius: 4 }} />
          <div className="shimmer-line" style={{ height: 14, width: "90%", borderRadius: 4 }} />
          <div className="shimmer-line" style={{ height: 14, width: "75%", borderRadius: 4 }} />
          <div className="shimmer-line" style={{ height: 14, width: "60%", borderRadius: 4 }} />
        </div>
      ))}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export function InsightScreen() {
  const { ideaId } = useParams<{ ideaId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [settings] = useSettings();

  const locationIdea = (location.state as { idea?: Idea } | null)?.idea;
  const ideaText = locationIdea?.raw_text ?? "";

  const [report, setReport] = useState<InsightReport | null>(null);
  const [sources, setSources] = useState<{ youtubeCount: number; trendsAvailable: boolean; trendScore: number | null; relatedQueries: string[] } | null>(null);
  const [cached, setCached] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ideaText) {
      setError("No idea text found. Please go back and try again.");
      setLoading(false);
      return;
    }

    fetchInsights(ideaText, settings.niche, ideaId)
      .then((data) => {
        setReport(data.report);
        setSources(data.sources);
        setCached(data.cached);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to generate insights");
      })
      .finally(() => setLoading(false));
  }, [ideaText, settings.niche, ideaId]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />

      {/* Page header */}
      <div style={{
        maxWidth: 900, margin: "0 auto",
        padding: "48px 24px 32px",
        borderBottom: "1px solid var(--border)",
        position: "relative", zIndex: 1,
      }}>
        <button
          onClick={() => navigate("/vault")}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 11, fontWeight: 500, color: "var(--text-3)",
            background: "none", border: "none", cursor: "pointer", padding: 0,
            marginBottom: 12, transition: "color var(--transition)",
            letterSpacing: "0.04em", textTransform: "uppercase",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--accent-text)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)"; }}
        >
          <BackIcon /> Back to Vault
        </button>
        <p style={{
          fontSize: 11, fontWeight: 500, letterSpacing: "0.12em",
          textTransform: "uppercase", color: "var(--text-3)", margin: "0 0 10px",
        }}>
          Idea Insights
        </p>
        <h1 style={{
          fontSize: "clamp(20px, 3vw, 30px)", fontWeight: 800,
          letterSpacing: "-0.03em", color: "var(--text)", margin: "0 0 8px",
        }}>
          {ideaText ? `"${ideaText.slice(0, 80)}${ideaText.length > 80 ? "…" : ""}"` : "Analysing your idea"}
        </h1>
        {sources && (
          <p style={{ fontSize: 12, color: "var(--text-4)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            Based on {sources.youtubeCount} YouTube videos
            {sources.trendsAvailable ? ` · Google Trends score: ${sources.trendScore}/100` : ""}
            {cached && (
              <span style={{
                fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
                background: "rgba(99,102,241,0.1)", color: "#818cf8",
                border: "1px solid rgba(99,102,241,0.2)",
              }}>
                Cached · refreshes in 24h
              </span>
            )}
          </p>
        )}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 80px", position: "relative", zIndex: 1 }}>

        {loading && (
          <div>
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "16px 20px", marginBottom: 24,
              background: "var(--accent-subtle)", border: "1px solid rgba(20,184,166,0.2)",
              borderRadius: "var(--radius-md)",
            }}>
              <span style={{ animation: "spin 1s linear infinite", display: "inline-block", fontSize: 16 }}>⟳</span>
              <p style={{ fontSize: 13, color: "var(--accent-text)", margin: 0, fontWeight: 500 }}>
                Pulling real-time data from YouTube and Groq AI…
              </p>
            </div>
            <InsightSkeleton />
          </div>
        )}

        {error && (
          <div style={{
            background: "var(--error-subtle)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "var(--radius-lg)", padding: "24px",
            textAlign: "center",
          }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--error)", margin: "0 0 8px" }}>
              Couldn't generate insights
            </p>
            <p style={{ fontSize: 13, color: "var(--text-3)", margin: "0 0 16px" }}>{error}</p>
            <button
              onClick={() => navigate("/vault")}
              style={{
                padding: "9px 20px", fontSize: 13, fontWeight: 600,
                borderRadius: "var(--radius-sm)", border: "1px solid var(--border)",
                background: "var(--bg-card)", color: "var(--text-2)", cursor: "pointer",
              }}
            >
              Back to Vault
            </button>
          </div>
        )}

        {report && !loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Key insight banner */}
            <div style={{
              padding: "20px 24px",
              background: "linear-gradient(135deg, rgba(20,184,166,0.08), rgba(99,102,241,0.06))",
              border: "1px solid rgba(20,184,166,0.2)",
              borderRadius: "var(--radius-lg)",
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent-text)", margin: "0 0 8px" }}>
                Key Insight
              </p>
              <p style={{ fontSize: 15, color: "var(--text)", margin: 0, lineHeight: 1.65, fontWeight: 500 }}>
                {report.keyInsight}
              </p>
            </div>

            {/* Overview row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }} className="insight-overview-grid">
              <div style={{
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)", padding: "20px",
              }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)", margin: "0 0 12px" }}>
                  Trend
                </p>
                <TrendBadge direction={report.trendDirection} />
                <div style={{ marginTop: 12 }}>
                  <ScoreBar score={report.trendScore} />
                </div>
              </div>
              <div style={{
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)", padding: "20px",
              }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)", margin: "0 0 12px" }}>
                  Competition
                </p>
                <CompetitionBadge level={report.competitionLevel} />
                <p style={{ fontSize: 12, color: "var(--text-3)", margin: "10px 0 0", lineHeight: 1.5 }}>
                  {report.competitionLevel === "low" ? "Good time to enter this space." : report.competitionLevel === "medium" ? "Differentiation is key." : "You need a very specific angle."}
                </p>
              </div>
              <div style={{
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)", padding: "20px",
              }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)", margin: "0 0 12px" }}>
                  Best Format
                </p>
                <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: "0 0 8px" }}>
                  {report.recommendedFormat}
                </p>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {report.bestPlatforms.map((p) => (
                    <span key={p} style={{
                      fontSize: 11, padding: "2px 8px", borderRadius: 99,
                      background: "var(--bg-subtle)", color: "var(--text-3)",
                      border: "1px solid var(--border)",
                    }}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary */}
            <Section title="Overview">
              <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.75, margin: 0 }}>
                {report.summary}
              </p>
            </Section>

            {/* Top angles */}
            <Section title="What's already working">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {report.topAngles.map((item, i) => (
                  <div key={i} style={{
                    display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16,
                    paddingBottom: i < report.topAngles.length - 1 ? 12 : 0,
                    borderBottom: i < report.topAngles.length - 1 ? "1px solid var(--border)" : "none",
                  }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0 }}>{item.angle}</p>
                    <p style={{ fontSize: 13, color: "var(--text-3)", margin: 0, lineHeight: 1.6 }}>{item.why}</p>
                  </div>
                ))}
              </div>
            </Section>

            {/* Untapped angles */}
            <Section title="Untapped opportunities">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {report.untappedAngles.map((item, i) => (
                  <div key={i} style={{
                    padding: "14px 16px",
                    background: "rgba(20,184,166,0.04)",
                    border: "1px solid rgba(20,184,166,0.15)",
                    borderRadius: "var(--radius-md)",
                  }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: "0 0 4px" }}>
                      {item.angle}
                    </p>
                    <p style={{ fontSize: 13, color: "var(--text-3)", margin: 0, lineHeight: 1.6 }}>
                      {item.opportunity}
                    </p>
                  </div>
                ))}
              </div>
            </Section>

            {/* Hook suggestions */}
            <Section title="Hook suggestions from the data">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {report.hookSuggestions.map((hook, i) => (
                  <div key={i} style={{
                    padding: "12px 16px",
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: 14, color: "var(--text)", lineHeight: 1.5,
                    fontStyle: "italic",
                  }}>
                    "{hook}"
                  </div>
                ))}
              </div>
            </Section>

            {/* Reddit sentiment removed — no Reddit API */}

            {/* CTA */}
            <div style={{
              display: "flex", justifyContent: "flex-end", gap: 10,
              paddingTop: 8,
            }}>
              <button
                onClick={() => navigate(`/develop/${ideaId ?? ""}`, { state: { idea: locationIdea } })}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "12px 24px", fontSize: 14, fontWeight: 600,
                  borderRadius: 99, border: "none",
                  background: "var(--text)", color: "var(--bg)",
                  cursor: "pointer", transition: "opacity var(--transition)",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.8"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
              >
                Develop this idea <ArrowRight />
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          .insight-overview-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
