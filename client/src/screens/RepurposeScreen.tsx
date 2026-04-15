import { useState } from "react";
import { Navbar } from "../components/Navbar";
import type { Platform } from "../types/index";

interface RepurposeScreenProps {
  value: string;
  onChange: (v: string) => void;
  selectedPlatforms: Platform[];
  onPlatformsChange: (platforms: Platform[]) => void;
  onGenerate: () => void;
}

// ── Platform config ────────────────────────────────────────────────────────────
const PLATFORM_OPTIONS: {
  id: Platform;
  name: string;
  icon: string;
  color: string;
  description: string;
  outputType: string;
}[] = [
  {
    id: "instagram",
    name: "Instagram",
    icon: "📸",
    color: "#e1306c",
    description: "Caption + hashtags",
    outputType: "Caption",
  },
  {
    id: "reels",
    name: "Instagram Reels",
    icon: "🎬",
    color: "#833ab4",
    description: "Spoken script with beat map",
    outputType: "Script",
  },
  {
    id: "youtube_shorts",
    name: "YouTube Shorts",
    icon: "▶️",
    color: "#ff0000",
    description: "60s spoken script",
    outputType: "Script",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: "💼",
    color: "#0a66c2",
    description: "Professional post",
    outputType: "Post",
  },
];

// ── Sample ideas ───────────────────────────────────────────────────────────────
const SAMPLES = [
  {
    label: "Fitness",
    text: "Most people think working out more is the answer. I used to train 6 days a week and barely changed. Then I cut to 3 days, added more protein, and actually slept 8 hours. In 3 months I made more progress than the previous year. The gym isn't the problem. Recovery is.",
  },
  {
    label: "Finance",
    text: "I started investing at 22 with ₹2000 a month. Everyone told me it was too small to matter. 5 years later that habit is worth more than the people who waited to 'have enough money' to start. The amount doesn't matter at the start. The habit does.",
  },
  {
    label: "Creator",
    text: "I posted consistently for 6 months and got nowhere. Then I stopped posting for 2 weeks to actually study what was working in my niche. Came back with one video that hit 100k views. Volume isn't the strategy. Understanding your audience is.",
  },
];

const SparkleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
  </svg>
);

const CheckIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export function RepurposeScreen({
  value,
  onChange,
  selectedPlatforms,
  onPlatformsChange,
  onGenerate,
}: RepurposeScreenProps) {
  const [focused, setFocused] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const wordCount = value.trim() === "" ? 0 : value.trim().split(/\s+/).length;
  const isTextValid = wordCount >= 20;
  const isPlatformsValid = selectedPlatforms.length > 0;
  const isValid = isTextValid && isPlatformsValid;

  const showTextError = attempted && !isTextValid;
  const showPlatformError = attempted && !isPlatformsValid;

  function togglePlatform(id: Platform) {
    if (selectedPlatforms.includes(id)) {
      // Don't allow deselecting the last one
      if (selectedPlatforms.length === 1) return;
      onPlatformsChange(selectedPlatforms.filter((p) => p !== id));
    } else {
      onPlatformsChange([...selectedPlatforms, id]);
    }
  }

  function handleGenerate() {
    if (!isValid) {
      setAttempted(true);
    } else {
      onGenerate();
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", position: "relative", overflow: "hidden" }}>
      {/* Background glows */}
      <div style={{
        position: "fixed", top: -200, right: -200, width: 600, height: 600,
        background: "radial-gradient(circle, rgba(13,148,136,0.07) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "fixed", bottom: -100, left: -100, width: 400, height: 400,
        background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      <Navbar />

      {/* Page header */}
      <div style={{
        maxWidth: 760, margin: "0 auto",
        padding: "52px 24px 36px",
        position: "relative", zIndex: 1,
        textAlign: "center",
      }}>
        <p style={{
          fontSize: 11, fontWeight: 600, letterSpacing: "0.14em",
          textTransform: "uppercase", color: "var(--text-3)", margin: "0 0 16px",
        }}>
          Content Amplifier
        </p>
        <h1 style={{
          fontSize: "clamp(26px, 4vw, 44px)", fontWeight: 800,
          letterSpacing: "-0.04em", color: "var(--text)", margin: "0 0 14px",
          lineHeight: 1.05,
        }}>
          Your idea.{" "}
          <span style={{
            background: "linear-gradient(135deg, var(--accent), #6366f1)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Every platform.
          </span>
        </h1>
        <p style={{
          fontSize: 15, color: "var(--text-3)", margin: 0,
          lineHeight: 1.65, maxWidth: 520, marginLeft: "auto", marginRight: "auto",
        }}>
          Write your idea, thought, or rough text. Pick your platforms. Get platform-native content — scripts, captions, posts — optimised for each one.
        </p>
      </div>

      {/* Main card */}
      <div style={{
        maxWidth: 760, margin: "0 auto", padding: "0 24px 80px",
        position: "relative", zIndex: 1,
      }}>
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-xl)",
          overflow: "hidden",
          boxShadow: "var(--shadow-lg)",
        }}>

          {/* ── Section 1: Text input ── */}
          <div style={{ padding: "24px 24px 20px", borderBottom: "1px solid var(--border)" }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  background: "linear-gradient(135deg, var(--accent), #5b5ef4)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: "#fff",
                }}>1</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                  Your idea or text
                </span>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--text-4)" }}>Try:</span>
                {SAMPLES.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => onChange(s.text)}
                    style={{
                      padding: "3px 10px", fontSize: 12, fontWeight: 500,
                      borderRadius: 99, border: "1px solid var(--border)",
                      background: "var(--bg-subtle)", color: "var(--text-3)",
                      cursor: "pointer", transition: "all var(--transition)",
                    }}
                    onMouseEnter={(e) => {
                      const b = e.currentTarget as HTMLButtonElement;
                      b.style.borderColor = "var(--accent)";
                      b.style.color = "var(--accent-text)";
                      b.style.background = "var(--accent-subtle)";
                    }}
                    onMouseLeave={(e) => {
                      const b = e.currentTarget as HTMLButtonElement;
                      b.style.borderColor = "var(--border)";
                      b.style.color = "var(--text-3)";
                      b.style.background = "var(--bg-subtle)";
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Write your idea, thought, story, or rough text here. The more specific and personal, the better the output. E.g. 'Most people think consistency is about posting every day. I think it's about posting when you have something worth saying.'"
              style={{
                display: "block", width: "100%",
                minHeight: 160, maxHeight: 320,
                padding: "14px 16px", fontSize: 14, lineHeight: 1.75,
                color: "var(--text)", background: "var(--bg-input)",
                border: `1.5px solid ${showTextError ? "var(--error)" : focused ? "var(--accent)" : "var(--border)"}`,
                borderRadius: "var(--radius-md)", resize: "vertical",
                boxSizing: "border-box", outline: "none",
                transition: "border-color var(--transition)",
                fontFamily: "inherit",
              }}
            />

            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginTop: 8,
            }}>
              <span style={{
                fontSize: 12,
                color: wordCount === 0 ? "var(--text-4)" : wordCount < 20 ? "var(--error)" : "var(--text-3)",
              }}>
                {wordCount === 0 ? "Start typing…" : `${wordCount} words${wordCount < 20 ? " — add a bit more" : ""}`}
              </span>
              {showTextError && (
                <span style={{ fontSize: 12, color: "var(--error)" }}>
                  Write at least 20 words — give the AI something to work with
                </span>
              )}
            </div>
          </div>

          {/* ── Section 2: Platform picker ── */}
          <div style={{ padding: "20px 24px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <span style={{
                width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                background: "linear-gradient(135deg, var(--accent), #5b5ef4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, color: "#fff",
              }}>2</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                Choose platforms
              </span>
              <span style={{ fontSize: 12, color: "var(--text-4)", marginLeft: 4 }}>
                {selectedPlatforms.length} selected
              </span>
              {showPlatformError && (
                <span style={{ fontSize: 12, color: "var(--error)", marginLeft: "auto" }}>
                  Select at least one platform
                </span>
              )}
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 10,
            }} className="platform-grid">
              {PLATFORM_OPTIONS.map((platform) => {
                const selected = selectedPlatforms.includes(platform.id);
                return (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "14px 16px",
                      borderRadius: "var(--radius-md)",
                      border: selected
                        ? `1.5px solid ${platform.color}60`
                        : "1.5px solid var(--border)",
                      background: selected
                        ? `${platform.color}0d`
                        : "var(--bg-subtle)",
                      cursor: "pointer",
                      transition: "all var(--transition)",
                      textAlign: "left",
                      position: "relative",
                    }}
                    onMouseEnter={(e) => {
                      if (!selected) {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = `${platform.color}50`;
                        (e.currentTarget as HTMLButtonElement).style.background = `${platform.color}08`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selected) {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                        (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-subtle)";
                      }
                    }}
                  >
                    {/* Platform icon */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: `${platform.color}18`,
                      border: `1px solid ${platform.color}30`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18,
                    }}>
                      {platform.icon}
                    </div>

                    {/* Platform info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 13, fontWeight: 600, color: "var(--text)",
                        margin: "0 0 2px", letterSpacing: "-0.01em",
                      }}>
                        {platform.name}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--text-4)", margin: 0 }}>
                        {platform.description}
                      </p>
                    </div>

                    {/* Output type badge */}
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: "2px 7px",
                      borderRadius: 99, letterSpacing: "0.04em",
                      background: selected ? `${platform.color}20` : "var(--bg-hover)",
                      color: selected ? platform.color : "var(--text-4)",
                      border: `1px solid ${selected ? platform.color + "40" : "transparent"}`,
                      flexShrink: 0,
                    }}>
                      {platform.outputType}
                    </span>

                    {/* Checkmark */}
                    <div style={{
                      position: "absolute", top: 10, right: 10,
                      width: 18, height: 18, borderRadius: "50%",
                      background: selected ? platform.color : "transparent",
                      border: selected ? "none" : "1.5px solid var(--border)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all var(--transition)",
                      color: "#fff",
                    }}>
                      {selected && <CheckIcon />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                width: "100%", marginTop: 20, padding: "15px 24px",
                fontSize: 15, fontWeight: 700, color: "#fff",
                background: isValid
                  ? "linear-gradient(135deg, var(--accent) 0%, #6366f1 100%)"
                  : "var(--text-4)",
                border: "none", borderRadius: "var(--radius-md)",
                cursor: isValid ? "pointer" : "not-allowed",
                transition: "all var(--transition)",
                boxShadow: isValid ? "0 4px 20px rgba(13,148,136,0.3)" : "none",
                letterSpacing: "-0.01em",
              }}
              onMouseEnter={(e) => {
                if (isValid) {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.transform = "translateY(-1px)";
                  b.style.boxShadow = "0 6px 28px rgba(13,148,136,0.4)";
                }
              }}
              onMouseLeave={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.transform = "translateY(0)";
                b.style.boxShadow = isValid ? "0 4px 20px rgba(13,148,136,0.3)" : "none";
              }}
            >
              <SparkleIcon />
              Generate {selectedPlatforms.length > 0 ? `${selectedPlatforms.length} platform${selectedPlatforms.length > 1 ? "s" : ""}` : "content"}
            </button>

            <p style={{
              fontSize: 12, color: "var(--text-4)", textAlign: "center",
              marginTop: 12, marginBottom: 0,
            }}>
              Each platform gets content written for how its audience actually reads — not the same post copy-pasted
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 560px) {
          .platform-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
