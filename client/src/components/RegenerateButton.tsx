import React from "react";
import { Platform } from "../types/index";

const RefreshIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

interface RegenerateButtonProps {
  platform: Platform;
  onRegenerate: (platform: Platform) => void;
  loading?: boolean;
}

export function RegenerateButton({ platform, onRegenerate, loading = false }: RegenerateButtonProps) {
  return (
    <button
      onClick={() => !loading && onRegenerate(platform)}
      disabled={loading}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "7px 14px", fontSize: 13, fontWeight: 500,
        borderRadius: "var(--radius-sm)",
        border: "1px solid transparent",
        background: "transparent",
        color: loading ? "var(--text-4)" : "var(--text-3)",
        cursor: loading ? "not-allowed" : "pointer",
        transition: "all var(--transition)",
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.color = "var(--accent-text)";
          b.style.background = "var(--accent-subtle)";
          b.style.borderColor = "rgba(13,148,136,0.2)";
        }
      }}
      onMouseLeave={(e) => {
        const b = e.currentTarget as HTMLButtonElement;
        b.style.color = loading ? "var(--text-4)" : "var(--text-3)";
        b.style.background = "transparent";
        b.style.borderColor = "transparent";
      }}
    >
      <RefreshIcon />
      {loading ? "Regenerating..." : "Regenerate"}
    </button>
  );
}
