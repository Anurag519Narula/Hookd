import { useState } from "react";
import { motion } from "framer-motion";
import {
  InstagramLogo,
  Lightning, Copy, Check,
  Hash, TextAa, VideoCamera,
} from "@phosphor-icons/react";
import type { InstagramSignals } from "../api/insights";
import { Badge } from "./ui";

// ── Score label colors ────────────────────────────────────────────────────────

function labelColor(label: string): string {
  const l = label.toLowerCase();
  if (l === "high" || l === "strong") return "#059669";
  if (l === "medium" || l === "moderate") return "#d97706";
  return "#dc2626";
}

// ── Mini score ring ───────────────────────────────────────────────────────────

function MiniRing({ score, label, title }: { score: number; label: string; title: string }) {
  const size = 52;
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;
  const color = labelColor(label);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
      flex: 1, minWidth: 0,
    }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="var(--border)" strokeWidth={stroke}
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)" }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{
            fontSize: 13, fontWeight: 800, color,
            fontFamily: "var(--font-sans)", letterSpacing: "-0.03em",
          }}>{score}</span>
        </div>
      </div>
      <span style={{
        fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
        textTransform: "uppercase", color: "var(--text-4)",
        fontFamily: "var(--font-mono)", textAlign: "center",
        lineHeight: 1.2,
      }}>{title}</span>
      <Badge label={label} color={color} />
    </div>
  );
}

// ── Copyable hook item ────────────────────────────────────────────────────────

function CopyableHook({ text, index, onSelect }: {
  text: string; index: number; onSelect?: (hook: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "12px 14px",
      background: "var(--bg-subtle)",
      border: "1px solid var(--border)",
      borderRadius: 8,
      transition: "border-color 0.15s ease",
    }}
    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
    >
      <span style={{
        fontSize: 11, fontWeight: 700, color: "var(--accent)",
        fontFamily: "var(--font-mono)", flexShrink: 0, marginTop: 2,
      }}>{String(index + 1).padStart(2, "0")}</span>
      <p style={{
        flex: 1, fontSize: 14, color: "var(--text)", fontWeight: 500,
        lineHeight: 1.5, margin: 0, letterSpacing: "-0.005em",
      }}>{text}</p>
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        <button
          onClick={handleCopy}
          title="Copy hook"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 28, height: 28, borderRadius: 6,
            border: `1px solid ${copied ? "var(--accent)" : "var(--border)"}`,
            background: copied ? "rgba(5,150,105,0.06)" : "transparent",
            color: copied ? "var(--accent)" : "var(--text-4)",
            cursor: "pointer", transition: "all 0.15s ease",
          }}
        >
          {copied ? <Check size={13} weight="bold" /> : <Copy size={13} weight="bold" />}
        </button>
        {onSelect && (
          <button
            onClick={() => onSelect(text)}
            title="Use this hook in Script Planning"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 28, height: 28, borderRadius: 6,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text-4)",
              cursor: "pointer", transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.color = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--text-4)";
            }}
          >
            <Lightning size={13} weight="bold" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Copyable hashtag pack ─────────────────────────────────────────────────────

