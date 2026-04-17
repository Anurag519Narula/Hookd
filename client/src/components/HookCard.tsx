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
    <div
      className="shimmer-line"
      style={{ width, height, borderRadius: 6, flexShrink: 0 }}
    />
  );
}

const TRIGGER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Curiosity Gap":        { bg: "rgba(20, 184, 166, 0.12)", text: "#14b8a6", border: "rgba(20, 184, 166, 0.3)" },
  "Identity Threat":      { bg: "rgba(239, 68, 68, 0.1)",   text: "#f87171", border: "rgba(239, 68, 68, 0.25)" },
  "Controversy":          { bg: "rgba(245, 158, 11, 0.1)",  text: "#fbbf24", border: "rgba(245, 158, 11, 0.25)" },
  "Surprising Stat":      { bg: "rgba(99, 102, 241, 0.1)",  text: "#818cf8", border: "rgba(99, 102, 241, 0.25)" },
  "Personal Story Angle": { bg: "rgba(236, 72, 153, 0.1)",  text: "#f472b6", border: "rgba(236, 72, 153, 0.25)" },
  "Pattern Interrupt":    { bg: "rgba(34, 197, 94, 0.1)",   text: "#4ade80", border: "rgba(34, 197, 94, 0.25)" },
};

const DEFAULT_TRIGGER_STYLE = {
  bg: "rgba(20, 184, 166, 0.12)",
  text: "#14b8a6",
  border: "rgba(20, 184, 166, 0.3)",
};

export function HookCard({
  hook,
  isSelected,
  isLoading,
  error,
  onSelect,
  onTryAnother,
}: HookCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const triggerStyle = TRIGGER_COLORS[hook.trigger] ?? DEFAULT_TRIGGER_STYLE;

  const cardStyle: React.CSSProperties = {
    background: isSelected ? "rgba(20, 184, 166, 0.05)" : "var(--bg-card)",
    border: isSelected ? "1.5px solid var(--accent)" : "1px solid var(--border)",
    borderLeft: isSelected ? "4px solid var(--accent)" : "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    boxShadow: isSelected
      ? "0 4px 20px rgba(20, 184, 166, 0.15)"
      : "var(--shadow-sm)",
    padding: "20px",
    transition: "all var(--transition)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    opacity: isLoading ? 0.7 : 1,
    cursor: isLoading ? "default" : "pointer",
    position: "relative",
  };

  // Loading skeleton state
  if (isLoading) {
    return (
      <div style={{ ...cardStyle, cursor: "default" }}>
        {/* Trigger badge skeleton */}
        <ShimmerBlock width="100px" height={22} />
        {/* Hook text skeleton */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <ShimmerBlock width="95%" height={16} />
          <ShimmerBlock width="80%" height={16} />
          <ShimmerBlock width="60%" height={16} />
        </div>
        {/* Button skeleton */}
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <ShimmerBlock width="110px" height={34} />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onSelect}
      style={cardStyle}
      onMouseEnter={(e) => {
        setIsHovered(true);
        const el = e.currentTarget as HTMLDivElement;
        if (!isSelected) {
          el.style.borderColor = "var(--accent)";
          el.style.borderLeftWidth = "4px";
          el.style.background = "rgba(20, 184, 166, 0.03)";
        }
        el.style.boxShadow = isSelected
          ? "0 8px 30px rgba(20, 184, 166, 0.25)"
          : "0 6px 24px rgba(20, 184, 166, 0.12)";
        el.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        const el = e.currentTarget as HTMLDivElement;
        if (!isSelected) {
          el.style.borderColor = "var(--border)";
          el.style.borderLeftWidth = "1px";
          el.style.background = "var(--bg-card)";
        }
        el.style.boxShadow = isSelected
          ? "0 4px 20px rgba(20, 184, 166, 0.15)"
          : "var(--shadow-sm)";
        el.style.transform = "translateY(0)";
      }}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div style={{
          position: "absolute",
          top: 12,
          right: 12,
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "var(--accent)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 700,
          boxShadow: "0 2px 8px rgba(20, 184, 166, 0.3)",
        }}>
          ✓
        </div>
      )}

      {/* Trigger badge */}
      <span
        style={{
          display: "inline-flex",
          alignSelf: "flex-start",
          alignItems: "center",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          padding: "3px 10px",
          borderRadius: 99,
          background: triggerStyle.bg,
          color: triggerStyle.text,
          border: `1px solid ${triggerStyle.border}`,
        }}
      >
        {hook.trigger}
      </span>

      {/* Hook text */}
      <p
        style={{
          fontSize: 15,
          lineHeight: 1.65,
          color: "var(--text)",
          margin: 0,
          fontWeight: isSelected ? 500 : 400,
          paddingRight: isSelected ? 32 : 0,
        }}
      >
        {hook.hook_text}
      </p>

      {/* Inline error */}
      {error && (
        <p
          style={{
            fontSize: 12,
            color: "var(--error)",
            background: "var(--error-subtle)",
            border: "1px solid rgba(248, 113, 113, 0.2)",
            borderRadius: "var(--radius-sm)",
            padding: "6px 10px",
            margin: 0,
          }}
        >
          {error}
        </p>
      )}

      {/* Try another button */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click
            onTryAnother();
          }}
          style={{
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 500,
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text-3)",
            cursor: "pointer",
            transition: "all var(--transition)",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.borderColor = "var(--border-strong)";
            el.style.color = "var(--text)";
            el.style.background = "var(--bg-subtle)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.borderColor = "var(--border)";
            el.style.color = "var(--text-3)";
            el.style.background = "transparent";
          }}
        >
          ↻ Try another
        </button>
      </div>

      {/* Click to select hint (only show when not selected and hovered) */}
      {!isSelected && isHovered && (
        <div style={{
          position: "absolute",
          bottom: 12,
          right: 12,
          fontSize: 11,
          color: "var(--accent)",
          fontWeight: 600,
          pointerEvents: "none",
        }}>
          Click to select
        </div>
      )}
    </div>
  );
}
