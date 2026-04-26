import React from "react";
import { HookVariant } from "../types/index";

interface HookCardProps {
  hook: HookVariant;
  isSelected: boolean;
  isLoading: boolean;
  error: string | null;
  onSelect: () => void;
  onTryAnother: () => void;
}

function ShimmerBlock({ width, height }: { width: string; height: number }) {
  return (
    <div className="shimmer-line" style={{ width, height, borderRadius: 4, flexShrink: 0 }} />
  );
}

// Trigger → color mapping. Purposeful, not decorative.
const TRIGGER_META: Record<string, { color: string; label: string }> = {
  "Curiosity Gap":        { color: "#14b8a6", label: "Curiosity Gap" },
  "Identity Threat":      { color: "#f87171", label: "Identity Threat" },
  "Controversy":          { color: "#f59e0b", label: "Controversy" },
  "Surprising Stat":      { color: "#818cf8", label: "Surprising Stat" },
  "Personal Story Angle": { color: "#f472b6", label: "Personal Story" },
  "Pattern Interrupt":    { color: "#34d399", label: "Pattern Interrupt" },
};

const DEFAULT_META = { color: "#14b8a6", label: "Hook" };

export function HookCard({
  hook,
  isSelected,
  isLoading,
  error,
  onSelect,
  onTryAnother,
}: HookCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const meta = TRIGGER_META[hook.trigger] ?? DEFAULT_META;

  if (isLoading) {
    return (
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "18px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        opacity: 0.6,
      }}>
        <ShimmerBlock width="80px" height={18} />
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <ShimmerBlock width="100%" height={14} />
          <ShimmerBlock width="85%" height={14} />
          <ShimmerBlock width="65%" height={14} />
        </div>
        <ShimmerBlock width="90px" height={28} />
      </div>
    );
  }

  const borderColor = isSelected ? meta.color : isHovered ? `${meta.color}60` : "var(--border)";
  const bg = isSelected
    ? `${meta.color}08`
    : isHovered
    ? `${meta.color}04`
    : "var(--bg-card)";

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: bg,
        border: `1px solid ${borderColor}`,
        borderTop: `2px solid ${isSelected || isHovered ? meta.color : "var(--border)"}`,
        borderRadius: 8,
        padding: "18px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        cursor: "pointer",
        transition: "all 0.15s ease",
        position: "relative",
        transform: isHovered && !isSelected ? "translateY(-1px)" : "translateY(0)",
      }}
    >
      {/* Trigger label row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: meta.color,
        }}>
          {meta.label}
        </span>
        {isSelected && (
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: meta.color,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Selected
          </span>
        )}
        {!isSelected && isHovered && (
          <span style={{ fontSize: 10, fontWeight: 600, color: meta.color, letterSpacing: "0.06em" }}>
            Click to select
          </span>
        )}
      </div>

      {/* Hook text */}
      <p style={{
        fontSize: 13,
        lineHeight: 1.6,
        color: isSelected ? "var(--text)" : "var(--text-2)",
        margin: 0,
        fontWeight: isSelected ? 500 : 400,
        letterSpacing: "-0.01em",
      }}>
        {hook.hook_text}
      </p>

      {/* Error */}
      {error && (
        <p style={{
          fontSize: 14,
          color: "var(--error)",
          background: "rgba(248,113,113,0.06)",
          border: "1px solid rgba(248,113,113,0.2)",
          borderRadius: 6,
          padding: "6px 10px",
          margin: 0,
        }}>
          {error}
        </p>
      )}

      {/* Try another */}
      <button
        onClick={(e) => { e.stopPropagation(); onTryAnother(); }}
        style={{
          alignSelf: "flex-start",
          padding: "5px 10px",
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.04em",
          borderRadius: 4,
          border: "1px solid var(--border)",
          background: "transparent",
          color: "var(--text-3)",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.borderColor = "var(--border-strong)";
          b.style.color = "var(--text)";
          b.style.background = "var(--bg-subtle)";
        }}
        onMouseLeave={(e) => {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.borderColor = "var(--border)";
          b.style.color = "var(--text-3)";
          b.style.background = "transparent";
        }}
      >
        ↻ Try another
      </button>
    </div>
  );
}