function HashtagPack({ tags }: { tags: string[] }) {
  const [copied, setCopied] = useState(false);

  function handleCopyAll() {
    navigator.clipboard.writeText(tags.join(" ")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Hash size={13} weight="bold" color="var(--text-4)" />
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "var(--text-4)",
            fontFamily: "var(--font-mono)",
          }}>Hashtag Pack</span>
        </div>
        <button
          onClick={handleCopyAll}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "4px 10px", fontSize: 11, fontWeight: 600,
            borderRadius: 5,
            border: `1px solid ${copied ? "var(--accent)" : "var(--border)"}`,
            background: copied ? "rgba(5,150,105,0.06)" : "transparent",
            color: copied ? "var(--accent)" : "var(--text-3)",
            cursor: "pointer", transition: "all 0.15s ease",
          }}
        >
          {copied ? <><Check size={11} weight="bold" /> Copied</> : <><Copy size={11} weight="bold" /> Copy All</>}
        </button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {tags.map((tag) => (
          <span key={tag} style={{
            display: "inline-block",
            padding: "4px 10px", fontSize: 12, fontWeight: 500,
            borderRadius: 5,
            background: "var(--bg-subtle)",
            border: "1px solid var(--border)",
            color: "var(--text-2)",
            cursor: "pointer",
            transition: "all 0.15s ease",
            letterSpacing: "-0.005em",
          }}
          onClick={() => {
            navigator.clipboard.writeText(tag);
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.color = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--text-2)";
          }}
          >{tag}</span>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface InstagramPlaybookProps {
  instagram: InstagramSignals;
  onSelectHook?: (hook: string) => void;
}

export function InstagramPlaybook({ instagram, onSelectHook }: InstagramPlaybookProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{
        padding: "16px 24px",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: "linear-gradient(135deg, rgba(131,58,180,0.08), rgba(253,29,29,0.08), rgba(252,176,69,0.08))",
          border: "1px solid rgba(131,58,180,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <InstagramLogo size={16} weight="bold" color="#c13584" />
        </div>
        <div style={{ flex: 1 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
            textTransform: "uppercase", color: "var(--text-4)",
            fontFamily: "var(--font-mono)",
          }}>Instagram Playbook</span>
        </div>
        <Badge label="Reels" color="#c13584" />
      </div>

      {/* Score rings row */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        gap: 8, padding: "20px 24px",
        borderBottom: "1px solid var(--border)",
      }}
      className="ig-playbook-scores"
      >
        <MiniRing
          score={instagram.reelPotential.score}
          label={instagram.reelPotential.label}
          title="Reel Potential"
        />
        <MiniRing
          score={instagram.hookStrength.score}
          label={instagram.hookStrength.label}
          title="Hook Strength"
        />
        <MiniRing
          score={instagram.saveability.score}
          label={instagram.saveability.label}
          title="Saveability"
        />
        <MiniRing
          score={instagram.saturation.score}
          label={instagram.saturation.label}
          title="Saturation"
        />
      </div>

      {/* Hooks section */}
      {instagram.hookIdeas.length > 0 && (
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6, marginBottom: 12,
          }}>
            <Lightning size={13} weight="bold" color="var(--accent)" />
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "var(--text-4)",
              fontFamily: "var(--font-mono)",
            }}>Scroll-Stopping Hooks</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {instagram.hookIdeas.map((hook, i) => (
              <CopyableHook
                key={i}
                text={hook}
                index={i}
                onSelect={onSelectHook}
              />
            ))}
          </div>
        </div>
      )}

      {/* Format + Caption Style row */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{
          padding: "16px 24px",
          borderRight: "1px solid var(--border)",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6, marginBottom: 8,
          }}>
            <VideoCamera size={13} weight="bold" color="var(--text-4)" />
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "var(--text-4)",
              fontFamily: "var(--font-mono)",
            }}>Best Format</span>
          </div>
          <span style={{
            fontSize: 15, fontWeight: 600, color: "var(--text)",
            letterSpacing: "-0.01em",
          }}>{instagram.bestFormat}</span>
        </div>
        <div style={{ padding: "16px 24px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6, marginBottom: 8,
          }}>
            <TextAa size={13} weight="bold" color="var(--text-4)" />
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "var(--text-4)",
              fontFamily: "var(--font-mono)",
            }}>Caption Style</span>
          </div>
          <span style={{
            fontSize: 15, fontWeight: 600, color: "var(--text)",
            letterSpacing: "-0.01em",
          }}>{instagram.captionStyle}</span>
        </div>
      </div>

      {/* Hashtag Pack */}
      <div style={{ padding: "20px 24px" }}>
        <HashtagPack tags={instagram.hashtagPack} />
      </div>
    </motion.div>
  );
}
