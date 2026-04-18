import { InsightReport } from "../types/insights";

interface MarketResearchPanelProps {
  topic: string;
  isOpen: boolean;
  onToggle: () => void;
  insights: InsightReport | null;
  isLoading: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatViews(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toLocaleString();
}

function verdictColor(label: InsightReport["verdictLabel"]): string {
  switch (label) {
    case "Strong opportunity": return "#34d399";
    case "Good opportunity":   return "#14b8a6";
    case "Proceed with caution": return "#f59e0b";
    case "Avoid for now":      return "#f87171";
  }
}

function verdictBg(label: InsightReport["verdictLabel"]): string {
  switch (label) {
    case "Strong opportunity": return "rgba(52,211,153,0.08)";
    case "Good opportunity":   return "rgba(20,184,166,0.08)";
    case "Proceed with caution": return "rgba(245,158,11,0.08)";
    case "Avoid for now":      return "rgba(248,113,113,0.08)";
  }
}

function scoreColor(n: number): string {
  if (n >= 75) return "#34d399";
  if (n >= 50) return "#14b8a6";
  if (n >= 30) return "#f59e0b";
  return "#f87171";
}

function trendLabel(dir: InsightReport["trendDirection"]): string {
  switch (dir) {
    case "rising":   return "Rising";
    case "declining": return "Declining";
    case "stable":   return "Stable";
    case "peaked":   return "Peaked";
  }
}

function trendArrow(dir: InsightReport["trendDirection"]): string {
  switch (dir) {
    case "rising":   return "↑";
    case "declining": return "↓";
    case "stable":   return "→";
    case "peaked":   return "~";
  }
}

function trendColor(dir: InsightReport["trendDirection"]): string {
  switch (dir) {
    case "rising":   return "#34d399";
    case "declining": return "#f87171";
    case "stable":   return "#94a3b8";
    case "peaked":   return "#f59e0b";
  }
}

function compColor(c: "low" | "medium" | "high"): string {
  return c === "low" ? "#34d399" : c === "medium" ? "#f59e0b" : "#f87171";
}

function reachColor(r: "low" | "medium" | "high"): string {
  return r === "high" ? "#34d399" : r === "medium" ? "#f59e0b" : "#f87171";
}

function diffColor(d: "easy" | "medium" | "hard"): string {
  return d === "easy" ? "#34d399" : d === "medium" ? "#f59e0b" : "#f87171";
}

// ── Score bar — horizontal fill, no circles ───────────────────────────────────
function ScoreBar({ score, color, height = 3 }: { score: number; color: string; height?: number }) {
  return (
    <div style={{
      width: "100%",
      height,
      background: "rgba(255,255,255,0.06)",
      borderRadius: 99,
      overflow: "hidden",
    }}>
      <div style={{
        height: "100%",
        width: `${Math.min(100, Math.max(0, score))}%`,
        background: color,
        borderRadius: 99,
        transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
      }} />
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 14,
    }}>
      <span style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--text-3)",
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

// ── Inline badge ──────────────────────────────────────────────────────────────
function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "2px 8px",
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 600,
      color,
      background: `${color}14`,
      border: `1px solid ${color}30`,
      letterSpacing: "0.02em",
    }}>
      {label}
    </span>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div style={{ padding: "24px 0", display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="shimmer-line" style={{ height: 88, borderRadius: 8 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[0,1,2,3].map(i => (
          <div key={i} className="shimmer-line" style={{ height: 64, borderRadius: 8 }} />
        ))}
      </div>
      <div className="shimmer-line" style={{ height: 120, borderRadius: 8 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {[0,1,2].map(i => (
          <div key={i} className="shimmer-line" style={{ height: 80, borderRadius: 8 }} />
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function MarketResearchPanel({
  topic,
  isOpen,
  onToggle,
  insights,
  isLoading,
}: MarketResearchPanelProps) {
  const hasData = !!insights && !isLoading;

  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
    }}>
      {/* ── Collapse toggle ── */}
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--text)",
          textAlign: "left",
          gap: 12,
          borderBottom: isOpen ? "1px solid var(--border)" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: "rgba(20,184,166,0.1)",
            border: "1px solid rgba(20,184,166,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>
              Validation Report
            </div>
            {topic && (
              <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {topic}
              </div>
            )}
          </div>
          {isLoading && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600,
              background: "rgba(20,184,166,0.1)", color: "#14b8a6",
              border: "1px solid rgba(20,184,166,0.2)", flexShrink: 0,
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: "50%", background: "#14b8a6",
                display: "inline-block", animation: "pulse-glow 1.4s ease-in-out infinite",
              }} />
              Analyzing
            </span>
          )}
          {!isLoading && hasData && !isOpen && (
            <span style={{
              display: "inline-flex", alignItems: "center", padding: "2px 8px",
              borderRadius: 4, fontSize: 11, fontWeight: 700,
              background: verdictBg(insights.verdictLabel),
              color: verdictColor(insights.verdictLabel),
              border: `1px solid ${verdictColor(insights.verdictLabel)}30`,
              flexShrink: 0,
            }}>
              {insights.verdictLabel}
            </span>
          )}
        </div>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ color: "var(--text-3)", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease", flexShrink: 0 }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* ── Body ── */}
      {isOpen && (
        <div style={{ padding: "0 20px 28px" }}>
          {isLoading && <LoadingSkeleton />}

          {!isLoading && !insights && (
            <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-3)" }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)", marginBottom: 4 }}>No report yet</div>
              <div style={{ fontSize: 12 }}>Validate an idea to see the report here.</div>
            </div>
          )}

          {hasData && <ReportBody insights={insights} />}
        </div>
      )}
    </div>
  );
}

