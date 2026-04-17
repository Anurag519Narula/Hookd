import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { useSettings } from "../hooks/useSettings";
import { fetchInsights } from "../api/insights";
import { getIdea } from "../api/ideas";
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
  const [idea, setIdea] = useState<Idea | null>(locationIdea ?? null);
  const ideaText = idea?.raw_text ?? "";

  const [report, setReport] = useState<InsightReport | null>(null);
  const [sources, setSources] = useState<{ youtubeCount: number; trendsAvailable: boolean; trendScore: number | null; relatedQueries: string[] } | null>(null);
  const [cached, setCached] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch idea from API if not passed in state
  useEffect(() => {
    if (locationIdea) return; // Already have the idea from state
    if (!ideaId) return;

    let cancelled = false;
    (async () => {
      try {
        const fetchedIdea = await getIdea(ideaId);
        if (!cancelled) {
          setIdea(fetchedIdea);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Failed to load idea");
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [ideaId, locationIdea]);

  useEffect(() => {
    if (!ideaText) {
      setError("No idea text found. Please go back and try again.");
      setLoading(false);
      return;
    }

    // Check if insights are already cached in the idea
    if (idea?.insights) {
      try {
        const insightData = idea.insights as any;
        console.log("💾 Cache hit: Using cached insights for idea", ideaId, insightData);
        setReport(insightData.report);
        setSources(insightData.sources);
        setCached(true);
        setLoading(false);
        return;
      } catch {
        // If parsing fails, fall through to fetch fresh insights
        console.warn("⚠️ Failed to parse cached insights, fetching fresh insights");
      }
    }

    // Fetch fresh insights if not cached
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
  }, [ideaText, settings.niche, ideaId, idea?.insights]);

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

            {/* Verdict banner */}
            <div style={{
              padding: "20px 24px",
              background: "linear-gradient(135deg, rgba(20,184,166,0.08), rgba(99,102,241,0.06))",
              border: "1px solid rgba(20,184,166,0.2)",
              borderRadius: "var(--radius-lg)",
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent-text)", margin: "0 0 8px" }}>
                Verdict
              </p>
              <p style={{ fontSize: 15, color: "var(--text)", margin: 0, lineHeight: 1.65, fontWeight: 500 }}>
                {report.verdictLabel} — {report.verdictReason}
              </p>
            </div>

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

            {/* Score row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }} className="insight-overview-grid">
              <div style={{
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)", padding: "20px",
              }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)", margin: "0 0 12px" }}>
                  Opportunity Score
                </p>
                <p style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", margin: "0 0 4px" }}>
                  {report.opportunityScore}
                </p>
                <p style={{ fontSize: 10, color: "var(--text-3)", margin: 0 }}>/100</p>
              </div>
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
                  Audience Fit
                </p>
                <p style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", margin: "0 0 4px" }}>
                  {report.audienceFit.score}
                </p>
                <p style={{ fontSize: 10, color: "var(--text-3)", margin: 0 }}>/100</p>
              </div>
            </div>

            {/* Summary */}
            <Section title="Overview">
              <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.75, margin: 0 }}>
                {report.summary}
              </p>
            </Section>

            {/* YouTube Data */}
            {report.youtubeData && (
              <Section title="▶️ YouTube Data">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                      Top Video
                    </p>
                    <p style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", margin: 0 }}>
                      {(report.youtubeData.topVideoViews / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                      Avg Top 5
                    </p>
                    <p style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", margin: 0 }}>
                      {(report.youtubeData.avgTopVideoViews / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                      Videos Found
                    </p>
                    <p style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", margin: 0 }}>
                      {report.youtubeData.totalVideosFound}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                      Views Range
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: 0 }}>
                      {report.youtubeData.viewsRange}
                    </p>
                  </div>
                </div>
                {report.youtubeData.topChannels.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", marginBottom: 6 }}>
                      Top Channels
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {report.youtubeData.topChannels.map(ch => (
                        <span key={ch} style={{
                          display: "inline-block",
                          fontSize: 12,
                          fontWeight: 500,
                          color: "var(--accent-text)",
                          background: "rgba(20,184,166,0.08)",
                          border: "1px solid rgba(20,184,166,0.2)",
                          borderRadius: 99,
                          padding: "3px 10px",
                        }}>
                          {ch}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Section>
            )}

            {/* Content Blueprint */}
            <Section title="🎬 Content Blueprint">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{
                  padding: "12px 14px",
                  borderRadius: "var(--radius-sm)",
                  background: "rgba(20,184,166,0.08)",
                  border: "1px solid rgba(20,184,166,0.2)",
                }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 4 }}>
                    ⚡ Opening Hook
                  </p>
                  <p style={{ fontSize: 13, color: "var(--text)", fontWeight: 500, lineHeight: 1.6, margin: 0 }}>
                    {report.contentBlueprint.openingHook}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
                    Core Message
                  </p>
                  <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>
                    {report.contentBlueprint.coreMessage}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
                    Closing CTA
                  </p>
                  <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>
                    {report.contentBlueprint.closingCTA}
                  </p>
                </div>
              </div>
            </Section>

            {/* Platform Analysis */}
            {report.platformAnalysis.length > 0 && (
              <Section title="📱 Platform Analysis">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                  {report.platformAnalysis.map((p, i) => (
                    <div key={i} style={{
                      background: "var(--bg-subtle)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      padding: "12px",
                    }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: "0 0 8px" }}>
                        {p.platform}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--text-3)", margin: "0 0 6px" }}>
                        <span style={{ fontWeight: 600 }}>Avg views: </span>
                        {p.avgViewsForTopic}
                      </p>
                      <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5, margin: 0 }}>
                        {p.contentStyle}
                      </p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Top angles */}
            <Section title="🎯 Top Angles">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {report.topAngles.map((item, i) => (
                  <div key={i} style={{
                    padding: "12px 14px",
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                  }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: "0 0 4px" }}>
                      {item.angle}
                    </p>
                    <p style={{ fontSize: 13, color: "var(--text-3)", margin: 0, lineHeight: 1.6 }}>
                      {item.why}
                    </p>
                  </div>
                ))}
              </div>
            </Section>

            {/* Untapped angles */}
            <Section title="💎 Untapped opportunities">
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

            {/* CTA */}
            <div style={{
              display: "flex", justifyContent: "flex-end", gap: 10,
              paddingTop: 8,
            }}>
              <button
                onClick={() => navigate(`/studio?ideaId=${ideaId ?? ""}`)}
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
                Go to Studio <ArrowRight />
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
