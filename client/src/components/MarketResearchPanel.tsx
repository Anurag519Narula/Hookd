import { InsightReport } from "../types/insights";

interface MarketResearchPanelProps {
  topic: string;
  isOpen: boolean;
  onToggle: () => void;
  insights: InsightReport | null;
  isLoading: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatViews(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toLocaleString();
}

function scoreColor(score: number): string {
  if (score >= 75) return "#4ade80";
  if (score >= 50) return "#14b8a6";
  if (score >= 30) return "#fbbf24";
  return "#f87171";
}

function verdictColor(label: InsightReport["verdictLabel"]): string {
  switch (label) {
    case "Strong opportunity": return "#4ade80";
    case "Good opportunity": return "#14b8a6";
    case "Proceed with caution": return "#fbbf24";
    case "Avoid for now": return "#f87171";
  }
}

function verdictBg(label: InsightReport["verdictLabel"]): string {
  switch (label) {
    case "Strong opportunity": return "rgba(74,222,128,0.1)";
    case "Good opportunity": return "rgba(20,184,166,0.1)";
    case "Proceed with caution": return "rgba(251,191,36,0.1)";
    case "Avoid for now": return "rgba(248,113,113,0.1)";
  }
}

function trendIcon(dir: InsightReport["trendDirection"]): string {
  switch (dir) {
    case "rising": return "↑";
    case "declining": return "↓";
    case "stable": return "→";
    case "peaked": return "~";
  }
}

function reachColor(r: "low" | "medium" | "high"): string {
  return r === "high" ? "#4ade80" : r === "medium" ? "#fbbf24" : "#f87171";
}

function difficultyColor(d: "easy" | "medium" | "hard"): string {
  return d === "easy" ? "#4ade80" : d === "medium" ? "#fbbf24" : "#f87171";
}

function potentialColor(p: "low" | "medium" | "high"): string {
  return p === "high" ? "#4ade80" : p === "medium" ? "#fbbf24" : "#f87171";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Chip({ label, color, bg }: { label: string; color?: string; bg?: string }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "3px 10px",
      borderRadius: 99,
      fontSize: 11,
      fontWeight: 600,
      background: bg ?? "var(--bg-subtle)",
      color: color ?? "var(--text-2)",
      border: "1px solid var(--border)",
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "var(--text-3)",
      marginBottom: 12,
    }}>
      {children}
    </h3>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-md)",
      padding: "16px",
      boxShadow: "var(--shadow-sm)",
      ...style,
    }}>
      {children}
    </div>
  );
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div style={{
      height: 4,
      borderRadius: 99,
      background: "var(--border)",
      overflow: "hidden",
      marginTop: 6,
    }}>
      <div style={{
        height: "100%",
        width: `${Math.min(100, Math.max(0, score))}%`,
        background: color,
        borderRadius: 99,
        transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
      }} />
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  const line = (w: string, h = 14, mb = 8) => (
    <div className="shimmer-line" style={{ width: w, height: h, marginBottom: mb, borderRadius: 6 }} />
  );
  return (
    <div style={{ padding: "20px 0", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Verdict banner skeleton */}
      <div className="shimmer-line" style={{ height: 72, borderRadius: "var(--radius-md)" }} />
      {/* Score row skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {[0, 1, 2].map(i => (
          <div key={i} className="shimmer-line" style={{ height: 80, borderRadius: "var(--radius-md)" }} />
        ))}
      </div>
      {/* Summary skeleton */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {line("100%")}
        {line("90%")}
        {line("70%")}
      </div>
      {/* Blueprint skeleton */}
      <div className="shimmer-line" style={{ height: 200, borderRadius: "var(--radius-md)" }} />
      {/* Platform skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[0, 1].map(i => (
          <div key={i} className="shimmer-line" style={{ height: 120, borderRadius: "var(--radius-md)" }} />
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

  // ── Toggle header ──────────────────────────────────────────────────────────
  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)",
      boxShadow: "var(--shadow-sm)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--text)",
          textAlign: "left",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 18 }}>🔬</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
              Idea Validation Report
            </div>
            {topic && (
              <div style={{
                fontSize: 12,
                color: "var(--text-3)",
                marginTop: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {topic}
              </div>
            )}
          </div>
          {isLoading && (
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "2px 10px",
              borderRadius: 99,
              fontSize: 11,
              fontWeight: 600,
              background: "rgba(20,184,166,0.12)",
              color: "var(--accent)",
              border: "1px solid rgba(20,184,166,0.25)",
              flexShrink: 0,
            }}>
              <span style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--accent)",
                display: "inline-block",
                animation: "pulse-glow 1.4s ease-in-out infinite",
              }} />
              Analyzing
            </span>
          )}
          {!isLoading && hasData && !isOpen && (
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "2px 10px",
              borderRadius: 99,
              fontSize: 11,
              fontWeight: 700,
              background: verdictBg(insights.verdictLabel),
              color: verdictColor(insights.verdictLabel),
              border: `1px solid ${verdictColor(insights.verdictLabel)}33`,
              flexShrink: 0,
            }}>
              {insights.verdictLabel}
            </span>
          )}
        </div>
        <span style={{
          fontSize: 16,
          color: "var(--text-3)",
          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.2s ease",
          flexShrink: 0,
        }}>
          ⌄
        </span>
      </button>

      {/* Collapsible body */}
      {isOpen && (
        <div style={{ padding: "0 20px 24px" }}>
          {isLoading && <LoadingSkeleton />}

          {!isLoading && !insights && (
            <div style={{
              textAlign: "center",
              padding: "40px 20px",
              color: "var(--text-3)",
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-2)", marginBottom: 6 }}>
                No report yet
              </div>
              <div style={{ fontSize: 13 }}>
                Generate insights to see your idea validation report here.
              </div>
            </div>
          )}

          {hasData && <ReportBody insights={insights} />}
        </div>
      )}
    </div>
  );
}

// ── Report body (all sections) ────────────────────────────────────────────────

function ReportBody({ insights }: { insights: InsightReport }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* 1. Verdict banner */}
      <div style={{
        borderRadius: "var(--radius-md)",
        padding: "16px 20px",
        background: verdictBg(insights.verdictLabel),
        border: `1px solid ${verdictColor(insights.verdictLabel)}33`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{
            fontSize: 18,
            fontWeight: 800,
            color: verdictColor(insights.verdictLabel),
            letterSpacing: "-0.02em",
          }}>
            {insights.verdictLabel === "Strong opportunity" && "🚀"}
            {insights.verdictLabel === "Good opportunity" && "✅"}
            {insights.verdictLabel === "Proceed with caution" && "⚠️"}
            {insights.verdictLabel === "Avoid for now" && "🚫"}
          </span>
          <span style={{
            fontSize: 16,
            fontWeight: 700,
            color: verdictColor(insights.verdictLabel),
          }}>
            {insights.verdictLabel}
          </span>
          {insights.saturationWarning && (
            <span style={{
              marginLeft: "auto",
              padding: "2px 8px",
              borderRadius: 99,
              fontSize: 10,
              fontWeight: 700,
              background: "rgba(248,113,113,0.15)",
              color: "#f87171",
              border: "1px solid rgba(248,113,113,0.3)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}>
              Saturated
            </span>
          )}
        </div>
        <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>
          {insights.verdictReason}
        </p>
      </div>

      {/* 2. Score row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {/* Opportunity Score */}
        <Card>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
            Opportunity
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: scoreColor(insights.opportunityScore), letterSpacing: "-0.03em" }}>
            {insights.opportunityScore}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 4 }}>/100</div>
          <ScoreBar score={insights.opportunityScore} color={scoreColor(insights.opportunityScore)} />
        </Card>

        {/* Trend Score */}
        <Card>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
            Trend
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: scoreColor(insights.trendScore), letterSpacing: "-0.03em" }}>
              {insights.trendScore}
            </span>
            <span style={{
              fontSize: 16,
              fontWeight: 700,
              color: insights.trendDirection === "rising" ? "#4ade80"
                : insights.trendDirection === "declining" ? "#f87171"
                : "var(--text-3)",
            }}>
              {trendIcon(insights.trendDirection)}
            </span>
          </div>
          <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 4 }}>
            {insights.trendVelocity}
          </div>
          <ScoreBar score={insights.trendScore} color={scoreColor(insights.trendScore)} />
        </Card>

        {/* Audience Fit */}
        <Card>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
            Audience Fit
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: scoreColor(insights.audienceFit.score), letterSpacing: "-0.03em" }}>
            {insights.audienceFit.score}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 4 }}>/100</div>
          <ScoreBar score={insights.audienceFit.score} color={scoreColor(insights.audienceFit.score)} />
        </Card>
      </div>

      {/* 3. Summary */}
      <Card style={{ background: "var(--bg-subtle)" }}>
        <SectionTitle>📋 Summary</SectionTitle>
        <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.7 }}>
          {insights.summary}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          <Chip label={`🎯 ${insights.audienceFit.primaryAudience}`} />
          <Chip label={`💡 ${insights.audienceFit.audienceIntent}`} />
          <Chip label={`📊 ${insights.competitionLevel} competition`} color={
            insights.competitionLevel === "low" ? "#4ade80"
              : insights.competitionLevel === "medium" ? "#fbbf24"
              : "#f87171"
          } />
          {insights.audienceFit.bestDays.map(d => (
            <Chip key={d} label={d} />
          ))}
          {insights.audienceFit.bestPostingTimes.map(t => (
            <Chip key={t} label={`🕐 ${t}`} />
          ))}
        </div>
      </Card>

      {/* 4. YouTube Data */}
      {insights.youtubeData && (
        <div>
          <SectionTitle>▶️ YouTube Data</SectionTitle>
          <Card>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                  Top Video
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em" }}>
                  {formatViews(insights.youtubeData.topVideoViews)}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-3)" }}>views</div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                  Avg Top 5
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em" }}>
                  {formatViews(insights.youtubeData.avgTopVideoViews)}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-3)" }}>views</div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                  Videos Found
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em" }}>
                  {insights.youtubeData.totalVideosFound.toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                  Views Range
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                  {insights.youtubeData.viewsRange}
                </div>
              </div>
            </div>
            {insights.youtubeData.topChannels.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", marginBottom: 6 }}>
                  Top Channels
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {insights.youtubeData.topChannels.map(ch => (
                    <Chip key={ch} label={ch} color="var(--accent)" bg="rgba(20,184,166,0.08)" />
                  ))}
                </div>
              </div>
            )}
            {insights.youtubeData.commonTitles.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", marginBottom: 6 }}>
                  Title Patterns
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {insights.youtubeData.commonTitles.map((t, i) => (
                    <div key={i} style={{
                      fontSize: 12,
                      color: "var(--text-2)",
                      padding: "4px 10px",
                      background: "var(--bg-subtle)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border)",
                    }}>
                      "{t}"
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* 5. Content Blueprint */}
      <div>
        <SectionTitle>🎬 Content Blueprint</SectionTitle>
        <Card>
          {/* Opening hook */}
          <div style={{
            padding: "12px 14px",
            borderRadius: "var(--radius-sm)",
            background: "rgba(20,184,166,0.08)",
            border: "1px solid rgba(20,184,166,0.2)",
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 4 }}>
              ⚡ Opening Hook (first 3 seconds)
            </div>
            <p style={{ fontSize: 13, color: "var(--text)", fontWeight: 500, lineHeight: 1.6 }}>
              {insights.contentBlueprint.openingHook}
            </p>
          </div>

          {/* Core message */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
              Core Message
            </div>
            <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>
              {insights.contentBlueprint.coreMessage}
            </p>
          </div>

          {/* Key points */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 10 }}>
              Key Points
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {insights.contentBlueprint.keyPoints.map((kp, i) => (
                <div key={i} style={{
                  padding: "12px 14px",
                  background: "var(--bg-subtle)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: "var(--accent)",
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 800,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        {i + 1}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                        {kp.point}
                      </span>
                    </div>
                    <span style={{
                      padding: "1px 7px",
                      borderRadius: 99,
                      fontSize: 10,
                      fontWeight: 600,
                      background: "var(--bg-card)",
                      color: "var(--text-3)",
                      border: "1px solid var(--border)",
                      flexShrink: 0,
                    }}>
                      {kp.timestamp}
                    </span>
                  </div>
                  <div style={{ paddingLeft: 28 }}>
                    <p style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 4, lineHeight: 1.5 }}>
                      <span style={{ fontWeight: 600, color: "var(--text-3)" }}>Why: </span>
                      {kp.why}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--accent)", lineHeight: 1.5 }}>
                      <span style={{ fontWeight: 600 }}>💡 Tip: </span>
                      {kp.deliveryTip}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Closing CTA */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
              Closing CTA
            </div>
            <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>
              {insights.contentBlueprint.closingCTA}
            </p>
          </div>

          {/* Visual + Audio notes */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{
              padding: "10px 12px",
              background: "var(--bg-subtle)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 4 }}>
                🎥 Visual Notes
              </div>
              <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5 }}>
                {insights.contentBlueprint.visualNotes}
              </p>
            </div>
            <div style={{
              padding: "10px 12px",
              background: "var(--bg-subtle)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 4 }}>
                🎵 Audio Notes
              </div>
              <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5 }}>
                {insights.contentBlueprint.audioNotes}
              </p>
            </div>
          </div>

          {/* Duration target */}
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: "var(--text-3)" }}>⏱ Target duration:</span>
            <span style={{
              padding: "2px 10px",
              borderRadius: 99,
              fontSize: 11,
              fontWeight: 700,
              background: "rgba(20,184,166,0.1)",
              color: "var(--accent)",
              border: "1px solid rgba(20,184,166,0.2)",
            }}>
              {insights.contentBlueprint.durationTarget}
            </span>
          </div>
        </Card>
      </div>

      {/* 6. Platform Analysis */}
      {insights.platformAnalysis.length > 0 && (
        <div>
          <SectionTitle>📱 Platform Analysis</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {insights.platformAnalysis.map((p, i) => (
              <Card key={i}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                    {p.platform}
                  </span>
                  <span style={{
                    padding: "2px 8px",
                    borderRadius: 99,
                    fontSize: 10,
                    fontWeight: 700,
                    background: `${potentialColor(p.potential)}18`,
                    color: potentialColor(p.potential),
                    border: `1px solid ${potentialColor(p.potential)}33`,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}>
                    {p.potential}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>Avg views: </span>
                  <span style={{ color: "var(--text-2)" }}>{p.avgViewsForTopic}</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-2)", marginBottom: 8, lineHeight: 1.5 }}>
                  {p.contentStyle}
                </div>
                <div style={{
                  fontSize: 11,
                  color: "var(--text-3)",
                  padding: "6px 8px",
                  background: "var(--bg-subtle)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)",
                  lineHeight: 1.5,
                }}>
                  # {p.hashtagStrategy}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 7. Top Angles */}
      {insights.topAngles.length > 0 && (
        <div>
          <SectionTitle>🎯 Top Angles</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {insights.topAngles.map((a, i) => (
              <Card key={i}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", flex: 1 }}>
                    {a.angle}
                  </span>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <span style={{
                      padding: "2px 8px",
                      borderRadius: 99,
                      fontSize: 10,
                      fontWeight: 700,
                      background: `${reachColor(a.estimatedReach)}18`,
                      color: reachColor(a.estimatedReach),
                      border: `1px solid ${reachColor(a.estimatedReach)}33`,
                    }}>
                      {a.estimatedReach} reach
                    </span>
                    <span style={{
                      padding: "2px 8px",
                      borderRadius: 99,
                      fontSize: 10,
                      fontWeight: 700,
                      background: `${difficultyColor(a.difficulty)}18`,
                      color: difficultyColor(a.difficulty),
                      border: `1px solid ${difficultyColor(a.difficulty)}33`,
                    }}>
                      {a.difficulty}
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6 }}>
                  {a.why}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 8. Untapped Angles */}
      {insights.untappedAngles.length > 0 && (
        <div>
          <SectionTitle>💎 Untapped Angles</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {insights.untappedAngles.map((a, i) => (
              <Card key={i} style={{ borderLeft: "3px solid #4ade80" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
                  {a.angle}
                </div>
                <p style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 6, lineHeight: 1.6 }}>
                  <span style={{ fontWeight: 600, color: "#4ade80" }}>Opportunity: </span>
                  {a.opportunity}
                </p>
                <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 600 }}>Why it's open: </span>
                  {a.whyNobodyIsDoing}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 9. Competitor Insights */}
      {insights.competitorInsights.length > 0 && (
        <div>
          <SectionTitle>🔍 Competitor Insights</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {insights.competitorInsights.map((c, i) => (
              <Card key={i}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 4 }}>
                      What they do
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5 }}>
                      {c.observation}
                    </p>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 4 }}>
                      The gap
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5 }}>
                      {c.gap}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 10. Risks */}
      {insights.risks.length > 0 && (
        <div>
          <SectionTitle>⚠️ Risks</SectionTitle>
          <Card>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {insights.risks.map((r, i) => (
                <div key={i} style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "8px 10px",
                  background: "rgba(248,113,113,0.06)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid rgba(248,113,113,0.15)",
                }}>
                  <span style={{ color: "#f87171", fontSize: 12, flexShrink: 0, marginTop: 1 }}>●</span>
                  <span style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>{r}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* 11. Recommendations */}
      {insights.recommendations.length > 0 && (
        <div>
          <SectionTitle>✅ Recommendations</SectionTitle>
          <Card>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {insights.recommendations.map((rec, i) => (
                <div key={i} style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "8px 10px",
                  background: "rgba(20,184,166,0.06)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid rgba(20,184,166,0.15)",
                }}>
                  <span style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 800,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 1,
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>{rec}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* 12. Key Insight */}
      <div style={{
        padding: "16px 20px",
        borderRadius: "var(--radius-md)",
        background: "rgba(20,184,166,0.06)",
        border: "1px solid rgba(20,184,166,0.2)",
        borderLeft: "4px solid var(--accent)",
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 8 }}>
          💡 Key Insight
        </div>
        <p style={{ fontSize: 14, color: "var(--text)", fontWeight: 500, lineHeight: 1.7 }}>
          {insights.keyInsight}
        </p>
      </div>

    </div>
  );
}
