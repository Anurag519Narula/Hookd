import type { PlatformScore } from "../types/insights";

interface PlatformScorecardProps {
  scores: PlatformScore[];
}

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Excellent: { bg: "rgba(16,185,129,0.1)", text: "#10b981", border: "rgba(16,185,129,0.3)" },
  Strong: { bg: "rgba(59,130,246,0.1)", text: "#3b82f6", border: "rgba(59,130,246,0.3)" },
  Moderate: { bg: "rgba(245,158,11,0.1)", text: "#f59e0b", border: "rgba(245,158,11,0.3)" },
  Low: { bg: "rgba(239,68,68,0.08)", text: "#ef4444", border: "rgba(239,68,68,0.25)" },
};

export function PlatformScorecard({ scores }: PlatformScorecardProps) {
  if (!scores || scores.length === 0) return null;

  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 8, padding: "16px 20px", marginBottom: 12,
    }}>
      <div style={{
        fontSize: 12, fontWeight: 700, letterSpacing: "0.1em",
        textTransform: "uppercase", color: "var(--text-4)", marginBottom: 12,
      }}>
        Platform Fit
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {scores.map((s, i) => {
          const colors = TIER_COLORS[s.tier] ?? TIER_COLORS.Moderate;
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "8px 0",
              borderBottom: i < scores.length - 1 ? "1px solid var(--border)" : "none",
            }}>
              <div style={{ width: 120, fontSize: 14, fontWeight: 600, color: "var(--text)", flexShrink: 0 }}>
                {s.platform}
              </div>
              <span style={{
                display: "inline-block", padding: "3px 10px",
                fontSize: 12, fontWeight: 700, borderRadius: 12,
                background: colors.bg, color: colors.text,
                border: `1px solid ${colors.border}`,
                flexShrink: 0,
              }}>
                {s.tier}
              </span>
              <span style={{ fontSize: 13, color: "var(--text-3)", flex: 1 }}>
                {s.reason}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
