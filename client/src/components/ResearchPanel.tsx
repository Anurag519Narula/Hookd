import type { TopVideo, InsightReport } from "../types/insights";

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
  signals?: ComputedSignals;
  sources: {
    youtubeCount: number;
    trendsAvailable: boolean;
    trendScore: number | null;
    relatedQueries: string[];
  };
}

function formatViews(count: string | number): string {
  const n = typeof count === "string" ? parseInt(count) : count;
  if (isNaN(n)) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

const SIGNAL_COLORS: Record<string, string> = {
  rising: "#10b981", high: "#10b981",
  stable: "#3b82f6", medium: "#f59e0b",
  peaked: "#f59e0b", declining: "#ef4444",
  low: "#ef4444", unknown: "var(--text-4)",
};

export function ResearchPanel({ topVideos, youtubeData, platformAnalysis, signals, sources }: ResearchPanelProps) {
  const avgViews = youtubeData?.avgTopVideoViews ?? 0;
  const topChannels = youtubeData?.topChannels ?? [];

  // Extract short-form platform data (content style + hashtag strategy only — no fake avg views)
  const reelsData = platformAnalysis?.find((p) => p.platform.toLowerCase().includes("reels"));
  const shortsData = platformAnalysis?.find((p) => p.platform.toLowerCase().includes("shorts"));

  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 8, padding: "16px 20px", marginBottom: 12,
    }}>
      {/* Data sources badge */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap",
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-4)" }}>
          Based on
        </span>
        {sources.youtubeCount > 0 && <SourceBadge label="YouTube" active />}
        {signals?.googleTrends?.available && <SourceBadge label="Google Trends" active />}
        <SourceBadge label="AI Interpretation" active icon="🤖" />
      </div>

      {/* Computed signals — real math, not LLM */}
      {signals && (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 10, marginBottom: 14,
          padding: "12px 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)",
        }}>
          <SignalCard
            label="Trend"
            value={signals.trend.direction}
            color={SIGNAL_COLORS[signals.trend.direction] ?? "var(--text-3)"}
          />
          <SignalCard
            label="Momentum"
            value={signals.trend.velocity}
            color={SIGNAL_COLORS[signals.trend.velocity] ?? "var(--text-3)"}
          />
          <SignalCard
            label="Competition"
            value={signals.competition.level}
            color={SIGNAL_COLORS[signals.competition.level] ?? "var(--text-3)"}
          />
          <SignalCard
            label="Recent uploads"
            value={`${signals.evidence.recentVideoCount} in 6mo`}
            color="var(--text)"
          />
          {signals.googleTrends.available && (
            <SignalCard
              label="Search interest"
              value={`${signals.googleTrends.interest}/100`}
              color={SIGNAL_COLORS[signals.googleTrends.direction ?? "unknown"] ?? "var(--text-3)"}
            />
          )}
        </div>
      )}

      {/* Evidence stats row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 14 }}>
        {sources.youtubeCount > 0 && (
          <Stat label="Videos analyzed" value={String(sources.youtubeCount)} />
        )}
        {avgViews > 0 && (
          <Stat label="Avg views (top 5)" value={formatViews(avgViews)} />
        )}
        {topChannels.length > 0 && (
          <Stat label="Top channels" value={topChannels.slice(0, 3).join(", ")} />
        )}
        {signals && signals.momentum.medianViewsPerDay > 0 && (
          <Stat label="Median views/day" value={formatViews(signals.momentum.medianViewsPerDay)} />
        )}
      </div>

      {/* Short-form platform cards — content style only, no fake avg views */}
      {(reelsData || shortsData) && (
        <div style={{
          display: "grid",
          gridTemplateColumns: reelsData && shortsData ? "1fr 1fr" : "1fr",
          gap: 10, marginBottom: 14,
          borderTop: "1px solid var(--border)", paddingTop: 12,
        }}>
          {reelsData && (
            <PlatformCard
              icon="📱"
              name="Instagram Reels"
              style={reelsData.contentStyle}
              hashtags={reelsData.hashtagStrategy}
              potential={reelsData.potential}
            />
          )}
          {shortsData && (
            <PlatformCard
              icon="▶️"
              name="YouTube Shorts"
              style={shortsData.contentStyle}
              hashtags={shortsData.hashtagStrategy}
              potential={shortsData.potential}
            />
          )}
        </div>
      )}

      {/* Top videos with clickable links */}
      {topVideos.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-3)", marginBottom: 8 }}>
            Top performing videos in this space
          </div>
          {topVideos.slice(0, 5).map((v, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "6px 0",
              borderBottom: i < Math.min(topVideos.length, 5) - 1 ? "1px solid var(--border)" : "none",
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14, color: "var(--text)", lineHeight: 1.4,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {v.title}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-4)" }}>
                  {v.channelName} · {formatViews(v.viewCount)} views
                </div>
              </div>
              <a
                href={`https://www.youtube.com/watch?v=${v.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 13, color: "#14b8a6", textDecoration: "none",
                  fontWeight: 600, flexShrink: 0, marginLeft: 12,
                }}
              >
                Watch →
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 13, color: "var(--text-4)" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{value}</div>
    </div>
  );
}

function SignalCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{
        fontSize: 15, fontWeight: 700, color,
        textTransform: "capitalize",
      }}>
        {value}
      </div>
    </div>
  );
}

function SourceBadge({ label, active, icon }: { label: string; active: boolean; icon?: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", fontSize: 11, fontWeight: 600,
      borderRadius: 10,
      background: active ? "rgba(20,184,166,0.08)" : "var(--bg)",
      color: active ? "#14b8a6" : "var(--text-4)",
      border: `1px solid ${active ? "rgba(20,184,166,0.2)" : "var(--border)"}`,
    }}>
      {icon ?? (active ? "✅" : "⬜")} {label}
    </span>
  );
}

const POTENTIAL_COLORS: Record<string, string> = {
  high: "#10b981", medium: "#f59e0b", low: "#ef4444",
};

function PlatformCard({ icon, name, style, hashtags, potential }: {
  icon: string; name: string; style: string; hashtags: string; potential: "low" | "medium" | "high";
}) {
  const potentialColor = POTENTIAL_COLORS[potential] ?? "var(--text-3)";
  return (
    <div style={{
      padding: "12px 14px", borderRadius: 6,
      border: "1px solid var(--border)", background: "var(--bg)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{name}</span>
        <span style={{
          marginLeft: "auto", fontSize: 11, fontWeight: 700,
          textTransform: "uppercase", color: potentialColor, letterSpacing: "0.05em",
        }}>
          {potential} potential
        </span>
      </div>
      <div style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.5, marginBottom: 6 }}>
        <span style={{ fontWeight: 600, color: "var(--text)" }}>What works:</span> {style}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-4)", lineHeight: 1.5 }}>
        <span style={{ fontWeight: 600, color: "var(--text-3)" }}>Hashtags:</span> {hashtags}
      </div>
    </div>
  );
}
