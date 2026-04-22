import { useState } from "react";
import type { CaptionResult, Platform } from "../types";
import { useClipboard } from "../hooks/useClipboard";

const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  reels: "Reels",
  youtube_shorts: "YouTube Shorts",
};

const PLATFORM_COLORS: Record<Platform, { bg: string; color: string; border: string }> = {
  instagram: { bg: "rgba(225,48,108,0.12)", color: "#e1306c", border: "rgba(225,48,108,0.3)" },
  linkedin:  { bg: "rgba(10,102,194,0.12)", color: "#0a66c2", border: "rgba(10,102,194,0.3)" },
  reels:     { bg: "rgba(131,58,180,0.12)", color: "#833ab4", border: "rgba(131,58,180,0.3)" },
  youtube_shorts: { bg: "rgba(255,0,0,0.1)", color: "#ff0000", border: "rgba(255,0,0,0.25)" },
};

interface CaptionResultCardProps {
  result: CaptionResult;
}

function PlatformCaption({
  platform,
  text,
  hashtags,
}: {
  platform: Platform;
  text: string;
  hashtags: string[];
}) {
  const { copied, copy } = useClipboard();
  const fullText = hashtags.length > 0 ? `${text}\n\n${hashtags.join(" ")}` : text;

  return (
    <div
      style={{
        padding: "14px 16px",
        background: "var(--bg-subtle)",
        borderRadius: "var(--radius-sm)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <p
        style={{
          fontSize: 16,
          color: "var(--text)",
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
          margin: 0,
        }}
      >
        {text}
      </p>
      {hashtags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {hashtags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 14,
                color: "var(--accent-text)",
                background: "var(--accent-subtle)",
                padding: "2px 8px",
                borderRadius: 999,
                fontWeight: 500,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => copy(fullText)}
        style={{
          alignSelf: "flex-end",
          padding: "5px 12px",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border)",
          background: copied ? "var(--accent-subtle)" : "var(--bg-card)",
          color: copied ? "var(--accent-text)" : "var(--text-2)",
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer",
          transition: "all var(--transition)",
        }}
        aria-label={`Copy ${PLATFORM_LABELS[platform]} caption`}
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

export function CaptionResultCard({ result }: CaptionResultCardProps) {
  const platforms = Object.keys(result.captions) as Platform[];
  const [researchOpen, setResearchOpen] = useState(false);

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        boxShadow: "var(--shadow-sm)",
        width: "100%",
      }}
    >
      {/* Real-time data banner */}
      {!result.real_time_data_available && (
        <div
          style={{
            padding: "8px 16px",
            background: "var(--bg-subtle)",
            borderBottom: "1px solid var(--border)",
            fontSize: 14,
            color: "var(--text-3)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
          role="status"
        >
          <span aria-hidden="true">⚠️</span>
          Real-time hashtag data unavailable — using AI knowledge
        </div>
      )}

      {/* All platform captions stacked */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {platforms.map((p, i) => {
          const caption = result.captions[p];
          if (!caption) return null;
          const colors = PLATFORM_COLORS[p] ?? { bg: "rgba(20,184,166,0.1)", color: "#14b8a6", border: "rgba(20,184,166,0.3)" };
          const label = PLATFORM_LABELS[p] ?? p;
          return (
            <div
              key={p}
              style={{
                borderBottom: i < platforms.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              {/* Platform label */}
              <div style={{
                padding: "12px 16px 0",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <span style={{
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  color: colors.color,
                  background: colors.bg,
                  padding: "3px 10px",
                  borderRadius: 99,
                  border: `1px solid ${colors.border}`,
                  display: "inline-block",
                }}>
                  {label}
                </span>
              </div>

              {/* Caption content */}
              <div style={{ padding: "10px 16px 14px" }}>
                <PlatformCaption
                  platform={p}
                  text={caption.text}
                  hashtags={caption.hashtags}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Market research section */}
      {result.market_research && (
        <div style={{ borderTop: "1px solid var(--border)" }}>
          <button
            type="button"
            onClick={() => setResearchOpen((o) => !o)}
            style={{
              width: "100%",
              padding: "10px 16px",
              background: "transparent",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              color: "var(--text-2)",
              fontSize: 15,
              fontWeight: 500,
            }}
            aria-expanded={researchOpen}
          >
            <span>Market Research</span>
            <span
              style={{
                transform: researchOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform var(--transition)",
                fontSize: 12,
                color: "var(--text-3)",
              }}
              aria-hidden="true"
            >
              ▼
            </span>
          </button>
          {researchOpen && (
            <div
              style={{
                padding: "0 16px 16px",
                fontSize: 15,
                color: "var(--text-2)",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
              }}
            >
              {result.market_research}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
