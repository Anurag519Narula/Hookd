import { useState } from "react";
import type { CaptionResult, Platform } from "../types";
import { useClipboard } from "../hooks/useClipboard";

const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  reels: "Reels",
  youtube_shorts: "YouTube Shorts",
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
          fontSize: 14,
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
                fontSize: 12,
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
          fontSize: 12,
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
  const [activeTab, setActiveTab] = useState<Platform>(platforms[0]);
  const [researchOpen, setResearchOpen] = useState(false);

  const activeCaption = result.captions[activeTab];

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
            fontSize: 12,
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

      {/* Platform tabs */}
      {platforms.length > 1 && (
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--border)",
            overflowX: "auto",
          }}
          role="tablist"
          aria-label="Platform captions"
        >
          {platforms.map((p) => (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={activeTab === p}
              onClick={() => setActiveTab(p)}
              style={{
                padding: "10px 16px",
                border: "none",
                borderBottom: `2px solid ${activeTab === p ? "var(--accent)" : "transparent"}`,
                background: "transparent",
                color: activeTab === p ? "var(--accent-text)" : "var(--text-3)",
                fontSize: 13,
                fontWeight: activeTab === p ? 600 : 400,
                cursor: "pointer",
                transition: "all var(--transition)",
                whiteSpace: "nowrap",
              }}
            >
              {PLATFORM_LABELS[p]}
            </button>
          ))}
        </div>
      )}

      {/* Caption content */}
      <div style={{ padding: 16 }}>
        {activeCaption ? (
          <PlatformCaption
            platform={activeTab}
            text={activeCaption.text}
            hashtags={activeCaption.hashtags}
          />
        ) : (
          <p style={{ fontSize: 13, color: "var(--text-3)" }}>No caption available.</p>
        )}
      </div>

      {/* Market research section */}
      {result.market_research && (
        <div
          style={{
            borderTop: "1px solid var(--border)",
          }}
        >
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
              fontSize: 13,
              fontWeight: 500,
            }}
            aria-expanded={researchOpen}
          >
            <span>Market Research</span>
            <span
              style={{
                transform: researchOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform var(--transition)",
                fontSize: 10,
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
                fontSize: 13,
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
