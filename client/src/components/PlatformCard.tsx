import React from "react";
import { Platform, CardState } from "../types/index";
import { CopyButton } from "./CopyButton";
import { RegenerateButton } from "./RegenerateButton";

const PLATFORM_META: Record<Platform, { name: string; icon: string; color: string }> = {
  instagram:      { name: "Instagram",       icon: "📸", color: "#e1306c" },
  linkedin:       { name: "LinkedIn",        icon: "💼", color: "#0a66c2" },
  reels:          { name: "Instagram Reels", icon: "🎬", color: "#833ab4" },
  youtube_shorts: { name: "YouTube Shorts",  icon: "▶️", color: "#ff0000" },
};

const LOADING_LABELS: Record<Platform, string> = {
  instagram:      "Finding your hook...",
  linkedin:       "Crafting the insight...",
  reels:          "Mapping your reel...",
  youtube_shorts: "Writing your Short...",
};

// ── Content renderers ──────────────────────────────────────────────────────────

function InstagramContent({ content }: { content: string }) {
  // Strip any markdown bold (**text**), headings (# text), or label prefixes (Caption:, Post:)
  const cleaned = content
    .replace(/\*\*(.+?)\*\*/g, "$1")          // **bold** → plain
    .replace(/^#{1,3}\s+/gm, "")              // # Heading → plain
    .replace(/^(caption|post|instagram):\s*/im, "")  // "Caption: " prefix
    .trim();

  const lines = cleaned.split("\n");
  const hashtagLineIndex = lines.findIndex((l) => /^#\w/.test(l.trim()));
  const body = hashtagLineIndex === -1 ? cleaned : lines.slice(0, hashtagLineIndex).join("\n").trim();
  const hashtags = hashtagLineIndex === -1 ? "" : lines.slice(hashtagLineIndex).join(" ").trim();
  const bodyLines = body.split("\n");
  const hook = bodyLines[0];
  const rest = bodyLines.slice(1).join("\n").trim();

  return (
    <div>
      <p style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.5, color: "var(--text)", margin: "0 0 10px" }}>
        {hook}
      </p>
      {rest && (
        <p style={{ fontSize: 14, lineHeight: 1.75, color: "var(--text-2)", margin: "0 0 12px", whiteSpace: "pre-wrap" }}>
          {rest}
        </p>
      )}
      {hashtags && (
        <>
          <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />
          <p style={{ fontSize: 13, color: "var(--text-3)", margin: 0, lineHeight: 1.6 }}>{hashtags}</p>
        </>
      )}
    </div>
  );
}

function LinkedInContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const hashtagLineIndex = lines.findIndex((l) => /^#\w/.test(l.trim()));
  const bodyLines = (hashtagLineIndex === -1 ? lines : lines.slice(0, hashtagLineIndex)).filter((l) => l.trim() !== "");
  const hashtags = hashtagLineIndex === -1 ? "" : lines.slice(hashtagLineIndex).join(" ").trim();

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {bodyLines.map((line, i) => (
          <p key={i} style={{
            margin: 0, fontSize: 14, lineHeight: 1.75, color: i === 0 ? "var(--text)" : "var(--text-2)",
            fontWeight: i === 0 ? 600 : 400,
          }}>
            {line}
          </p>
        ))}
      </div>
      {hashtags && (
        <p style={{ fontSize: 13, color: "var(--accent-text)", marginTop: 12, marginBottom: 0, lineHeight: 1.6 }}>
          {hashtags}
        </p>
      )}
    </div>
  );
}

function ReelsContent({ content }: { content: string }) {
  const sectionRegex = /(HOOK|STAKES|BUILD|WAIT WHAT|PAYOFF|EXIT):\s*/gi;
  const parts = content.split(sectionRegex).filter(Boolean);
  const sections: Array<{ label: string; text: string }> = [];
  for (let i = 0; i < parts.length - 1; i += 2) {
    sections.push({ label: parts[i].trim().toUpperCase(), text: parts[i + 1].trim() });
  }

  if (sections.length === 0) {
    return <p style={{ fontSize: 14, lineHeight: 1.75, color: "var(--text-2)", margin: 0 }}>{content}</p>;
  }

  const timings: Record<string, string> = {
    HOOK: "0–5s", STAKES: "5–15s", BUILD: "15–40s",
    "WAIT WHAT": "40–55s", PAYOFF: "55–75s", EXIT: "Exit",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {sections.map(({ label, text }, i) => (
        <div key={i} style={{
          display: "grid", gridTemplateColumns: "80px 1fr", gap: 12, alignItems: "start",
        }}>
          <div style={{ paddingTop: 2 }}>
            <span style={{
              display: "inline-block", fontSize: 10, fontWeight: 700,
              color: "var(--accent-text)", letterSpacing: "0.06em",
              textTransform: "uppercase", background: "var(--accent-subtle)",
              padding: "3px 8px", borderRadius: 99,
            }}>
              {label}
            </span>
            {timings[label] && (
              <span style={{ display: "block", fontSize: 10, color: "var(--text-4)", marginTop: 3, paddingLeft: 2 }}>
                {timings[label]}
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: "var(--text-2)" }}>{text}</p>
        </div>
      ))}
    </div>
  );
}

