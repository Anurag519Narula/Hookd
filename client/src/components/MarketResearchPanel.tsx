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

// ── Circular Progress Component ──────────────────────────────────────────────
function CircularProgress({ score, size = 100, strokeWidth = 8 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const color = scoreColor(score);

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
        />
      </svg>
      {/* Score text */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        textAlign: "center",
      }}>
        <div style={{ fontSize: size * 0.28, fontWeight: 800, color, letterSpacing: "-0.03em" }}>
          {score}
        </div>
        <div style={{ fontSize: size * 0.12, color: "var(--text-3)", fontWeight: 600 }}>
          /100
        </div>
      </div>
    </div>
  );
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

      {/* 2. Score row with circular progress */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        {/* Opportunity Score */}
        <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 16 }}>
            Opportunity
          </div>
          <CircularProgress score={insights.opportunityScore} size={110} strokeWidth={10} />
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 12, textAlign: "center", lineHeight: 1.5 }}>
            {insights.opportunityScore >= 75 ? "Excellent potential" : insights.opportunityScore >= 50 ? "Good potential" : insights.opportunityScore >= 30 ? "Moderate potential" : "Low potential"}
          </div>
        </Card>

        {/* Trend Score */}
        <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 16 }}>
            Trend
          </div>
          <div style={{ position: "relative" }}>
            <CircularProgress score={insights.trendScore} size={110} strokeWidth={10} />
            <div style={{
              position: "absolute",
              top: -8,
              right: -8,
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: insights.trendDirection === "rising" ? "#4ade80" : insights.trendDirection === "declining" ? "#f87171" : "var(--text-3)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 700,
              border: "3px solid var(--bg-card)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}>
              {trendIcon(insights.trendDirection)}
            </div>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 12, textAlign: "center", fontWeight: 600 }}>
            {insights.trendVelocity}
          </div>
        </Card>

        {/* Audience Fit */}
        <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 16 }}>
            Audience Fit
          </div>
          <CircularProgress score={insights.audienceFit.score} size={110} strokeWidth={10} />
          <div style={{ fontSize: 11, color: "var(--text-2)", marginTop: 12, textAlign: "center", lineHeight: 1.4, fontWeight: 500 }}>
            {insights.audienceFit.primaryAudience}
          </div>
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

      {/* 4. YouTube Data - Enhanced */}
      {insights.youtubeData && (
        <div>
          <SectionTitle>▶️ YouTube Data</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
            {/* Stats grid */}
            <Card>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{
                  padding: "16px",
                  background: "linear-gradient(135deg, rgba(255,0,0,0.08), rgba(255,0,0,0.02))",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid rgba(255,0,0,0.15)",
                }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#ff0000", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                    🔥 Top Video
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.03em" }}>
                    {formatViews(insights.youtubeData.topVideoViews)}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 500 }}>views</div>
                </div>
                <div style={{
                  padding: "16px",
                  background: "var(--bg-subtle)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                    📊 Avg Top 5
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.03em" }}>
                    {formatViews(insights.youtubeData.avgTopVideoViews)}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 500 }}>views</div>
                </div>
                <div style={{
                  padding: "16px",
                  background: "var(--bg-subtle)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                    📹 Videos Found
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.03em" }}>
                    {insights.youtubeData.totalVideosFound.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 500 }}>videos</div>
                </div>
                <div style={{
                  padding: "16px",
                  background: "var(--bg-subtle)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                    📈 Views Range
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginTop: 8 }}>
                    {insights.youtubeData.viewsRange}
                  </div>
                </div>
              </div>
            </Card>

            {/* Top channels */}
            {insights.youtubeData.topChannels.length > 0 && (
              <Card>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Top Channels
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {insights.youtubeData.topChannels.slice(0, 5).map((ch, i) => (
                    <div key={ch} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 10px",
                      background: i === 0 ? "rgba(20,184,166,0.08)" : "var(--bg-subtle)",
                      borderRadius: "var(--radius-sm)",
                      border: `1px solid ${i === 0 ? "rgba(20,184,166,0.2)" : "var(--border)"}`,
                    }}>
                      <span style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: i === 0 ? "var(--accent)" : "var(--bg-hover)",
                        color: i === 0 ? "#fff" : "var(--text-3)",
                        fontSize: 10,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        {i + 1}
                      </span>
                      <span style={{
                        fontSize: 12,
                        fontWeight: i === 0 ? 600 : 500,
                        color: i === 0 ? "var(--accent-text)" : "var(--text-2)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {ch}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Title patterns */}
          {insights.youtubeData.commonTitles.length > 0 && (
            <Card style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                💡 Common Title Patterns
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {insights.youtubeData.commonTitles.map((t, i) => (
                  <div key={i} style={{
                    fontSize: 12,
                    color: "var(--text-2)",
                    padding: "8px 12px",
                    background: "var(--bg-subtle)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)",
                    borderLeft: "3px solid var(--accent)",
                    lineHeight: 1.5,
                  }}>
                    "{t}"
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* 5. Platform Analysis - Enhanced with visual indicators */}
      {insights.platformAnalysis.length > 0 && (
        <div>
          <SectionTitle>📱 Platform Analysis</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
            {insights.platformAnalysis.map((p, i) => {
              const potentialScore = p.potential === "high" ? 85 : p.potential === "medium" ? 60 : 35;
              return (
                <Card key={i} style={{
                  background: `linear-gradient(135deg, ${potentialColor(p.potential)}08 0%, var(--bg-card) 100%)`,
                  borderLeft: `3px solid ${potentialColor(p.potential)}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                      {p.platform}
                    </span>
                    <div style={{ position: "relative", width: 48, height: 48 }}>
                      <svg width="48" height="48" style={{ transform: "rotate(-90deg)" }}>
                        <circle cx="24" cy="24" r="20" fill="none" stroke="var(--border)" strokeWidth="4" />
                        <circle
                          cx="24" cy="24" r="20" fill="none"
                          stroke={potentialColor(p.potential)}
                          strokeWidth="4"
                          strokeDasharray={`${(potentialScore / 100) * 125.6} 125.6`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div style={{
                        position: "absolute", top: "50%", left: "50%",
                        transform: "translate(-50%, -50%)",
                        fontSize: 10, fontWeight: 800,
                        color: potentialColor(p.potential),
                      }}>
                        {p.potential === "high" ? "H" : p.potential === "medium" ? "M" : "L"}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: "var(--text-3)",
                    marginBottom: 8,
                    padding: "6px 10px",
                    background: "var(--bg-subtle)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)",
                  }}>
                    <span style={{ fontWeight: 600 }}>📊 Avg views: </span>
                    <span style={{ color: "var(--text)", fontWeight: 700 }}>{p.avgViewsForTopic}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 10, lineHeight: 1.6 }}>
                    {p.contentStyle}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: "var(--accent)",
                    padding: "8px 10px",
                    background: "rgba(20,184,166,0.06)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid rgba(20,184,166,0.15)",
                    lineHeight: 1.5,
                    fontWeight: 500,
                  }}>
                    # {p.hashtagStrategy}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. Top Angles - Enhanced with visual metrics */}
      {insights.topAngles.length > 0 && (
        <div>
          <SectionTitle>🎯 Top Angles</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {insights.topAngles.map((a, i) => {
              const reachScore = a.estimatedReach === "high" ? 90 : a.estimatedReach === "medium" ? 60 : 30;
              const difficultyScore = a.difficulty === "easy" ? 90 : a.difficulty === "medium" ? 60 : 30;
              return (
                <Card key={i} style={{
                  background: i === 0 ? "linear-gradient(135deg, rgba(20,184,166,0.05) 0%, var(--bg-card) 100%)" : "var(--bg-card)",
                  borderLeft: i === 0 ? "3px solid var(--accent)" : "1px solid var(--border)",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                    {/* Rank badge */}
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: i === 0 ? "var(--accent)" : "var(--bg-subtle)",
                      color: i === 0 ? "#fff" : "var(--text-3)",
                      fontSize: 16,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      border: i === 0 ? "none" : "1px solid var(--border)",
                    }}>
                      {i + 1}
                    </div>
                    
                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 8, lineHeight: 1.4 }}>
                        {a.angle}
                      </div>
                      <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 12 }}>
                        {a.why}
                      </p>
                      
                      {/* Metrics bars */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                              Reach Potential
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: reachColor(a.estimatedReach) }}>
                              {a.estimatedReach}
                            </span>
                          </div>
                          <div style={{
                            height: 6,
                            borderRadius: 99,
                            background: "var(--border)",
                            overflow: "hidden",
                          }}>
                            <div style={{
                              height: "100%",
                              width: `${reachScore}%`,
                              background: `linear-gradient(90deg, ${reachColor(a.estimatedReach)}, ${reachColor(a.estimatedReach)}dd)`,
                              borderRadius: 99,
                              transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
                            }} />
                          </div>
                        </div>
                        
                        <div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                              Difficulty
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: difficultyColor(a.difficulty) }}>
                              {a.difficulty}
                            </span>
                          </div>
                          <div style={{
                            height: 6,
                            borderRadius: 99,
                            background: "var(--border)",
                            overflow: "hidden",
                          }}>
                            <div style={{
                              height: "100%",
                              width: `${difficultyScore}%`,
                              background: `linear-gradient(90deg, ${difficultyColor(a.difficulty)}, ${difficultyColor(a.difficulty)}dd)`,
                              borderRadius: 99,
                              transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
                            }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* 8. Untapped Angles - Enhanced with opportunity indicators */}
      {insights.untappedAngles.length > 0 && (
        <div>
          <SectionTitle>💎 Untapped Angles</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
            {insights.untappedAngles.map((a, i) => (
              <Card key={i} style={{
                background: "linear-gradient(135deg, rgba(74,222,128,0.05) 0%, var(--bg-card) 100%)",
                borderLeft: "3px solid #4ade80",
                position: "relative",
                overflow: "hidden",
              }}>
                {/* Sparkle decoration */}
                <div style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  fontSize: 24,
                  opacity: 0.15,
                }}>
                  ✨
                </div>
                
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "3px 10px",
                    borderRadius: 99,
                    fontSize: 10,
                    fontWeight: 700,
                    background: "rgba(74,222,128,0.15)",
                    color: "#4ade80",
                    border: "1px solid rgba(74,222,128,0.3)",
                    marginBottom: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}>
                    <span>💡</span> Opportunity #{i + 1}
                  </div>
                  
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 10, lineHeight: 1.4 }}>
                    {a.angle}
                  </div>
                  
                  <div style={{
                    padding: "10px 12px",
                    background: "rgba(74,222,128,0.08)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid rgba(74,222,128,0.2)",
                    marginBottom: 8,
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#4ade80", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Why it's valuable
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>
                      {a.opportunity}
                    </p>
                  </div>
                  
                  <div style={{
                    padding: "10px 12px",
                    background: "var(--bg-subtle)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)",
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Why it's open
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>
                      {a.whyNobodyIsDoing}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 9. Competitor Insights - Enhanced with side-by-side comparison */}
      {insights.competitorInsights.length > 0 && (
        <div>
          <SectionTitle>🔍 Competitor Insights</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {insights.competitorInsights.map((c, i) => (
              <Card key={i} style={{ background: "var(--bg-subtle)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 16, alignItems: "center" }}>
                  {/* What they do */}
                  <div style={{
                    padding: "12px 14px",
                    background: "var(--bg-card)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)",
                  }}>
                    <div style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "var(--text-3)",
                      marginBottom: 6,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}>
                      <span>👥</span> What they do
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>
                      {c.observation}
                    </p>
                  </div>
                  
                  {/* Arrow separator */}
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}>
                    →
                  </div>
                  
                  {/* The gap */}
                  <div style={{
                    padding: "12px 14px",
                    background: "rgba(20,184,166,0.08)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid rgba(20,184,166,0.2)",
                  }}>
                    <div style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "var(--accent)",
                      marginBottom: 6,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}>
                      <span>💡</span> Your opportunity
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text)", fontWeight: 500, lineHeight: 1.6, margin: 0 }}>
                      {c.gap}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 10. Risks - Enhanced with severity indicators */}
      {insights.risks.length > 0 && (
        <div>
          <SectionTitle>⚠️ Risks to Consider</SectionTitle>
          <Card style={{ background: "linear-gradient(135deg, rgba(248,113,113,0.04) 0%, var(--bg-card) 100%)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
              {insights.risks.map((r, i) => (
                <div key={i} style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "12px 14px",
                  background: "rgba(248,113,113,0.06)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid rgba(248,113,113,0.2)",
                }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "#f87171",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    !
                  </div>
                  <span style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, flex: 1 }}>{r}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* 11. Recommendations - Enhanced with action checklist style */}
      {insights.recommendations.length > 0 && (
        <div>
          <SectionTitle>✅ Action Plan</SectionTitle>
          <Card style={{ background: "linear-gradient(135deg, rgba(20,184,166,0.04) 0%, var(--bg-card) 100%)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {insights.recommendations.map((rec, i) => (
                <div key={i} style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "14px 16px",
                  background: "var(--bg-card)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)",
                  transition: "all 0.2s ease",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(20,184,166,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                >
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: "0 2px 8px rgba(20,184,166,0.3)",
                  }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500, lineHeight: 1.7, flex: 1 }}>{rec}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* 12. Key Insight - Enhanced with prominent styling */}
      <div style={{
        padding: "20px 24px",
        borderRadius: "var(--radius-lg)",
        background: "linear-gradient(135deg, rgba(20,184,166,0.08) 0%, rgba(99,102,241,0.08) 100%)",
        border: "2px solid var(--accent)",
        boxShadow: "0 4px 20px rgba(20,184,166,0.15)",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative background */}
        <div style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          background: "radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 12,
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--accent)",
              color: "#fff",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 12px rgba(20,184,166,0.4)",
            }}>
              💡
            </div>
            <span style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--accent)",
            }}>
              Key Insight
            </span>
          </div>
          <p style={{
            fontSize: 15,
            color: "var(--text)",
            fontWeight: 600,
            lineHeight: 1.75,
            margin: 0,
            letterSpacing: "-0.01em",
          }}>
            {insights.keyInsight}
          </p>
        </div>
      </div>

    </div>
  );
}
