import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { useSettings } from "../hooks/useSettings";
import { fetchInsights } from "../api/insights";
import { getIdea } from "../api/ideas";
import type { InsightReport } from "../types/insights";
import type { Idea } from "../types/index";

function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? "#34d399" : score >= 40 ? "#f59e0b" : "#f87171";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 4, borderRadius: 99, background: "var(--border)", overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 99, transition: "width 1s ease" }} />
      </div>
      <span style={{ fontSize: 14, fontWeight: 700, color, minWidth: 32, textAlign: "right" }}>{score}</span>
    </div>
  );
}

function InsightSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {[160, 120, 180, 140].map((h, i) => (
        <div key={i} className="shimmer-line" style={{ height: h, borderRadius: 8 }} />
      ))}
    </div>
  );
}

export function InsightScreen() {
  const { ideaId } = useParams<{ ideaId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [settings] = useSettings();

  const locationIdea = (location.state as { idea?: Idea } | null)?.idea;
  const [idea, setIdea] = useState<Idea | null>(locationIdea ?? null);
  const ideaText = idea?.raw_text ?? "";

  const [report, setReport] = useState<InsightReport | null>(null);
  const [sources, setSources] = useState<{ youtubeCount: number; trendsAvailable: boolean; trendScore: number | null } | null>(null);
  const [cached, setCached] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (locationIdea) return;
    if (!ideaId) return;
    let cancelled = false;
    (async () => {
      try {
        const fetched = await getIdea(ideaId);
        if (!cancelled) setIdea(fetched);
      } catch {
        if (!cancelled) { setError("Failed to load idea"); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [ideaId, locationIdea]);

  useEffect(() => {
    if (!ideaText) { setError("No idea text found."); setLoading(false); return; }
    if (idea?.insights) {
      try {
        const d = idea.insights as any;
        setReport(d.report); setSources(d.sources); setCached(true); setLoading(false); return;
      } catch { /* fall through */ }
    }
    fetchInsights(ideaText, settings.niche, ideaId)
      .then((d) => { setReport(d.report); setSources(d.sources); setCached(d.cached); })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to generate insights"))
      .finally(() => setLoading(false));
  }, [ideaText, settings.niche, ideaId, idea?.insights]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 48px 80px" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <button
            onClick={() => navigate("/vault")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 13, fontWeight: 600, letterSpacing: "0.08em",
              textTransform: "uppercase", color: "var(--text-3)",
              background: "none", border: "none", cursor: "pointer", padding: 0,
              marginBottom: 18, transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#14b8a6"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)"; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Vault
          </button>

          <h1 style={{ fontSize: "clamp(16px, 2.5vw, 22px)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text)", margin: "0 0 6px", lineHeight: 1.4 }}>
            {ideaText ? `"${ideaText.slice(0, 80)}${ideaText.length > 80 ? "…" : ""}"` : "Analysing your idea"}
          </h1>
          {sources && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: "var(--text-4)" }}>
                Based on {sources.youtubeCount} YouTube videos and Instagram data
                {sources.trendsAvailable ? ` · Trends score: ${sources.trendScore}/100` : ""}
              </span>
              {cached && (
                <span style={{
                  fontSize: 12, fontWeight: 600, padding: "2px 7px", borderRadius: 3,
                  background: "rgba(20,184,166,0.08)", color: "#14b8a6",
                  border: "1px solid rgba(20,184,166,0.2)",
                }}>
                  Cached
                </span>
              )}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "12px 16px", marginBottom: 20,
              background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.15)",
              borderRadius: 6,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#14b8a6", display: "inline-block", animation: "pulse-glow 1.4s ease-in-out infinite" }} />
              <p style={{ fontSize: 14, color: "#14b8a6", margin: 0 }}>Pulling real-time data from Instagram and YouTube…</p>
            </div>
            <InsightSkeleton />
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, padding: "20px", textAlign: "center" }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: "var(--error)", margin: "0 0 6px" }}>Couldn't generate insights</p>
            <p style={{ fontSize: 14, color: "var(--text-3)", margin: "0 0 14px" }}>{error}</p>
            <button onClick={() => navigate("/vault")} style={{ padding: "7px 16px", fontSize: 14, fontWeight: 600, borderRadius: 4, border: "1px solid var(--border)", background: "transparent", color: "var(--text-2)", cursor: "pointer" }}>
              Back to Vault
            </button>
          </div>
        )}

        {/* Report */}
        {report && !loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

            {/* Verdict */}
            <div>
              <SectionHeader label="Verdict" />
              <div style={{
                padding: "14px 18px",
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderLeft: "3px solid #14b8a6", borderRadius: 8,
              }}>
                <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: "0 0 4px" }}>{report.verdictLabel}</p>
                <p style={{ fontSize: 15, color: "var(--text-2)", margin: 0, lineHeight: 1.65 }}>{report.verdictReason}</p>
              </div>
            </div>

            {/* Scores */}
            <div>
              <SectionHeader label="Scores" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, background: "var(--border)", borderRadius: 8, overflow: "hidden" }} className="insight-overview-grid">
                {[
                  { label: "Opportunity", value: report.opportunityScore },
                  { label: "Trend", value: report.trendScore },
                  { label: "Audience Fit", value: report.audienceFit.score },
                ].map((s) => (
                  <div key={s.label} style={{ padding: "14px 16px", background: "var(--bg-card)" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 10 }}>
                      {s.label}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 8 }}>
                      {s.value}
                    </div>
                    <ScoreBar score={s.value} />
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div>
              <SectionHeader label="Summary" />
              <p style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.75, margin: 0 }}>{report.summary}</p>
            </div>

            {/* Instagram & YouTube Data */}
            {report.youtubeData && (
              <div>
                <SectionHeader label="Instagram & YouTube Data" />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: "var(--border)", borderRadius: 8, overflow: "hidden" }}>
                  {[
                    { label: "Top Video", value: `${(report.youtubeData.topVideoViews / 1000).toFixed(0)}K` },
                    { label: "Avg Top 5", value: `${(report.youtubeData.avgTopVideoViews / 1000).toFixed(0)}K` },
                    { label: "Videos Found", value: String(report.youtubeData.totalVideosFound) },
                    { label: "Range", value: report.youtubeData.viewsRange },
                  ].map((s) => (
                    <div key={s.label} style={{ padding: "12px 14px", background: "var(--bg-card)" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>{s.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em" }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Angles */}
            {report.topAngles.length > 0 && (
              <div>
                <SectionHeader label="Top Angles" />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {report.topAngles.map((a, i) => (
                    <div key={i} style={{
                      display: "grid", gridTemplateColumns: "28px 1fr",
                      gap: 12, padding: "12px 14px",
                      background: "var(--bg-card)", border: "1px solid var(--border)",
                      borderRadius: 6,
                    }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-4)", paddingTop: 2, fontVariantNumeric: "tabular-nums" }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: "0 0 4px" }}>{a.angle}</p>
                        <p style={{ fontSize: 14, color: "var(--text-3)", margin: 0, lineHeight: 1.6 }}>{a.why}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Untapped Angles */}
            {report.untappedAngles.length > 0 && (
              <div>
                <SectionHeader label="Untapped Angles" />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {report.untappedAngles.map((a, i) => (
                    <div key={i} style={{
                      padding: "12px 14px",
                      background: "rgba(52,211,153,0.04)",
                      border: "1px solid rgba(52,211,153,0.15)",
                      borderRadius: 6,
                    }}>
                      <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: "0 0 4px" }}>{a.angle}</p>
                      <p style={{ fontSize: 14, color: "var(--text-3)", margin: 0, lineHeight: 1.6 }}>{a.opportunity}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Insight */}
            <div style={{
              padding: "14px 18px",
              background: "var(--bg-subtle)", border: "1px solid var(--border)",
              borderLeft: "3px solid #14b8a6", borderRadius: 8,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#14b8a6", marginBottom: 7 }}>
                Key Insight
              </div>
              <p style={{ fontSize: 16, color: "var(--text)", fontWeight: 500, lineHeight: 1.75, margin: 0 }}>
                {report.keyInsight}
              </p>
            </div>

            {/* CTA */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => navigate(`/studio?ideaId=${ideaId ?? ""}`)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "10px 20px", fontSize: 15, fontWeight: 600,
                  borderRadius: 6, border: "none",
                  background: "#14b8a6", color: "#fff",
                  cursor: "pointer", transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#0d9488"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#14b8a6"; }}
              >
                Open in Studio
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) { .insight-overview-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