function YouTubeShortsContent({ content }: { content: string }) {
  const sectionRegex = /(HOOK|CORE|PAYOFF|CTA|HASHTAGS):\s*/gi;
  const parts = content.split(sectionRegex).filter(Boolean);
  const sections: Array<{ label: string; text: string }> = [];
  for (let i = 0; i < parts.length - 1; i += 2) {
    sections.push({ label: parts[i].trim().toUpperCase(), text: parts[i + 1].trim() });
  }

  if (sections.length === 0) {
    return <p style={{ fontSize: 14, lineHeight: 1.75, color: "var(--text-2)", margin: 0 }}>{content}</p>;
  }

  const timings: Record<string, string> = {
    HOOK: "0–5s", CORE: "5–45s", PAYOFF: "45–55s", CTA: "55–60s", HASHTAGS: "Tags",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {sections.map(({ label, text }, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 12, alignItems: "start" }}>
          <div style={{ paddingTop: 2 }}>
            <span style={{
              display: "inline-block", fontSize: 10, fontWeight: 700,
              color: "#ff0000", letterSpacing: "0.06em",
              textTransform: "uppercase", background: "rgba(255,0,0,0.08)",
              padding: "3px 8px", borderRadius: 99,
            }}>
              {label}
            </span>
            {timings[label] && (
              <span style={{ display: "block", fontSize: 10, color: "var(--text-4)", marginTop: 3, paddingLeft: 2 }}>
                {timings[label]}
              </span>
            )}
          </div>
          <p style={{
            margin: 0, fontSize: 14, lineHeight: 1.65,
            color: label === "HASHTAGS" ? "var(--accent-text)" : "var(--text-2)",
          }}>{text}</p>
        </div>
      ))}
    </div>
  );
}

function ShimmerSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="shimmer-line" style={{ height: 14, width: "88%", borderRadius: 6 }} />
      <div className="shimmer-line" style={{ height: 14, width: "72%", borderRadius: 6 }} />
      <div className="shimmer-line" style={{ height: 14, width: "80%", borderRadius: 6 }} />
      <div className="shimmer-line" style={{ height: 14, width: "60%", borderRadius: 6 }} />
    </div>
  );
}

interface PlatformCardProps {
  platform: Platform;
  state: CardState;
  onRegenerate: (platform: Platform) => void;
}

export function PlatformCard({ platform, state, onRegenerate }: PlatformCardProps) {
  const meta = PLATFORM_META[platform];

  const cardStyle: React.CSSProperties = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    overflow: "hidden",
    boxShadow: "var(--shadow-sm)",
    transition: "box-shadow var(--transition), transform var(--transition)",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid var(--border)",
    background: "var(--bg-subtle)",
  };

  const Header = ({ extra }: { extra?: string }) => (
    <div style={headerStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `${meta.color}18`,
          border: `1px solid ${meta.color}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16,
        }}>
          {meta.icon}
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>
          {meta.name}
        </span>
      </div>
      {extra && (
        <span style={{
          fontSize: 11, color: "var(--text-4)", fontWeight: 500,
          background: "var(--bg-hover)", padding: "3px 8px", borderRadius: 99,
        }}>
          {extra}
        </span>
      )}
    </div>
  );

  if (state.status === "loading") {
    return (
      <div style={{ ...cardStyle, animation: "pulse-glow 2s ease-in-out infinite" }}>
        <Header />
        <div style={{ padding: "20px" }}>
          <ShimmerSkeleton />
          <p style={{ fontSize: 12, color: "var(--text-4)", marginTop: 16, marginBottom: 0, fontStyle: "italic" }}>
            {LOADING_LABELS[platform]}
          </p>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div style={cardStyle}>
        <Header />
        <div style={{ padding: "20px" }}>
          <div style={{
            background: "var(--error-subtle)", border: "1px solid rgba(220,38,38,0.2)",
            borderRadius: "var(--radius-sm)", padding: "12px 14px", marginBottom: 14,
          }}>
            <p style={{ fontSize: 13, color: "var(--error)", margin: 0, lineHeight: 1.5 }}>{state.message}</p>
          </div>
          <button onClick={() => onRegenerate(platform)} style={{
            padding: "8px 16px", fontSize: 13, fontWeight: 500,
            borderRadius: "var(--radius-sm)", border: "1px solid var(--error)",
            background: "transparent", color: "var(--error)", cursor: "pointer",
            transition: "all var(--transition)",
          }}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (state.status === "success") {
    const charCount = state.content.length;
    const extra = `${charCount} chars`;

    return (
      <div style={cardStyle}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.boxShadow = "var(--shadow-md)";
          el.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.boxShadow = "var(--shadow-sm)";
          el.style.transform = "translateY(0)";
        }}
      >
        <Header extra={extra} />
        <div style={{ padding: "20px" }}>
          {platform === "instagram"      && <InstagramContent     content={state.content} />}
          {platform === "linkedin"       && <LinkedInContent      content={state.content} />}
          {platform === "reels"          && <ReelsContent         content={state.content} />}
          {platform === "youtube_shorts" && <YouTubeShortsContent content={state.content} />}
        </div>
        <div style={{
          display: "flex", gap: 8, alignItems: "center",
          padding: "12px 20px",
          borderTop: "1px solid var(--border)",
          background: "var(--bg-subtle)",
        }}>
          <CopyButton content={state.content} />
          <RegenerateButton platform={platform} onRegenerate={onRegenerate} />
        </div>
      </div>
    );
  }

  return null;
}
