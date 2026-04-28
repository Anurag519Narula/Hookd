import { motion } from "framer-motion";
import { Lightbulb, ShieldWarning } from "@phosphor-icons/react";
import type { InsightReport } from "../types/insights";
import { Badge, compColor } from "./ui";

interface VerdictCardProps {
  insights: InsightReport;
}

const VERDICT_THEME: Record<InsightReport["verdictLabel"], { color: string; bg: string; borderAccent: string }> = {
  "Strong opportunity":    { color: "#059669", bg: "rgba(5,150,105,0.04)",  borderAccent: "rgba(5,150,105,0.25)" },
  "Good opportunity":      { color: "#0d9488", bg: "rgba(13,148,136,0.04)", borderAccent: "rgba(13,148,136,0.25)" },
  "Proceed with caution":  { color: "#d97706", bg: "rgba(217,119,6,0.04)",  borderAccent: "rgba(217,119,6,0.25)" },
  "Avoid for now":         { color: "#dc2626", bg: "rgba(220,38,38,0.04)",  borderAccent: "rgba(220,38,38,0.25)" },
};

export function VerdictCard({ insights }: VerdictCardProps) {
  const theme = VERDICT_THEME[insights.verdictLabel];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 12,
      }}
    >
      {/* Verdict header */}
      <div style={{
        padding: "20px 24px 18px",
        background: theme.bg,
        borderBottom: `1px solid ${theme.borderAccent}`,
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10, marginBottom: 12,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: theme.color,
            boxShadow: `0 0 10px ${theme.color}60`,
            flexShrink: 0,
          }} />
          <span style={{
            fontSize: 18, fontWeight: 700, color: theme.color,
            letterSpacing: "-0.03em",
            fontFamily: "var(--font-sans)",
          }}>
            {insights.verdictLabel}
          </span>
          {insights.saturationWarning && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "3px 10px", borderRadius: 6,
              fontSize: 12, fontWeight: 600, color: "#dc2626",
              background: "rgba(220,38,38,0.06)",
              border: "1px solid rgba(220,38,38,0.2)",
            }}>
              <ShieldWarning size={13} weight="bold" />
              Saturated
            </span>
          )}
        </div>

        <p style={{
          fontSize: 15, color: "var(--text-2)", lineHeight: 1.7,
          margin: 0, maxWidth: "65ch",
        }}>
          {insights.verdictReason}
        </p>

        {/* Context badges */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
          <Badge label={insights.audienceFit.audienceIntent} color="var(--accent)" />
          <Badge label={`${insights.competitionLevel} competition`} color={compColor(insights.competitionLevel)} />
          {insights.audienceFit.bestDays.slice(0, 3).map((d) => (
            <Badge key={d} label={d} color="#78716c" />
          ))}
          {insights.audienceFit.bestPostingTimes.slice(0, 2).map((t) => (
            <Badge key={t} label={t} color="#78716c" />
          ))}
        </div>
      </div>

      {/* Key Insight */}
      <div style={{
        padding: "18px 24px",
        borderLeft: `3px solid var(--accent)`,
        marginLeft: -1,
        display: "flex", gap: 12, alignItems: "flex-start",
      }}>
        <Lightbulb size={18} weight="duotone" color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
            textTransform: "uppercase", color: "var(--accent)",
            marginBottom: 6, fontFamily: "var(--font-mono)",
          }}>
            Key Insight
          </div>
          <p style={{
            fontSize: 15, color: "var(--text)", fontWeight: 500,
            lineHeight: 1.7, margin: 0, maxWidth: "65ch",
          }}>
            {insights.keyInsight}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
