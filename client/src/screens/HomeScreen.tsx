import React from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";

// ── Icons ──────────────────────────────────────────────────────────────────────
const ArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

// ── Reusable section label ─────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 500, letterSpacing: "0.14em",
      textTransform: "uppercase", color: "var(--text-3)",
      margin: "0 0 24px",
    }}>
      {children}
    </p>
  );
}

// ── Compare row ────────────────────────────────────────────────────────────────
function CompareRow({ left, right }: { left: string; right: string }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 1fr",
      borderBottom: "1px solid var(--border)",
      transition: "background var(--transition)",
    }}
      className="compare-row"
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "var(--bg-subtle)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
    >
      <div style={{ padding: "14px 24px", borderRight: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
            background: "var(--bg-hover)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, color: "var(--text-4)",
          }}>✕</span>
          <span style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.5 }}>{left}</span>
        </div>
      </div>
      <div style={{ padding: "14px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
            background: "rgba(20,184,166,0.15)",
            border: "1px solid rgba(20,184,166,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, color: "var(--accent)",
          }}>✓</span>
          <span style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5, fontWeight: 500 }}>{right}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export function HomeScreen() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", overflowX: "hidden" }}>
      <Navbar />

      {/* ── HERO ── */}
      <section style={{
        maxWidth: 1100, margin: "0 auto",
        padding: "72px 40px 80px",
        position: "relative", zIndex: 1,
      }}>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 280px",
          gap: 64, alignItems: "end",
        }} className="hero-grid">

          {/* Left — headline + sub + CTAs */}
          <div>
            <p className="fade-up" style={{
              animationDelay: "0ms",
              fontSize: 11, fontWeight: 500, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "var(--text-3)",
              margin: "0 0 24px",
            }}>
              For creators who want to go viral
            </p>

            <h1 className="fade-up" style={{
              animationDelay: "40ms",
              fontSize: "clamp(32px, 5vw, 64px)",
              fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.0,
              color: "var(--text)", margin: "0 0 28px",
            }}>
              You already have<br />
              <span style={{
                background: "linear-gradient(90deg, var(--accent) 0%, #818cf8 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                the idea.
              </span>
            </h1>

            <p className="fade-up" style={{
              animationDelay: "80ms",
              fontSize: 15, color: "var(--text-3)", lineHeight: 1.7,
              maxWidth: 440, margin: "0 0 36px", fontWeight: 400,
              letterSpacing: "-0.01em",
            }}>
              Validate it against real data, generate platform-native captions with live hashtag intelligence, and capture every idea before it disappears.
            </p>

            <div className="fade-up" style={{
              animationDelay: "100ms",
              display: "flex", gap: 10, flexWrap: "wrap",
            }}>
              <button
                onClick={() => navigate("/studio")}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "11px 24px", fontSize: 13, fontWeight: 600,
                  borderRadius: 99, border: "none",
                  background: "var(--text)", color: "var(--bg)",
                  cursor: "pointer", transition: "opacity var(--transition)",
                  letterSpacing: "-0.01em",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.8"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
              >
                Start now <ArrowRight />
              </button>
              <button
                onClick={() => navigate("/vault")}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "11px 20px", fontSize: 13, fontWeight: 500,
                  borderRadius: 99, border: "1px solid var(--border)",
                  background: "transparent", color: "var(--text-2)",
                  cursor: "pointer", transition: "all var(--transition)",
                  letterSpacing: "-0.01em",
                }}
                onMouseEnter={(e) => {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.borderColor = "var(--text-3)"; b.style.color = "var(--text)";
                }}
                onMouseLeave={(e) => {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.borderColor = "var(--border)"; b.style.color = "var(--text-2)";
                }}
              >
                View vault
              </button>
            </div>
          </div>

          {/* Right — vertical stats */}
          <div className="fade-up" style={{
            animationDelay: "120ms",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}>
            {[
              { value: "3×", label: "Hooks per idea" },
              { value: "4", label: "Platforms at once" },
              { value: "Live", label: "Real-time hashtag data" },
              { value: "<1min", label: "Generation time" },
            ].map((stat, i, arr) => (
              <div key={stat.label} style={{
                padding: "14px 20px",
                borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <p style={{
                  fontSize: 22, fontWeight: 800, letterSpacing: "-0.04em",
                  margin: 0, flexShrink: 0,
                  background: "linear-gradient(90deg, var(--accent), #818cf8)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0, lineHeight: 1.4 }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div style={{ borderTop: "1px solid var(--border)", position: "relative", zIndex: 1 }} />

      {/* ── HOW IT WORKS ── */}
      <section style={{
        maxWidth: 1100, margin: "0 auto",
        padding: "64px 40px",
        position: "relative", zIndex: 1,
      }}>
        <Label>The workflow</Label>
        <h2 style={{
          fontSize: "clamp(24px, 3.5vw, 44px)",
          fontWeight: 800, letterSpacing: "-0.04em",
          lineHeight: 1.1, color: "var(--text)",
          margin: "0 0 48px", maxWidth: 500,
        }}>
          From random thought to viral post.
        </h2>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(5, 1fr)",
          gap: 0, borderLeft: "1px solid var(--border)",
        }} className="steps-grid">
          {[
            { num: "01", title: "Capture", body: "Drop any idea into the Vault the moment it hits. Type, speak, or paste. AI scores and tags it instantly." },
            { num: "02", title: "Validate", body: "Open it in Studio. Check it against real YouTube data — opportunity score, trend direction, competition, untapped angles." },
            { num: "03", title: "Plan the script", body: "Go to Develop. Pick from 3 hook variants built on psychological triggers. A full script with beats and timestamps is built around your choice." },
            { num: "04", title: "Generate captions", body: "Hit Amplify. Platform-native captions for Instagram, LinkedIn, Reels, and YouTube Shorts — with trending hashtags — in under a minute." },
            { num: "05", title: "Post it.", body: "Copy, paste, post. Your vault and conversation history are always there when the next idea hits." },
          ].map((step) => (
            <div key={step.num} style={{
              padding: "24px 24px 28px",
              borderRight: "1px solid var(--border)",
            }}>
              <p style={{
                fontSize: 11, fontWeight: 500, letterSpacing: "0.1em",
                color: "var(--text-4)", margin: "0 0 14px",
              }}>
                {step.num}
              </p>
              <p style={{
                fontSize: 14, fontWeight: 700, color: "var(--text)",
                margin: "0 0 8px", letterSpacing: "-0.02em",
              }}>
                {step.title}
              </p>
              <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.7, margin: 0 }}>
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div style={{ borderTop: "1px solid var(--border)", position: "relative", zIndex: 1 }} />

      {/* ── USE CASES ── */}
      <section style={{
        maxWidth: 1100, margin: "0 auto",
        padding: "64px 40px",
        position: "relative", zIndex: 1,
      }}>
        <Label>Built for every creator</Label>
        <h2 style={{
          fontSize: "clamp(24px, 3.5vw, 44px)",
          fontWeight: 800, letterSpacing: "-0.04em",
          lineHeight: 1.1, color: "var(--text)",
          margin: "0 0 48px", maxWidth: 560,
        }}>
          Whatever your niche, the workflow is the same.
        </h2>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: 1,
          background: "var(--border)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          overflow: "hidden",
        }} className="usecases-grid">
          {[
            {
              niche: "Tech & AI",
              idea: "Weekly AI news roundup — biggest stories this week in artificial intelligence",
              stats: [
                { label: "Opportunity", value: "85", unit: "/100" },
                { label: "Videos found", value: "2,400+", unit: "" },
              ],
              output: "Hook: \"This week in AI changed everything — here's what you actually need to know.\"",
              signal: "#14b8a6",
            },
            {
              niche: "Travel",
              idea: "Hidden waterfalls in Bali that tourists completely miss",
              stats: [
                { label: "Top video", value: "2.4M", unit: "views" },
                { label: "Untapped angles", value: "3", unit: "found" },
              ],
              output: "Sunrise-only access spots nobody is filming. Content blueprint ready in 40 seconds.",
              signal: "#818cf8",
            },
            {
              niche: "Fitness",
              idea: "Why most people never see results from the gym despite going consistently",
              stats: [
                { label: "Trend", value: "Rising", unit: "" },
                { label: "Audience fit", value: "82", unit: "/100" },
              ],
              output: "Identity threat hook outperforms in this niche. 3 variants generated.",
              signal: "#34d399",
            },
            {
              niche: "Business",
              idea: "I quit my 9-5 six months ago — here's what my bank account actually looks like",
              stats: [
                { label: "Verdict", value: "Strong", unit: "opportunity" },
                { label: "Competition", value: "Medium", unit: "" },
              ],
              output: "Competitor gap: everyone shows success, nobody shows the real numbers.",
              signal: "#f59e0b",
            },
            {
              niche: "Food",
              idea: "The one ingredient that makes restaurant-quality pasta at home",
              stats: [
                { label: "Avg top 5", value: "800K", unit: "views" },
                { label: "Best time", value: "Sun 6–9pm", unit: "" },
              ],
              output: "Captions with trending hashtags generated for 4 platforms in under a minute.",
              signal: "#f472b6",
            },
            {
              niche: "Gaming",
              idea: "This obscure mechanic in Elden Ring that 99% of players never discover",
              stats: [
                { label: "Top video", value: "1.2M", unit: "views" },
                { label: "Best hook", value: "Curiosity Gap", unit: "" },
              ],
              output: "Script built around the reveal moment for maximum retention.",
              signal: "#818cf8",
            },
          ].map((card) => (
            <div
              key={card.niche}
              style={{
                background: "var(--bg-card)",
                padding: "22px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {/* Niche label */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: card.signal, flexShrink: 0,
                }} />
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
                  textTransform: "uppercase", color: "var(--text-3)",
                }}>
                  {card.niche}
                </span>
              </div>

              {/* Idea — the input */}
              <p style={{
                fontSize: 13, color: "var(--text)", lineHeight: 1.65,
                margin: 0, fontWeight: 500, letterSpacing: "-0.01em",
              }}>
                "{card.idea}"
              </p>

              {/* Stats row — the signal */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr",
                gap: 1, background: "var(--border)",
                borderRadius: 6, overflow: "hidden",
              }}>
                {card.stats.map((s) => (
                  <div key={s.label} style={{
                    padding: "10px 12px",
                    background: "var(--bg-subtle)",
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 4 }}>
                      {s.label}
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: card.signal, letterSpacing: "-0.03em" }}>
                        {s.value}
                      </span>
                      {s.unit && (
                        <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 500 }}>
                          {s.unit}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Output — what Hookd produced */}
              <p style={{
                fontSize: 12, color: "var(--text-2)", lineHeight: 1.65,
                margin: 0,
                paddingLeft: 10,
                borderLeft: `2px solid ${card.signal}40`,
              }}>
                {card.output}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div style={{ borderTop: "1px solid var(--border)", position: "relative", zIndex: 1 }} />

      {/* ── VS SECTION ── */}
      <section style={{
        maxWidth: 1100, margin: "0 auto",
        padding: "64px 40px",
        position: "relative", zIndex: 1,
      }}>
        <Label>Why this works better</Label>
        <h2 style={{
          fontSize: "clamp(24px, 3.5vw, 44px)",
          fontWeight: 800, letterSpacing: "-0.04em",
          lineHeight: 1.1, color: "var(--text)",
          margin: "0 0 48px", maxWidth: 600,
        }}>
          A blank prompt gets you a blank result.
        </h2>

        {/* Table */}
        <div style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}>
        {/* Column headers */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          borderBottom: "1px solid var(--border)",
          borderTop: "1px solid var(--border)",
          paddingBottom: 12, paddingTop: 12, marginBottom: 0,
          background: "var(--bg-subtle)",
          borderRadius: "var(--radius-md) var(--radius-md) 0 0",
        }} className="compare-row">
          <div style={{ paddingRight: 0, borderRight: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, padding: "12px 24px" }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "var(--text-4)", display: "inline-block", flexShrink: 0,
            }} />
            <p style={{
              fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "var(--text-4)", margin: 0,
            }}>
              Generic AI prompt
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 24px" }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "var(--accent)", display: "inline-block", flexShrink: 0,
            }} />
            <p style={{
              fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "var(--accent-text)", margin: 0,
            }}>
              Hookd
            </p>
          </div>
        </div>

        <CompareRow left="Writes about a topic, not your idea" right="Builds from your specific idea and niche profile" />
        <CompareRow left="One output — no angles, no choice" right="3 hook variants with named psychological triggers" />
        <CompareRow left="Sounds the same on every platform" right="Platform-native captions with real Instagram hashtag data" />
        <CompareRow left="Forgets everything after the chat" right="Conversation history saved — pick up any session" />
        <CompareRow left="No idea validation, just guesswork" right="Validates your idea against real YouTube trend data before you film" />
        <CompareRow left="You still have to figure out what to cover" right="Content blueprint tells you exactly what to cover and how" />
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: "1px solid var(--border)",
        position: "relative", zIndex: 1,
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          padding: "36px 40px 32px",
          display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", gap: 40,
          flexWrap: "wrap",
        }}>
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{
                width: 26, height: 26, borderRadius: 7,
                background: "linear-gradient(135deg, var(--accent), #6366f1)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                </svg>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
                Hookd
              </span>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-4)", margin: 0, maxWidth: 260, lineHeight: 1.6 }}>
              Turn raw ideas into content that actually gets seen.
            </p>
          </div>

          {/* Links */}
          <div style={{ display: "flex", gap: 48 }}>
            <div>
              <p style={{
                fontSize: 10, fontWeight: 600, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "var(--text-4)", margin: "0 0 14px",
              }}>
                Product
              </p>
              {[
                { label: "Amplify", path: "/amplify" },
                { label: "Studio", path: "/studio" },
                { label: "Develop", path: "/develop" },
                { label: "Vault", path: "/vault" },
              ].map(({ label, path }) => (
                <a key={label} href={path} style={{
                  display: "block", fontSize: 13, color: "var(--text-3)",
                  textDecoration: "none", marginBottom: 8,
                  transition: "color var(--transition)",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--text)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-3)"; }}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          padding: "20px 40px",
          borderTop: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 12,
        }}>
          <p style={{ fontSize: 12, color: "var(--text-4)", margin: 0 }}>
            © {new Date().getFullYear()} Hookd. All rights reserved.
          </p>
          <p style={{ fontSize: 12, color: "var(--text-4)", margin: 0 }}>
            Powered by Groq · Llama 3.3 70B
          </p>
        </div>
      </footer>

      {/* Responsive */}
      <style>{`
        @media (max-width: 860px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
          }
          .features-two-col {
            grid-template-columns: 1fr !important;
            gap: 48px !important;
          }
          .steps-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .stats-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .usecases-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 600px) {
          .steps-grid {
            grid-template-columns: 1fr !important;
          }
          .compare-row {
            grid-template-columns: 1fr !important;
          }
          .usecases-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
