import React, { useState } from "react";
import { CharacterCounter } from "../components/CharacterCounter";
import { fetchTranscript } from "../api/transcript";
import { Navbar } from "../components/Navbar";

interface InputScreenProps {
  value: string;
  onChange: (v: string) => void;
  onGenerate: () => void;
}

const FITNESS_SAMPLE = `Intermittent fasting changed how I think about food entirely. I used to eat six small meals a day because every fitness magazine told me that was the key to a fast metabolism. Turns out, that advice was mostly marketing. When I switched to a 16:8 eating window — eating between noon and 8pm — something unexpected happened. My energy stabilized. The mid-afternoon crash I had accepted as normal just disappeared. The science behind it is straightforward: when you fast, insulin levels drop, and your body shifts from burning glucose to burning stored fat. Your cells also trigger autophagy, a kind of internal cleanup process that removes damaged proteins. I'm not saying fasting is for everyone. If you have a history of disordered eating, it's not the right tool. But if you're someone who eats out of habit rather than hunger, giving yourself a defined eating window can be genuinely clarifying. You start to notice what actual hunger feels like.`;

const FINANCE_SAMPLE = `Compound interest is the closest thing to a financial superpower that most people ignore until it's too late. Here's the uncomfortable truth: a 25-year-old who invests $300 a month and stops at 35 will end up with more money at 65 than a 35-year-old who invests $300 a month all the way until retirement. That's not intuition — that's math. The early investor gave their money an extra decade to compound. The difference isn't the amount invested; it's time in the market. Most people treat investing like something they'll start once they feel financially stable. But financial stability is often the result of investing early, not a prerequisite for it. Even $50 a month in a low-cost index fund at 22 beats $500 a month starting at 40. The variable that matters most is the one you can't buy back: time. Start boring, start small, start now.`;

function wordCount(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

type InputMode = "text" | "url";

const YoutubeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const SparkleIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
  </svg>
);

