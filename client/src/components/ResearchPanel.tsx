import { motion } from "framer-motion";
import {
  ChartBar, Play, FilmStrip,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import type { TopVideo, InsightReport, PlatformScore } from "../types/insights";
import { SectionLabel, formatViews, SIGNAL_COLORS } from "./ui";

interface ComputedSignals {
  trend: { direction: string; velocity: string; score: number; explanation: string };
  competition: { level: string; totalVideos: number; uniqueChannels: number; explanation: string };
  momentum: { recentWinners: number; uploadFrequency: number; medianViewsPerDay: number };
  evidence: { topVideoViews: number; avgTopVideoViews: number; viewsRange: string; topChannels: string[]; recentVideoCount: number; olderVideoCount: number };
  googleTrends: { available: boolean; interest: number | null; avgInterest: number | null; peakInterest: number | null; direction: string | null; relatedQueries: string[]; risingQueries: string[] };
}

interface ResearchPanelProps {
  topVideos: TopVideo[];
  youtubeData: InsightReport["youtubeData"];
  platformAnalysis: InsightReport["platformAnalysis"];
  platformScores: PlatformScore[];
  report: InsightReport;
  signals?: ComputedSignals;
  sources: {
    youtubeCount: number;
    trendsAvailable: boolean;
    trendScore: number | null;
    relatedQueries: string[];
  };
}

export function ResearchPanel({ topVideos, youtubeData, signals }: ResearchPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 12, overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ChartBar size={15} weight="bold" color="var(--text-4)" />
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
            textTransform: "uppercase", color: "var(--text-4)",
            fontFamily: "var(--font-mono)",
          }}>Evidence & Data</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>
      </div>

      <div style={{ padding: "0 24px 24px" }}>

        {/* Computed signals row */}
        {signals && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: 1, background: "var(--border)", borderRadius: 10,
            overflow: "hidden", marginBottom: 20,
          }}>
            <SignalCell label="Trend" value={signals.trend.direction} color={SIGNAL_COLORS[signals.trend.direction]} />
            <SignalCell label="Momentum" value={signals.trend.velocity} color={SIGNAL_COLORS[signals.trend.velocity]} />
            <SignalCell label="Competition" value={signals.competition.level} color={SIGNAL_COLORS[signals.competition.level]} />
            <SignalCell
              label="Recent uploads"
              value={signals.evidence.recentVideoCount > 0 ? `${signals.evidence.recentVideoCount} in 6mo` : "None in 6mo"}
              color={signals.evidence.recentVideoCount > 0 ? "var(--text)" : "var(--text-4)"}
            />
            {signals.googleTrends.available && (
              <SignalCell
                label="Search interest"
                value={`${signals.googleTrends.interest}/100`}
                color={SIGNAL_COLORS[signals.googleTrends.direction ?? "unknown"]}
              />
            )}
          </div>
        )}

        {/* YouTube stats grid */}
        {youtubeData && (
          <div style={{ marginBottom: 20 }}>
            <SectionLabel>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Play size={12} weight="fill" /> YouTube Data
              </span>
            </SectionLabel>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
              gap: 1, background: "var(--border)", borderRadius: 10, overflow: "hidden",
            }}>
              {[
                { label: "Top Video", value: formatViews(youtubeData.topVideoViews), sub: "views", accent: true },
                { label: "Avg Top 5", value: formatViews(youtubeData.avgTopVideoViews), sub: "views", accent: false },
                { label: "Analyzed", value: youtubeData.totalVideosFound.toLocaleString(), sub: "videos", accent: false },
                { label: "Range", value: youtubeData.viewsRange, sub: "views", accent: false, small: true },
              ].map((stat, i) => (
                <div key={i} style={{
                  padding: "16px 18px",
                  background: stat.accent ? "rgba(5,150,105,0.04)" : "var(--bg-card)",
                }}>
                  <div style={{
                    fontSize: 10, fontWeight: 600, letterSpacing: "0.14em",
                    textTransform: "uppercase", color: "var(--text-4)",
                    marginBottom: 8, fontFamily: "var(--font-mono)",
                  }}>
                    {stat.label}
                  </div>
                  <div style={{
                    fontSize: (stat as any).small ? 14 : 22, fontWeight: 800,
                    color: stat.accent ? "var(--accent)" : "var(--text)",
                    letterSpacing: "-0.04em", lineHeight: 1.2,
                    fontFamily: "var(--font-sans)",
                  }}>
                    {stat.value}
                  </div>
                  <div style={{
                    fontSize: 11, color: "var(--text-4)", marginTop: 3,
                    fontFamily: "var(--font-mono)", letterSpacing: "0.04em",
                  }}>{stat.sub}</div>
                </div>
              ))}
            </div>

            {/* Channels + title patterns */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
              {youtubeData.topChannels.length > 0 && (
                <div style={{
                  background: "var(--bg-subtle)", border: "1px solid var(--border)",
                  borderRadius: 10, padding: "16px 18px",
                }}>
                  <div style={{
                    fontSize: 10, fontWeight: 600, letterSpacing: "0.14em",
                    textTransform: "uppercase", color: "var(--text-4)",
                    marginBottom: 12, fontFamily: "var(--font-mono)",
                  }}>
                    Top Channels
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {youtubeData.topChannels.slice(0, 4).map((ch, i) => (
                      <div key={ch} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{
                          width: 18, height: 18, borderRadius: 5,
                          background: i === 0 ? "rgba(5,150,105,0.1)" : "var(--bg-hover)",
                          color: i === 0 ? "var(--accent)" : "var(--text-4)",
                          fontSize: 10, fontWeight: 700, fontFamily: "var(--font-mono)",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>{i + 1}</span>
                        <span style={{
                          fontSize: 14, color: i === 0 ? "var(--text)" : "var(--text-2)",
                          fontWeight: i === 0 ? 600 : 400,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          letterSpacing: "-0.005em",
                        }}>{ch}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {youtubeData.commonTitles?.length > 0 && (
                <div style={{
                  background: "var(--bg-subtle)", border: "1px solid var(--border)",
                  borderRadius: 10, padding: "16px 18px",
                }}>
                  <div style={{
                    fontSize: 10, fontWeight: 600, letterSpacing: "0.14em",
                    textTransform: "uppercase", color: "var(--text-4)",
                    marginBottom: 12, fontFamily: "var(--font-mono)",
                  }}>
                    Title Patterns
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {youtubeData.commonTitles.slice(0, 3).map((t, i) => (
                      <div key={i} style={{
                        fontSize: 14, color: "var(--text-2)", lineHeight: 1.55,
                        paddingLeft: 12, borderLeft: "2px solid rgba(5,150,105,0.2)",
                        letterSpacing: "-0.005em",
                      }}>{t}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Top videos as tiles */}
        {topVideos.length > 0 && (
          <div>
            <SectionLabel>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <FilmStrip size={12} weight="bold" /> Top Performing Videos
              </span>
            </SectionLabel>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 12,
            }}>
              {topVideos.slice(0, 5).map((v, i) => (
                <a
                  key={i}
                  href={`https://www.youtube.com/watch?v=${v.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", flexDirection: "column",
                    padding: "16px 18px", borderRadius: 10,
                    background: i === 0 ? "rgba(5,150,105,0.03)" : "var(--bg-subtle)",
                    border: i === 0 ? "1px solid rgba(5,150,105,0.15)" : "1px solid var(--border)",
                    textDecoration: "none",
                    transition: "border-color 0.2s ease, background 0.2s ease, transform 0.2s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(5,150,105,0.3)";
                    e.currentTarget.style.background = "rgba(5,150,105,0.04)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = i === 0 ? "rgba(5,150,105,0.15)" : "var(--border)";
                    e.currentTarget.style.background = i === 0 ? "rgba(5,150,105,0.03)" : "var(--bg-subtle)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{
                    fontSize: 22, fontWeight: 800,
                    color: i === 0 ? "var(--accent)" : "var(--text)",
                    letterSpacing: "-0.04em", lineHeight: 1.2, marginBottom: 4,
                    fontFamily: "var(--font-sans)",
                  }}>
                    {formatViews(v.viewCount)}
                  </div>
                  <div style={{
                    fontSize: 11, color: "var(--text-4)", marginBottom: 12,
                    fontFamily: "var(--font-mono)", letterSpacing: "0.04em",
                  }}>views</div>

                  <div style={{
                    fontSize: 14, fontWeight: 500, color: "var(--text)", lineHeight: 1.45,
                    marginBottom: 10, flex: 1, letterSpacing: "-0.005em",
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any,
                    overflow: "hidden",
                  }}>
                    {v.title}
                  </div>

                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    paddingTop: 10, borderTop: "1px solid var(--border)",
                  }}>
                    <span style={{
                      fontSize: 13, color: "var(--text-3)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {v.channelName}
                    </span>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      fontSize: 13, color: "var(--accent)", fontWeight: 600,
                      flexShrink: 0, marginLeft: 8,
                    }}>
                      Watch <ArrowSquareOut size={13} weight="bold" />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SignalCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ padding: "16px 18px", background: "var(--bg-card)", textAlign: "center" }}>
      <div style={{
        fontSize: 10, fontWeight: 600, letterSpacing: "0.14em",
        textTransform: "uppercase", color: "var(--text-4)",
        marginBottom: 8, fontFamily: "var(--font-mono)",
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 15, fontWeight: 700, color, textTransform: "capitalize",
        fontFamily: "var(--font-sans)", letterSpacing: "-0.01em",
      }}>
        {value}
      </div>
    </div>
  );
}
