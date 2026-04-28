import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendUp, MagnifyingGlass, CheckCircle } from "@phosphor-icons/react";
import { SectionLabel, StatCell } from "./ui";

interface SearchTrendsSectionProps {
  interest: number;
  avgInterest: number | null;
  peakInterest: number | null;
  timeline: Array<{ date: string; value: number }>;
  risingQueries: string[];
  topQueries: string[];
}

export function SearchTrendsSection({
  interest, avgInterest, peakInterest, timeline, risingQueries, topQueries,
}: SearchTrendsSectionProps) {
  const hasTimeline = timeline.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 12, overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{
        padding: "16px 24px", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <MagnifyingGlass size={15} weight="bold" color="var(--text-4)" />
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
          textTransform: "uppercase", color: "var(--text-4)",
          fontFamily: "var(--font-mono)",
        }}>
          Google Search Trends — India
        </span>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "3px 10px", borderRadius: 6,
          fontSize: 12, fontWeight: 600, color: "#059669",
          background: "rgba(5,150,105,0.06)",
          border: "1px solid rgba(5,150,105,0.15)",
          marginLeft: "auto",
        }}>
          <CheckCircle size={13} weight="fill" /> Real data
        </span>
      </div>

      <div style={{ padding: "0 24px 24px" }}>

        {/* Interest stats grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${[true, avgInterest !== null, peakInterest !== null, peakInterest !== null && interest > 0].filter(Boolean).length}, 1fr)`,
          gap: 1, background: "var(--border)", borderRadius: 10,
          overflow: "hidden", margin: "20px 0",
        }}>
          <StatCell label="Current" value={`${interest}`} sub="/100" accent />
          {avgInterest !== null && <StatCell label="12-mo avg" value={`${avgInterest}`} sub="/100" />}
          {peakInterest !== null && <StatCell label="Peak" value={`${peakInterest}`} sub="/100" />}
          {peakInterest !== null && interest > 0 && (
            <StatCell label="vs Peak" value={`${Math.round((interest / peakInterest) * 100)}`} sub="%" />
          )}
        </div>

        {/* Sparkline chart */}
        {hasTimeline && (
          <div style={{
            height: 130, marginBottom: 20,
            borderRadius: 10, overflow: "hidden",
            border: "1px solid var(--border)",
            background: "var(--bg-subtle)",
          }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "var(--text-4)", fontFamily: "var(--font-mono)" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis hide domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    fontSize: 13,
                    padding: "10px 14px",
                    fontFamily: "var(--font-sans)",
                    boxShadow: "var(--shadow-md)",
                  }}
                  labelStyle={{ color: "var(--text-3)", fontWeight: 600 }}
                  formatter={(value) => [`${value}/100`, "Interest"]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#059669"
                  strokeWidth={2}
                  fill="url(#trendGradient)"
                  dot={false}
                  activeDot={{ r: 3, fill: "#059669", stroke: "var(--bg-card)", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Rising queries */}
        {risingQueries.length > 0 && (
          <div style={{ marginBottom: topQueries.length > 0 ? 20 : 0 }}>
            <SectionLabel>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <TrendUp size={12} weight="bold" /> Rising Searches
              </span>
            </SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {risingQueries.map((q, i) => (
                <span key={i} style={{
                  padding: "5px 12px", fontSize: 13, borderRadius: 6,
                  background: "rgba(5,150,105,0.05)", color: "#059669",
                  border: "1px solid rgba(5,150,105,0.15)", fontWeight: 600,
                  letterSpacing: "-0.005em",
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
            <SectionLabel>Top Related Searches</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {topQueries.map((q, i) => (
                <span key={i} style={{
                  padding: "5px 12px", fontSize: 13, borderRadius: 6,
                  background: "var(--bg-subtle)", color: "var(--text-2)",
                  border: "1px solid var(--border)", fontWeight: 500,
                  letterSpacing: "-0.005em",
                }}>
                  {q}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