export function InputScreen({ value, onChange, onGenerate }: InputScreenProps) {
  const [mode, setMode] = useState<InputMode>("url");
  const [urlInput, setUrlInput] = useState("");
  const [fetchingTranscript, setFetchingTranscript] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [focused, setFocused] = useState(false);

  const count = wordCount(value);
  const isValid = count >= 100;
  const showValidation = attempted && !isValid && mode === "text";

  async function handleFetchTranscript() {
    if (!urlInput.trim()) return;
    setFetchingTranscript(true);
    setFetchError("");
    try {
      const transcript = await fetchTranscript(urlInput.trim());
      onChange(transcript);
      setMode("text");
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to fetch transcript");
    } finally {
      setFetchingTranscript(false);
    }
  }

  function handleGenerate() {
    if (!isValid) { setAttempted(true); } else { onGenerate(); }
  }

  const platforms = [
    { icon: "▶️", label: "YouTube Shorts" },
    { icon: "📸", label: "Instagram" },
    { icon: "💼", label: "LinkedIn" },
    { icon: "🎬", label: "Reels" },
  ];

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

      {/* Hero */}
      <div style={{
        maxWidth: 720, margin: "0 auto", padding: "80px 24px 60px",
        textAlign: "center", position: "relative", zIndex: 1,
      }}>

        {/* Badge */}
        <div className="fade-up" style={{
          animationDelay: "0ms",
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 14px", borderRadius: 99,
          background: "var(--accent-subtle)", border: "1px solid rgba(13,148,136,0.2)",
          fontSize: 11, fontWeight: 700, color: "var(--accent-text)",
          letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 28,
        }}>
          <SparkleIcon /> Your content engine
        </div>

        {/* Headline */}
        <h1 className="fade-up" style={{
          animationDelay: "60ms",
          fontSize: "clamp(38px, 6vw, 64px)",
          fontWeight: 700, lineHeight: 1.08,
          letterSpacing: "-0.03em", color: "var(--text)",
          margin: "0 0 18px",
        }}>
          One idea.{" "}
          <span className="gradient-text">Every platform.</span>
        </h1>

        {/* Subtext */}
        <p className="fade-up" style={{
          animationDelay: "120ms",
          fontSize: 17, color: "var(--text-2)", lineHeight: 1.65,
          maxWidth: 520, margin: "0 auto 36px",
        }}>
          Drop a YouTube video, blog post, or transcript. Hookd breaks it down into platform-native content for every channel — so one piece of thinking becomes a full week of posts, scripts, and captions.
        </p>

        {/* Platform pills */}
        <div className="fade-up" style={{
          animationDelay: "180ms",
          display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 16,
        }}>
          {platforms.map((p) => (
            <div key={p.label} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: 99,
              background: "var(--bg-card)", border: "1px solid var(--border)",
              fontSize: 13, color: "var(--text-2)", boxShadow: "var(--shadow-sm)",
            }}>
              <span style={{ fontSize: 14 }}>{p.icon}</span> {p.label}
            </div>
          ))}
        </div>

        {/* Value statement */}
        <p className="fade-up" style={{
          animationDelay: "200ms",
          fontSize: 13, color: "var(--text-3)", marginBottom: 44,
          lineHeight: 1.6,
        }}>
          Each platform gets content written the way its audience actually reads it —<br />
          not the same post copy-pasted four times.
        </p>

        {/* Input card */}
        <div className="fade-up scale-in" style={{
          animationDelay: "240ms",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-xl)",
          padding: "24px",
          boxShadow: "var(--shadow-lg)",
          textAlign: "left",
        }}>

          {/* Tabs */}
          <div style={{
            display: "flex", gap: 4, marginBottom: 20,
            background: "var(--bg-subtle)", borderRadius: "var(--radius-sm)", padding: 4,
          }}>
            {(["url", "text"] as InputMode[]).map((m) => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: "8px 16px", fontSize: 13, fontWeight: 500,
                borderRadius: 6, border: "none", cursor: "pointer",
                background: mode === m ? "var(--bg-card)" : "transparent",
                color: mode === m ? "var(--text)" : "var(--text-3)",
                boxShadow: mode === m ? "var(--shadow-sm)" : "none",
                transition: "all var(--transition)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                {m === "text" && <span style={{fontSize:13}}>📝</span>}
                {m === "url" ? "YouTube URL" : "Paste text"}
              </button>
            ))}
          </div>

          {/* URL mode */}
          {mode === "url" && (
            <div>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => { setUrlInput(e.target.value); setFetchError(""); }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  onKeyDown={(e) => { if (e.key === "Enter") handleFetchTranscript(); }}
                  style={{
                    flex: 1, padding: "12px 16px", fontSize: 14,
                    color: "var(--text)", background: "var(--bg-input)",
                    border: `1.5px solid ${fetchError ? "var(--error)" : "var(--border)"}`,
                    borderRadius: "var(--radius-sm)", outline: "none",
                    transition: "border-color var(--transition)",
                  }}
                  onFocus={(e) => { if (!fetchError) e.target.style.borderColor = "var(--accent)"; }}
                  onBlur={(e) => { if (!fetchError) e.target.style.borderColor = "var(--border)"; }}
                />
                <button
                  onClick={handleFetchTranscript}
                  disabled={fetchingTranscript || !urlInput.trim()}
                  style={{
                    padding: "12px 20px", fontSize: 14, fontWeight: 600, color: "#fff",
                    background: fetchingTranscript || !urlInput.trim() ? "var(--text-4)" : "var(--accent)",
                    border: "none", borderRadius: "var(--radius-sm)",
                    cursor: fetchingTranscript || !urlInput.trim() ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap", transition: "background var(--transition)",
                  }}
                >
                  {fetchingTranscript ? "Fetching..." : "Get transcript"}
                </button>
              </div>
              {fetchError && <p style={{ fontSize: 13, color: "var(--error)", marginTop: 8 }}>{fetchError}</p>}
              <p style={{ fontSize: 12, color: "var(--text-4)", marginTop: 8 }}>
                Video must have captions enabled. Transcript loads into the editor automatically.
              </p>
            </div>
          )}

          {/* Text mode */}
          {mode === "text" && (
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--text-4)" }}>Try a sample:</span>
                {[{ label: "Fitness", text: FITNESS_SAMPLE }, { label: "Finance", text: FINANCE_SAMPLE }].map((chip) => (
                  <button key={chip.label} onClick={() => onChange(chip.text)} style={{
                    padding: "4px 12px", fontSize: 12, fontWeight: 500,
                    borderRadius: 99, border: "1px solid var(--border)",
                    background: "var(--bg-subtle)", color: "var(--text-2)",
                    cursor: "pointer", transition: "all var(--transition)",
                  }}
                  onMouseEnter={(e) => {
                    const b = e.currentTarget as HTMLButtonElement;
                    b.style.borderColor = "var(--accent)"; b.style.color = "var(--accent-text)"; b.style.background = "var(--accent-subtle)";
                  }}
                  onMouseLeave={(e) => {
                    const b = e.currentTarget as HTMLButtonElement;
                    b.style.borderColor = "var(--border)"; b.style.color = "var(--text-2)"; b.style.background = "var(--bg-subtle)";
                  }}>
                    {chip.label} →
                  </button>
                ))}
              </div>

              <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Paste a YouTube transcript, podcast script, blog post, or any long-form content..."
                style={{
                  display: "block", width: "100%", minHeight: 200,
                  padding: "16px 18px", fontSize: 14, lineHeight: 1.7,
                  color: "var(--text)", background: "var(--bg-input)",
                  border: `1.5px solid ${focused ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: "var(--radius-md)", resize: "vertical",
                  boxSizing: "border-box", outline: "none",
                  transition: "border-color var(--transition)",
                }}
              />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <CharacterCounter value={value} />
                {showValidation && (
                  <span style={{ fontSize: 12, color: "var(--error)" }}>
                    Paste a bit more — we need something to work with
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Generate button */}
          {(mode === "text" || (mode === "url" && value.trim())) && (
            <button
              onClick={handleGenerate}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                width: "100%", marginTop: 16, padding: "14px 24px",
                fontSize: 15, fontWeight: 600, color: "#fff",
                background: isValid
                  ? "linear-gradient(135deg, var(--accent) 0%, #0891b2 100%)"
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
              Turn this into content
            </button>
          )}
        </div>

        {/* Social proof */}
        <p className="fade-up" style={{
          animationDelay: "300ms",
          fontSize: 13, color: "var(--text-4)", marginTop: 20,
        }}>
          Works with YouTube videos, podcasts, blog posts, or any long-form content · Free to use
        </p>
      </div>
    </div>
  );
}
