/**
 * Shared design system components.
 * Single source of truth for Badge, SectionLabel, ScoreBar, and helpers.
 * Typography: Outfit (sans) + JetBrains Mono (mono)
 * Accent: Emerald (#059669 light / #34d399 dark)
 */

import React from "react";

// ── Colors ────────────────────────────────────────────────────────────────────

export function scoreColor(n: number): string {
  if (n >= 75) return "#059669";
  if (n >= 50) return "#0d9488";
  if (n >= 30) return "#d97706";
  return "#dc2626";
}

export function compColor(c: "low" | "medium" | "high"): string {
  return c === "low" ? "#059669" : c === "medium" ? "#d97706" : "#dc2626";
}

export function reachColor(r: "low" | "medium" | "high"): string {
  return r === "high" ? "#059669" : r === "medium" ? "#d97706" : "#dc2626";
}

export function diffColor(d: "easy" | "medium" | "hard"): string {
  return d === "easy" ? "#059669" : d === "medium" ? "#d97706" : "#dc2626";
}

export const SIGNAL_COLORS: Record<string, string> = {
  rising: "#059669", high: "#059669",
  stable: "#78716c", medium: "#d97706",
  peaked: "#d97706", declining: "#dc2626",
  low: "#dc2626", unknown: "var(--text-4)",
  accelerating: "#059669", steady: "#78716c",
  slowing: "#d97706",
};

export const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Excellent: { bg: "rgba(5,150,105,0.06)", text: "#059669", border: "rgba(5,150,105,0.2)" },
  Strong:    { bg: "rgba(13,148,136,0.06)", text: "#0d9488", border: "rgba(13,148,136,0.2)" },
  Moderate:  { bg: "rgba(217,119,6,0.06)",  text: "#d97706", border: "rgba(217,119,6,0.2)" },
  Low:       { bg: "rgba(220,38,38,0.06)",  text: "#dc2626", border: "rgba(220,38,38,0.2)" },
};

// ── Formatters ────────────────────────────────────────────────────────────────

export function formatViews(count: string | number): string {
  const n = typeof count === "string" ? parseInt(count) : count;
  if (isNaN(n)) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

// ── Components ────────────────────────────────────────────────────────────────

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      marginBottom: 16, paddingBottom: 0,
    }}>
      <span style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
        textTransform: "uppercase" as const, color: "var(--text-4)",
        fontFamily: "var(--font-mono)",
      }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

export function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 10px", borderRadius: 6,
      fontSize: 12, fontWeight: 600, color,
      background: `${color}0d`, border: `1px solid ${color}25`,
      letterSpacing: "0.01em",
      fontFamily: "var(--font-sans)",
    }}>{label}</span>
  );
}

export function ScoreBar({ score, color, height = 4 }: { score: number; color: string; height?: number }) {
  return (
    <div style={{
      width: "100%", height, background: "var(--border)",
      borderRadius: 99, overflow: "hidden",
    }}>
      <div
        className="score-bar-fill"
        style={{
          height: "100%",
          width: `${Math.min(100, Math.max(0, score))}%`,
          background: color,
          borderRadius: 99,
        }}
      />
    </div>
  );
}

export function StatCell({ label, value, sub, accent }: {
  label: string; value: string; sub?: string; accent?: boolean;
}) {
  return (
    <div style={{
      padding: "16px 18px",
      background: accent ? "rgba(5,150,105,0.04)" : "var(--bg-card)",
    }}>
      <div style={{
        fontSize: 10, fontWeight: 600, letterSpacing: "0.14em",
        textTransform: "uppercase", color: "var(--text-4)",
        marginBottom: 8, fontFamily: "var(--font-mono)",
      }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
        <span style={{
          fontSize: 22, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1,
          color: accent ? "var(--accent)" : "var(--text)",
          fontFamily: "var(--font-sans)",
        }}>
          {value}
        </span>
        {sub && (
          <span style={{
            fontSize: 12, color: "var(--text-4)", fontWeight: 500,
            fontFamily: "var(--font-mono)",
          }}>{sub}</span>
        )}
      </div>
    </div>
  );
}
