import type { TopVideo, InsightReport } from "../types/insights";

interface ResearchPanelProps {
  topVideos: TopVideo[];
  youtubeData: InsightReport["youtubeData"];
  platformAnalysis: InsightReport["platformAnalysis"];
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

const PLATFORM_ICONS: Record<string, string> = {
  "instagram reels": "📱",
  "youtube shorts": "▶️",
  "tiktok": "🎵",
  "linkedin": "💼",
};

function getPlatformIcon(platform: string): string {
  return PLATFORM_ICONS[platform.toLowerCase()] ?? "📊";
}

export function ResearchPanel({ topVideos, youtubeData, platformAnalysis, sources }: ResearchPanelProps) {
  const avgViews = youtubeData?.avgTopVideoViews ?? 0;
  const topChannels = youtubeData?.topChannels ?? [];

  // Extract short-form platform data
  const reelsData = platformAnalysis?.find((p) => p.platform.toLowerCase().includes("reels"));
  const shortsData = platformAnalysis?.find((p) => p.platform.toLowerCase().includes("shorts"));

  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 8, padding: "16px 20px", marginBottom: 12,
    }}>
      <div style={{
        fontSize: 12, fontWeight: 700, letterSpacing: "0.1em",
        textTransform: "uppercase", color: "var(--text-4)", marginBottom: 12,
      }}>
        Based on
      </div>

      {/* Summary stats row */}
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
      </div>

      {/* Short-form platform cards */}
      {(reelsData || shortsData) && (
        <div style={{
          display: "grid",
          gridTemplateColumns: reelsData && shortsData ? "1fr 1fr" : "1fr",
          gap: 10, marginBottom: 14,
          borderTop: "1px solid var(--border)", paddingTop: 12,
        }}>
          {reelsData && (
            <PlatformCard
              icon={getPlatformIcon("instagram reels")}
              name="Instagram Reels"
              avgViews={reelsData.avgViewsForTopic}
              style={reelsData.contentStyle}
              hashtags={reelsData.hashtagStrategy}
              potential={reelsData.potential}
            />
          )}
          {shortsData && (
            <PlatformCard
              icon={getPlatformIcon("youtube shorts")}
              name="YouTube Shorts"
              avgViews={shortsData.avgViewsForTopic}
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

const POTENTIAL_COLORS: Record<string, string> = {
  high: "#10b981",
  medium: "#f59e0b",
  low: "#ef4444",
};

function PlatformCard({ icon, name, avgViews, style, hashtags, potential }: {
  icon: string;
  name: string;
  avgViews: string;
  style: string;
  hashtags: string;
  potential: "low" | "medium" | "high";
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
          textTransform: "uppercase", color: potentialColor,
          letterSpacing: "0.05em",
        }}>
          {potential} potential
        </span>
      </div>
      <div style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.5, marginBottom: 6 }}>
        <span style={{ fontWeight: 600, color: "var(--text)" }}>Avg views:</span> {avgViews}
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
