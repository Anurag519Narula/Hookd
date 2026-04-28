import { motion } from "framer-motion";
import { DeviceMobile, YoutubeLogo } from "@phosphor-icons/react";
import type { PlatformScore } from "../types/insights";
import { TIER_COLORS } from "./ui";

interface PlatformScorecardProps {
  scores: PlatformScore[];
}

function platformIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("reels") || lower.includes("instagram")) {
    return <DeviceMobile size={16} weight="duotone" color="var(--text-3)" />;
  }
  return <YoutubeLogo size={16} weight="duotone" color="var(--text-3)" />;
}

export function PlatformScorecard({ scores }: PlatformScorecardProps) {
  if (!scores || scores.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 12, overflow: "hidden",
      }}
    >
      <div style={{
        padding: "16px 24px", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
          textTransform: "uppercase", color: "var(--text-4)",
          fontFamily: "var(--font-mono)",
        }}>Platform Fit</span>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>

      <div style={{ padding: "4px 24px 16px" }}>
        {scores.map((s, i) => {
          const colors = TIER_COLORS[s.tier] ?? TIER_COLORS.Moderate;
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "12px 0",
              borderBottom: i < scores.length - 1 ? "1px solid var(--border)" : "none",
              transition: "background 0.15s ease",
            }}>
              <div style={{
                width: 130, display: "flex", alignItems: "center", gap: 8,
                fontSize: 14, fontWeight: 600, color: "var(--text)",
                flexShrink: 0, letterSpacing: "-0.01em",
              }}>
                {platformIcon(s.platform)}
                {s.platform}
              </div>
              <span style={{
                display: "inline-block", padding: "3px 10px",
                fontSize: 12, fontWeight: 600, borderRadius: 6,
                background: colors.bg, color: colors.text,
                border: `1px solid ${colors.border}`, flexShrink: 0,
                fontFamily: "var(--font-sans)",
              }}>
                {s.tier}
              </span>
              <span style={{
                fontSize: 14, color: "var(--text-2)", flex: 1,
                lineHeight: 1.55, letterSpacing: "-0.005em",
              }}>
                {s.reason}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
