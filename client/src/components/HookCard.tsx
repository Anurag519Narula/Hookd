import React from "react";
import { Hook } from "../types/index";

interface HookCardProps {
  hook: Hook | null; // null = loading/shimmer state
  isSelected: boolean;
  isDimmed: boolean;
  onSelect: (hook: Hook) => void;
  onTryAnother: () => void;
  tryAnotherLoading?: boolean;
}

function ShimmerBlock({ width, height }: { width: string; height: number }) {
  return (
    <div
      className="shimmer-line"
      style={{ width, height, borderRadius: 6 }}
    />
  );
}

export function HookCard({
  hook,
  isSelected,
  isDimmed,
  onSelect,
  onTryAnother,
  tryAnotherLoading = false,
}: HookCardProps) {
  const cardStyle: React.CSSProperties = {
    background: isSelected ? "rgba(13, 148, 136, 0.05)" : "var(--bg-card)",
    border: isSelected ? "1.5px solid var(--accent)" : "1px solid var(--border)",
    borderLeft: isSelected ? "6px solid var(--accent)" : "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    boxShadow: isSelected ? "0 4px 20px rgba(13, 148, 136, 0.15)" : "var(--shadow-sm)",
    padding: "20px",
    opacity: isDimmed ? 0.6 : 1,
    transition: "all var(--transition)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    cursor: isDimmed ? "pointer" : "default",
  };

  if (hook === null) {
    // Shimmer / loading state
    return (
      <div style={cardStyle}>
        <ShimmerBlock width="90%" height={18} />
        <ShimmerBlock width="70%" height={14} />
        <ShimmerBlock width="50%" height={14} />
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <ShimmerBlock width="130px" height={32} />
          <ShimmerBlock width="110px" height={32} />
        </div>
      </div>
    );
  }

  return (
    <div
      style={cardStyle}
      onClick={() => isDimmed && onSelect(hook)}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = isSelected ? "0 8px 30px rgba(13, 148, 136, 0.25)" : "var(--shadow-md)";
        el.style.transform = "translateY(-2px)";
        if (isDimmed) el.style.opacity = "1";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = isSelected ? "0 4px 20px rgba(13, 148, 136, 0.15)" : "var(--shadow-sm)";
        el.style.transform = "translateY(0)";
        if (isDimmed) el.style.opacity = "0.6";
      }}
    >
      {/* Hook text */}
      <p
        style={{
          fontSize: 16,
          lineHeight: 1.6,
          color: "var(--text)",
          margin: 0,
          fontWeight: 500,
        }}
      >
        {hook.hook_text}
      </p>

      {/* Trigger label */}
      <span
        style={{
          fontSize: 12,
          color: "var(--text-3)",
          fontWeight: 500,
          letterSpacing: "0.02em",
        }}
      >
        {hook.trigger}
      </span>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
        {/* "Use this hook →" — teal/accent style */}
        <button
          onClick={() => onSelect(hook)}
          style={{
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 600,
            borderRadius: "var(--radius-sm)",
            border: "none",
            background: "var(--accent)",
            color: "#fff",
            cursor: "pointer",
            transition: "background var(--transition)",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-hover)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)";
          }}
        >
          Use this hook →
        </button>

        {/* "↻ Try another" — ghost/border style */}
        <button
          onClick={onTryAnother}
          disabled={tryAnotherLoading}
          style={{
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 500,
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            background: "transparent",
            color: tryAnotherLoading ? "var(--text-4)" : "var(--text-2)",
            cursor: tryAnotherLoading ? "not-allowed" : "pointer",
            transition: "all var(--transition)",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            if (!tryAnotherLoading) {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.borderColor = "var(--border-strong)";
              el.style.color = "var(--text)";
            }
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.borderColor = "var(--border)";
            el.style.color = tryAnotherLoading ? "var(--text-4)" : "var(--text-2)";
          }}
        >
          {tryAnotherLoading ? "Loading…" : "↻ Try another"}
        </button>
      </div>
    </div>
  );
}