// ── Report body ───────────────────────────────────────────────────────────────

function ReportBody({ insights }: { insights: InsightReport }) {
  const vc = verdictColor(insights.verdictLabel);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, paddingTop: 24 }}>

      {/* ── 1. SIGNAL BAR — verdict + three scores in one row ── */}
      <div style={{
        borderRadius: 10,
        background: `linear-gradient(135deg, ${verdictBg(insights.verdictLabel)}, rgba(0,0,0,0))`,
        border: `1px solid ${vc}22`,
        overflow: "hidden",
      }}>
        {/* Verdict row */}
        <div style={{
          padding: "16px 20px 14px",
          borderBottom: `1px solid ${vc}18`,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: vc,
            boxShadow: `0 0 8px ${vc}`,
            flexShrink: 0,
          }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: vc, letterSpacing: "-0.02em" }}>
            {insights.verdictLabel}
          </span>
          {insights.saturationWarning && (
            <Badge label="Saturated" color="#f87171" />
          )}
          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-3)", fontWeight: 500 }}>
            {insights.trendVelocity}
          </span>
        </div>

        {/* Scores row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1px 1fr 1px 1fr",
          background: "rgba(0,0,0,0.15)",
        }}>
          {/* Opportunity */}
          <div style={{ padding: "16px 20px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>
              Opportunity
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: scoreColor(insights.opportunityScore), letterSpacing: "-0.04em", lineHeight: 1 }}>
                {insights.opportunityScore}
              </span>
              <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 500 }}>/100</span>
            </div>
            <ScoreBar score={insights.opportunityScore} color={scoreColor(insights.opportunityScore)} height={3} />
          </div>

          <div style={{ background: "var(--border)" }} />

          {/* Trend */}
          <div style={{ padding: "16px 20px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>
              Trend
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: scoreColor(insights.trendScore), letterSpacing: "-0.04em", lineHeight: 1 }}>
                {insights.trendScore}
              </span>
              <span style={{
                fontSize: 16, fontWeight: 700,
                color: trendColor(insights.trendDirection),
              }}>
                {trendArrow(insights.trendDirection)}
              </span>
            </div>
            <ScoreBar score={insights.trendScore} color={scoreColor(insights.trendScore)} height={3} />
            <div style={{ fontSize: 11, color: trendColor(insights.trendDirection), fontWeight: 600, marginTop: 6 }}>
              {trendLabel(insights.trendDirection)}
            </div>
          </div>

          <div style={{ background: "var(--border)" }} />

          {/* Audience */}
          <div style={{ padding: "16px 20px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>
              Audience Fit
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: scoreColor(insights.audienceFit.score), letterSpacing: "-0.04em", lineHeight: 1 }}>
                {insights.audienceFit.score}
              </span>
              <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 500 }}>/100</span>
            </div>
            <ScoreBar score={insights.audienceFit.score} color={scoreColor(insights.audienceFit.score)} height={3} />
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 6, lineHeight: 1.4 }}>
              {insights.audienceFit.primaryAudience}
            </div>
          </div>
        </div>

        {/* Verdict reason */}
        <div style={{ padding: "12px 20px", borderTop: `1px solid ${vc}18` }}>
          <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.65, margin: 0 }}>
            {insights.verdictReason}
          </p>
        </div>
      </div>

      {/* ── 2. SUMMARY + CONTEXT ── */}
      <div>
        <SectionHeader label="Summary" />
        <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.75, margin: "0 0 14px" }}>
          {insights.summary}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <Badge label={insights.audienceFit.audienceIntent} color="#14b8a6" />
          <Badge label={`${insights.competitionLevel} competition`} color={compColor(insights.competitionLevel)} />
          {insights.audienceFit.bestDays.slice(0, 3).map(d => (
            <Badge key={d} label={d} color="#94a3b8" />
          ))}
          {insights.audienceFit.bestPostingTimes.slice(0, 2).map(t => (
            <Badge key={t} label={t} color="#94a3b8" />
          ))}
        </div>
      </div>

      {/* ── 3. YOUTUBE DATA ── */}
      {insights.youtubeData && (
        <div>
          <SectionHeader label="YouTube Data" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: "var(--border)", borderRadius: 8, overflow: "hidden" }}>
            {[
              { label: "Top Video", value: formatViews(insights.youtubeData.topVideoViews), sub: "views", accent: true },
              { label: "Avg Top 5", value: formatViews(insights.youtubeData.avgTopVideoViews), sub: "views", accent: false },
              { label: "Videos Found", value: insights.youtubeData.totalVideosFound.toLocaleString(), sub: "total", accent: false },
              { label: "Range", value: insights.youtubeData.viewsRange, sub: "views", accent: false, small: true },
            ].map((stat, i) => (
              <div key={i} style={{
                padding: "14px 16px",
                background: stat.accent ? "rgba(20,184,166,0.06)" : "var(--bg-card)",
              }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: (stat as any).small ? 14 : 20, fontWeight: 800, color: stat.accent ? "#14b8a6" : "var(--text)", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* Channels + titles */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            {insights.youtubeData.topChannels.length > 0 && (
              <div style={{
                background: "var(--bg-subtle)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "14px 16px",
              }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 10 }}>
                  Top Channels
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {insights.youtubeData.topChannels.slice(0, 4).map((ch, i) => (
                    <div key={ch} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        width: 16, height: 16, borderRadius: 3,
                        background: i === 0 ? "rgba(20,184,166,0.15)" : "var(--bg-hover)",
                        color: i === 0 ? "#14b8a6" : "var(--text-3)",
                        fontSize: 9, fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        {i + 1}
                      </span>
                      <span style={{
                        fontSize: 12, color: i === 0 ? "var(--text)" : "var(--text-2)",
                        fontWeight: i === 0 ? 600 : 400,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {ch}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {insights.youtubeData.commonTitles.length > 0 && (
              <div style={{
                background: "var(--bg-subtle)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "14px 16px",
              }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 10 }}>
                  Title Patterns
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {insights.youtubeData.commonTitles.slice(0, 3).map((t, i) => (
                    <div key={i} style={{
                      fontSize: 12, color: "var(--text-2)", lineHeight: 1.5,
                      paddingLeft: 10,
                      borderLeft: "2px solid rgba(20,184,166,0.3)",
                    }}>
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 4. PLATFORM ANALYSIS ── */}
      {insights.platformAnalysis.length > 0 && (
        <div>
          <SectionHeader label="Platform Analysis" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
            {insights.platformAnalysis.map((p, i) => {
              const pc = p.potential === "high" ? "#34d399" : p.potential === "medium" ? "#f59e0b" : "#f87171";
              return (
                <div key={i} style={{
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border)",
                  borderTop: `2px solid ${pc}`,
                  borderRadius: 8,
                  padding: "14px 16px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{p.platform}</span>
                    <Badge label={p.potential} color={pc} />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 6 }}>
                    <span style={{ fontWeight: 600 }}>Avg: </span>
                    <span style={{ color: "var(--text)", fontWeight: 700 }}>{p.avgViewsForTopic}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.55, marginBottom: 8 }}>
                    {p.contentStyle}
                  </div>
                  <div style={{ fontSize: 11, color: "#14b8a6", lineHeight: 1.5, fontWeight: 500 }}>
                    {p.hashtagStrategy}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 5. TOP ANGLES ── */}
      {insights.topAngles.length > 0 && (
        <div>
          <SectionHeader label="Top Angles" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {insights.topAngles.map((a, i) => (
              <div key={i} style={{
                display: "grid",
                gridTemplateColumns: "28px 1fr auto",
                gap: 14,
                alignItems: "start",
                padding: "14px 16px",
                background: i === 0 ? "rgba(20,184,166,0.04)" : "var(--bg-subtle)",
                border: "1px solid var(--border)",
                borderLeft: i === 0 ? "2px solid #14b8a6" : "1px solid var(--border)",
                borderRadius: 8,
              }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: i === 0 ? "#14b8a6" : "var(--text-3)",
                  paddingTop: 2,
                }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 4, lineHeight: 1.4 }}>
                    {a.angle}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6 }}>
                    {a.why}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end", flexShrink: 0 }}>
                  <Badge label={`${a.estimatedReach} reach`} color={reachColor(a.estimatedReach)} />
                  <Badge label={a.difficulty} color={diffColor(a.difficulty)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 6. UNTAPPED ANGLES ── */}
      {insights.untappedAngles.length > 0 && (
        <div>
          <SectionHeader label="Untapped Angles" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
            {insights.untappedAngles.map((a, i) => (
              <div key={i} style={{
                background: "rgba(52,211,153,0.04)",
                border: "1px solid rgba(52,211,153,0.15)",
                borderRadius: 8,
                padding: "16px",
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#34d399", marginBottom: 8 }}>
                  Gap #{i + 1}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 10, lineHeight: 1.4 }}>
                  {a.angle}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 8 }}>
                  {a.opportunity}
                </div>
                <div style={{
                  fontSize: 11, color: "var(--text-3)", lineHeight: 1.5,
                  paddingTop: 8, borderTop: "1px solid rgba(52,211,153,0.1)",
                }}>
                  {a.whyNobodyIsDoing}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 7. COMPETITOR INSIGHTS ── */}
      {insights.competitorInsights.length > 0 && (
        <div>
          <SectionHeader label="Competitor Insights" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {insights.competitorInsights.map((c, i) => (
              <div key={i} style={{
                display: "grid",
                gridTemplateColumns: "1fr 32px 1fr",
                gap: 12,
                alignItems: "center",
              }}>
                <div style={{
                  padding: "12px 14px",
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 5 }}>
                    What they do
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>{c.observation}</p>
                </div>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "rgba(20,184,166,0.1)",
                  border: "1px solid rgba(20,184,166,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, color: "#14b8a6", fontWeight: 700,
                  flexShrink: 0,
                }}>
                  →
                </div>
                <div style={{
                  padding: "12px 14px",
                  background: "rgba(20,184,166,0.04)",
                  border: "1px solid rgba(20,184,166,0.15)",
                  borderRadius: 8,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#14b8a6", marginBottom: 5 }}>
                    Your gap
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text)", fontWeight: 500, lineHeight: 1.6, margin: 0 }}>{c.gap}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 8. RISKS + RECOMMENDATIONS side by side ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Risks */}
        {insights.risks.length > 0 && (
          <div>
            <SectionHeader label="Risks" />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {insights.risks.map((r, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "10px 12px",
                  background: "rgba(248,113,113,0.04)",
                  border: "1px solid rgba(248,113,113,0.12)",
                  borderRadius: 6,
                }}>
                  <span style={{ color: "#f87171", fontSize: 10, fontWeight: 700, flexShrink: 0, paddingTop: 2 }}>!</span>
                  <span style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6 }}>{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {insights.recommendations.length > 0 && (
          <div>
            <SectionHeader label="Action Plan" />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {insights.recommendations.map((rec, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "10px 12px",
                  background: "rgba(20,184,166,0.04)",
                  border: "1px solid rgba(20,184,166,0.12)",
                  borderRadius: 6,
                  transition: "border-color 0.15s ease",
                  cursor: "default",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(20,184,166,0.3)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(20,184,166,0.12)"; }}
                >
                  <span style={{
                    fontSize: 9, fontWeight: 800, color: "#14b8a6",
                    background: "rgba(20,184,166,0.12)",
                    width: 16, height: 16, borderRadius: 3,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginTop: 1,
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6 }}>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 9. KEY INSIGHT ── */}
      <div style={{
        padding: "18px 20px",
        borderRadius: 8,
        background: "var(--bg-subtle)",
        border: "1px solid var(--border)",
        borderLeft: "3px solid #14b8a6",
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#14b8a6", marginBottom: 8 }}>
          Key Insight
        </div>
        <p style={{ fontSize: 14, color: "var(--text)", fontWeight: 500, lineHeight: 1.75, margin: 0, letterSpacing: "-0.01em" }}>
          {insights.keyInsight}
        </p>
      </div>

    </div>
  );
}
