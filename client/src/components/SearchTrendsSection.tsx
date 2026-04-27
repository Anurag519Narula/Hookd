import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface TimelinePoint {
  date: string;
  value: number;
}

interface TrendingItem {
  query: string;
  searchVolume: number;
  increasePercentage: number;
  categories: string[];
}

interface SearchTrendsSectionProps {
  interest: number;
  avgInterest: number | null;
  peakInterest: number | null;
  timeline: TimelinePoint[];
  risingQueries: string[];
  topQueries: string[];
  trendingNow?: TrendingItem[] | null;
}

export function SearchTrendsSection({
  interest,
  avgInterest,
  peakInterest,
  timeline,
  risingQueries,
  topQueries,
  trendingNow,
}: SearchTrendsSectionProps) {
  const hasTimeline = timeline.length > 0;

  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 8, padding: "16px 20px", marginBottom: 12,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
      }}>
        <span style={{ fontSize: 16 }}>📈</span>
        <span style={{
          fontSize: 12, fontWeight: 700, letterSpacing: "0.1em",
          textTransform: "uppercase", color: "var(--text-4)",
        }}>
          Google Search Trends — India
        </span>
        <span style={{
          marginLeft: "auto", fontSize: 11, fontWeight: 600,
          padding: "2px 8px", borderRadius: 10,
          background: "rgba(20,184,166,0.08)", color: "#14b8a6",
          border: "1px solid rgba(20,184,166,0.2)",
        }}>
          ✅ Real data
        </span>
      </div>

      {/* Interest stats */}
      <div style={{ display: "flex", gap: 20, marginBottom: 14, flexWrap: "wrap" }}>
        <StatBlock label="Current interest" value={`${interest}/100`} highlight />
        {avgInterest !== null && <StatBlock label="12-month avg" value={`${avgInterest}/100`} />}
        {peakInterest !== null && <StatBlock label="Peak" value={`${peakInterest}/100`} />}
        {peakInterest !== null && interest > 0 && (
          <StatBlock
            label="vs peak"
            value={`${Math.round((interest / peakInterest) * 100)}%`}
          />
        )}
      </div>

      {/* Sparkline chart */}
      {hasTimeline && (
        <div style={{
          height: 120, marginBottom: 14,
          borderRadius: 6, overflow: "hidden",
          border: "1px solid var(--border)",
          background: "var(--bg)",
        }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "var(--text-4)" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis hide domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  fontSize: 12,
                  padding: "6px 10px",
                }}
                labelStyle={{ color: "var(--text-3)", fontWeight: 600 }}
                formatter={(value: number) => [`${value}/100`, "Interest"]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#14b8a6"
                strokeWidth={2}
                fill="url(#trendGradient)"
                dot={false}
                activeDot={{ r: 3, fill: "#14b8a6" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Rising queries */}
      {risingQueries.length > 0 && (
        <div style={{ marginBottom: risingQueries.length > 0 && topQueries.length > 0 ? 12 : 0 }}>
          <div style={{
            fontSize: 12, fontWeight: 700, color: "#10b981",
            textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6,
          }}>
            🔥 Rising searches
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {risingQueries.map((q, i) => (
              <span key={i} style={{
                padding: "4px 10px", fontSize: 12, borderRadius: 12,
                background: "rgba(16,185,129,0.08)", color: "#10b981",
                border: "1px solid rgba(16,185,129,0.2)", fontWeight: 500,
              }}>
                {q}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Top queries */}
      {topQueries.length > 0 && (
        <div>
          <div style={{
            fontSize: 12, fontWeight: 700, color: "var(--text-4)",
            textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6,
          }}>
            Top related searches
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {topQueries.map((q, i) => (
              <span key={i} style={{
                padding: "4px 10px", fontSize: 12, borderRadius: 12,
                background: "var(--bg)", color: "var(--text-3)",
                border: "1px solid var(--border)", fontWeight: 500,
              }}>
                {q}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Trending Now in India */}
      {trendingNow && trendingNow.length > 0 && (
        <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
          <div style={{
            fontSize: 12, fontWeight: 700, color: "#f59e0b",
            textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8,
          }}>
            ⚡ Trending now in India
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {trendingNow.slice(0, 8).map((t, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "4px 0",
              }}>
                <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500, flex: 1 }}>
                  {t.query}
                </span>
                {t.searchVolume > 0 && (
                  <span style={{ fontSize: 11, color: "var(--text-4)", flexShrink: 0 }}>
                    {t.searchVolume >= 1000 ? `${(t.searchVolume / 1000).toFixed(0)}K+` : `${t.searchVolume}+`} searches
                  </span>
                )}
                {t.categories.length > 0 && (
                  <span style={{
                    fontSize: 10, padding: "2px 6px", borderRadius: 8,
                    background: "rgba(245,158,11,0.08)", color: "#f59e0b",
                    border: "1px solid rgba(245,158,11,0.2)", flexShrink: 0,
                  }}>
                    {t.categories[0]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatBlock({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </div>
      <div style={{
        fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em",
        color: highlight ? "#14b8a6" : "var(--text)",
      }}>
        {value}
      </div>
    </div>
  );
}
