import React from "react";
import { InsightReport } from "../types/insights";

interface MarketResearchPanelProps {
  topic: string;
  isOpen: boolean;
  onToggle: () => void;
  insights: InsightReport | null;
  isLoading: boolean;
}

function ShimmerBlock({ width, height }: { width: string; height: number }) {
  return (
    <div
      className="shimmer-line"
      style={{ width, height, borderRadius: 6, flexShrink: 0 }}
    />
  );
}

const TREND_CONFIG: Record<
  InsightReport["trendDirection"],
  { label: string; color: string; bg: string; icon: string }
> = {
  rising:   { label: "Rising",   color: "#4ade80", bg: "rgba(74, 222, 128, 0.1)",  icon: "↑" },
  peaked:   { label: "Peaked",   color: "#fbbf24", bg: "rgba(251, 191, 36, 0.1)",  icon: "→" },
  declining:{ label: "Declining",color: "#f87171", bg: "rgba(248, 113, 113, 0.1)", icon: "↓" },
  stable:   { label: "Stable",   color: "#818cf8", bg: "rgba(129, 140, 248, 0.1)", icon: "~" },
};

const COMPETITION_CONFIG: Record<
  InsightReport["competitionLevel"],
  { label: string; color: string; bg: string }
> = {
  low:    { label: "Low",    color: "#4ade80", bg: "rgba(74, 222, 128, 0.1)" },
  medium: { label: "Medium", color: "#fbbf24", bg: "rgba(251, 191, 36, 0.1)" },
  high:   { label: "High",   color: "#f87171", bg: "rgba(248, 113, 113, 0.1)" },
};

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transform: open ? "rotate(180deg)" : "rotate(0deg)",
      transition: "transform 0.2s ease",
    }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const InsightsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

function LoadingSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "16px 20px" }}>
      {/* Trend + competition row */}
      <div style={{ display: "flex", gap: 10 }}>
        <ShimmerBlock width="120px" height={28} />
        <ShimmerBlock width="100px" height={28} />
      </div>
      {/* Summary */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <ShimmerBlock width="100%" height={14} />
        <ShimmerBlock width="85%" height={14} />
        <ShimmerBlock width="70%" height={14} />
      </div>
      {/* Angles */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <ShimmerBlock width="140px" height={12} />
        <ShimmerBlock width="95%" height={14} />
        <ShimmerBlock width="90%" height={14} />
        <ShimmerBlock width="80%" height={14} />
      </div>
    </div>
  );
}

export function MarketResearchPanel({
  topic,
  isOpen,
  onToggle,
  insights,
  isLoading,
}: MarketResearchPanelProps) {
  const trendCfg = insights ? TREND_CONFIG[insights.trendDirection] : null;
  const compCfg = insights ? COMPETITION_CONFIG[insights.competitionLevel] : null;

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden",
        transition: "box-shadow var(--transition)",
      }}
    >
      {/* Toggle header */}
      <button
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "14px 20px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          transition: "background var(--transition)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "none";
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "var(--accent-text)" }}>
            <InsightsIcon />
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text)",
            }}
          >
            Market Insights
          </span>
          {topic && (
            <span
              style={{
                fontSize: 12,
                color: "var(--text-3)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 200,
              }}
            >
              — {topic}
            </span>
          )}
          {isLoading && (
            <span
              style={{
                fontSize: 11,
                color: "var(--accent-text)",
                background: "var(--accent-subtle)",
                border: "1px solid rgba(20, 184, 166, 0.2)",
                borderRadius: 99,
                padding: "2px 8px",
              }}
            >
              Fetching…
            </span>
          )}
        </div>
        <span style={{ color: "var(--text-3)", flexShrink: 0 }}>
          <ChevronIcon open={isOpen} />
        </span>
      </button>

      {/* Collapsible content */}
      {isOpen && (
        <div
          style={{
            borderTop: "1px solid var(--border)",
          }}
        >
          {isLoading ? (
            <LoadingSkeleton />
          ) : insights ? (
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Trend direction + competition level badges */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {trendCfg && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "4px 12px",
                      borderRadius: 99,
                      background: trendCfg.bg,
                      color: trendCfg.color,
                      border: `1px solid ${trendCfg.color}33`,
                    }}
                  >
                    <span style={{ fontSize: 14 }}>{trendCfg.icon}</span>
                    {trendCfg.label} trend
                  </span>
                )}
                {compCfg && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "4px 12px",
                      borderRadius: 99,
                      background: compCfg.bg,
                      color: compCfg.color,
                      border: `1px solid ${compCfg.color}33`,
                    }}
                  >
                    {compCfg.label} competition
                  </span>
                )}
                {insights.trendScore !== undefined && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      fontSize: 12,
                      fontWeight: 500,
                      padding: "4px 12px",
                      borderRadius: 99,
                      background: "var(--bg-subtle)",
                      color: "var(--text-3)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    Score: {insights.trendScore}/100
                  </span>
                )}
              </div>

              {/* Summary */}
              {insights.summary && (
                <p
                  style={{
                    fontSize: 13,
                    lineHeight: 1.65,
                    color: "var(--text-2)",
                    margin: 0,
                  }}
                >
                  {insights.summary}
                </p>
              )}

              {/* Top content angles */}
              {insights.topAngles && insights.topAngles.length > 0 && (
                <div>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--text-3)",
                      marginBottom: 10,
                    }}
                  >
                    Top Content Angles
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {insights.topAngles.slice(0, 3).map((item, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "10px 12px",
                          background: "var(--bg-subtle)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-sm)",
                        }}
                      >
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: "var(--text)",
                            margin: "0 0 4px",
                          }}
                        >
                          {item.angle}
                        </p>
                        <p
                          style={{
                            fontSize: 12,
                            color: "var(--text-3)",
                            margin: 0,
                            lineHeight: 1.5,
                          }}
                        >
                          {item.why}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key insight callout */}
              {insights.keyInsight && (
                <div
                  style={{
                    padding: "10px 14px",
                    background: "var(--accent-subtle)",
                    border: "1px solid rgba(20, 184, 166, 0.2)",
                    borderRadius: "var(--radius-sm)",
                    borderLeft: "3px solid var(--accent)",
                  }}
                >
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--accent-text)",
                      margin: "0 0 4px",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Key Insight
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--text-2)",
                      margin: 0,
                      lineHeight: 1.6,
                    }}
                  >
                    {insights.keyInsight}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Empty state — no insights yet */
            <div
              style={{
                padding: "24px 20px",
                textAlign: "center",
                color: "var(--text-3)",
                fontSize: 13,
              }}
            >
              No insights loaded yet. Click "Get insights" to fetch YouTube trend data for this topic.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
