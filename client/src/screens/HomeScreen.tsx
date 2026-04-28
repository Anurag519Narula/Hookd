import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";

// ── Hook template pools for the showcase (subset from server hookTemplates) ───
const SHOWCASE_POOLS: { category: string; signal: string; pool: string[] }[] = [
  {
    category: "Educational",
    signal: "#14b8a6",
    pool: [
      "It took me 10 years to learn this but I'll teach it to you in less than 1 minute.",
      "If I woke up (pain point) tomorrow, and wanted to (dream result) by (time) here's exactly what I would do.",
      "Everyone tells you to (action) but nobody actually tells you how to do it. Here is a # second step by step tutorial.",
      "Here's exactly how much (action/item) you need to (result).",
      "If you're a (target audience) and you want (dream result) by (avenue) then listen to this video.",
      "Here are some slightly unethical (industry/niche) hacks that you should know if you're (target audience).",
      "I think I just found the biggest (niche/industry) cheat code.",
      "In 60 seconds I'm going to teach you more about (thing) than you have ever learned in your entire life.",
      "If I were starting over in my (age range) with no (item) here are the top # things I would do to (dream result).",
      "30 seconds of (industry) advice I give my best friend if he/she were starting from scratch.",
      "Here's how to develop a (skill) so strong that you physically can't stop (doing skill).",
      "If you're (age range) these are the # things you need to do so you don't end up (pain point) by (age).",
    ],
  },
  {
    category: "Storytelling",
    signal: "#818cf8",
    pool: [
      "I don't have a backup plan so this kind of needs to work.",
      "X days/months/years into my (action), my worst nightmare became my reality.",
      "This is probably the scariest thing I have ever done.",
      "I started my (business) when I was (age) with (amount).",
      "X years ago my (person) told me (quote).",
      "In (time), I went from (before state) to (after state).",
      "So I messed up.",
      "This is the story of how I managed to do (achievement).",
      "When I (action), people said (feedback).",
      "I got (dream result) without (pain point/points) here's how.",
      "It all started when (person) (action).",
      "I am leaving my (salary) dream job at (company) to (action).",
    ],
  },
  {
    category: "Myth Busting",
    signal: "#f59e0b",
    pool: [
      "They said, \"(famous cliché or quote)\" That's a lie.",
      "More (target audience) need to hear this, (common belief) will not (result).",
      "You are not bad at (action), you probably were just never taught how to (action).",
      "This is why doing (action) makes you (pain point).",
      "Let me de-influence you from (action).",
      "Stop using (item) for (result).",
      "Your life is boring because you don't (action).",
      "If you (action) like this, then you're doing it wrong.",
      "Don't make the mistake of (action), (action), (action).",
      "You're using your (noun) wrong and I am going to show you how to use it the right way.",
      "It's time to throw away your (item), you don't need it anymore.",
      "Just because you do (action) doesn't make you a good (label).",
    ],
  },
  {
    category: "Authority",
    signal: "#34d399",
    pool: [
      "My (before state) used to look like this and now they look like this.",
      "Nobody believes me if I say I went from this to this.",
      "Just # (item/action) took my client from (before) to (after).",
      "Over the past (time) I've grown my (thing) from (before) to (after).",
      "I went from this to this.",
      "I (dream result) in the past (time frame), here's proof.",
      "How to turn this into this in X simple steps.",
      "My customer/client got (dream result) without (pain point).",
      "I became a (achievement) at (age) and if I could give you X pieces of advice it would be…",
      "After (dream result) here is one thing I learned the hard way so you don't have to.",
      "10 YEARS it took me from (before state) to (after state).",
      "I am only (metric) but I have became one of the best (title) in the world.",
    ],
  },
  {
    category: "Comparison",
    signal: "#f472b6",
    pool: [
      "A lot of people ask me what's better (option #1) or (option #2) — I achieved (dream result) doing one of these and it's not even close.",
      "This is (noun) before you (action), this is (noun) after you (action).",
      "Cheap vs. Expensive (noun).",
      "This (noun) and this (noun) have the same amount of (noun).",
      "For this (item) you could have all of these (item).",
      "This group didn't (action) and this group did.",
      "Both these (noun) are exactly the same. But this one is (metric) and this one is (metric).",
      "Would you feel more (trait) in this (noun) or this one?",
      "This is what your (noun) looks like when you don't take (noun). And this is what it looks like when you do.",
      "This is me after (action) in the (location) with (condition). And this is me just (action).",
    ],
  },
  {
    category: "Day in the Life",
    signal: "#818cf8",
    pool: [
      "We all have the same 24 hours in a day so here I am putting my 24 hours to work.",
      "Day 1 of starting over my whole entire life.",
      "Come to work with me as a (title).",
      "Day in the life of a (adjective) person.",
      "Day # of turning from (before state) to (after state) and suddenly I don't want to be (after state) anymore.",
      "Day # trying to make (amount) by the end of the year, by (method).",
      "This is what an average day of a (title) looks like a week out from (event).",
      "Day in the life of a future millionaire.",
      "This is what my morning looks like while (situation).",
      "Come with me to earn $ per day, with (avenue).",
    ],
  },
];

const TEMPLATE_COUNTS: Record<string, string> = {
  Educational: "300+",
  Storytelling: "120+",
  "Myth Busting": "34+",
  Authority: "45+",
  Comparison: "30+",
  "Day in the Life": "18+",
};

function shuffleAndPick<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ── Icons ──────────────────────────────────────────────────────────────────────
const ArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

// ── Reusable section label ─────────────────────────────────────────────────────
function Label({ children, step }: { children: React.ReactNode; step?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 24px" }}>
      {step && (
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
          color: "var(--accent)",
          background: "var(--accent-subtle)",
          border: "1px solid rgba(20,184,166,0.1)",
          borderRadius: 4,
          padding: "2px 7px",
          flexShrink: 0,
        }}>
          {String(step).padStart(2, "0")}
        </span>
      )}
      <p style={{
        fontSize: 11, fontWeight: 500, letterSpacing: "0.14em",
        textTransform: "uppercase", color: "var(--text-3)",
        margin: 0,
      }}>
        {children}
      </p>
    </div>
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
            background: "rgba(20,184,166,0.08)",
            border: "1px solid rgba(20,184,166,0.12)",
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

  // Randomize showcase hooks on each page load
  const showcaseCards = useMemo(
    () => SHOWCASE_POOLS.map((cat) => ({
      category: cat.category,
      signal: cat.signal,
      hooks: shuffleAndPick(cat.pool, 3),
    })),
    []
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />

      {/* ── HERO ── */}
      <section style={{
        maxWidth: 1100, margin: "0 auto",
        padding: "96px 40px 96px",
        position: "relative", zIndex: 1,
        overflow: "hidden",
      }}>
        {/* Ambient glow — warm editorial atmosphere */}
        <div style={{
          position: "absolute", top: -120, right: -80,
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(162,126,90,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", top: -80, left: -120,
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(126,139,120,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
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
                color: "var(--accent)",
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
              { value: "6×", label: "Hooks per idea" },
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
                  fontSize: 22, fontWeight: 800,
                  margin: 0, flexShrink: 0,
                  color: "var(--accent)", letterSpacing: "-0.04em",
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

      {/* ── TRENDING HOOKS ── */}
      <section style={{
        maxWidth: 1100, margin: "0 auto",
        padding: "64px 40px",
        position: "relative", zIndex: 1,
      }}>
        <Label step={1}>Proven viral patterns</Label>
        <h2 style={{
          fontSize: "clamp(24px, 3.5vw, 44px)",
          fontWeight: 800, letterSpacing: "-0.04em",
          lineHeight: 1.1, color: "var(--text)",
          margin: "0 0 16px",
        }}>
          Hooks that actually stop the scroll.
        </h2>
        <p style={{
          fontSize: 15, color: "var(--text-3)", lineHeight: 1.7,
          margin: "0 0 40px",
        }}>
          Every hook Hookd generates is inspired by patterns from 1,000+ top-performing Reels and Shorts. Here's a taste.
        </p>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: 1,
          background: "var(--border)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          overflow: "hidden",
        }} className="hooks-showcase-grid">
          {showcaseCards.map((card) => (
            <div
              key={card.category}
              style={{
                background: "var(--bg-card)",
                padding: "22px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {/* Category label */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: card.signal, flexShrink: 0,
                }} />
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
                  textTransform: "uppercase", color: "var(--text-3)",
                }}>
                  {card.category}
                </span>
              </div>

              {/* Hook examples */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {card.hooks.map((hook, i) => (
                  <div key={i} style={{
                    fontSize: 13, color: i === 0 ? "var(--text)" : "var(--text-2)",
                    lineHeight: 1.6,
                    paddingLeft: 10,
                    borderLeft: `2px solid ${i === 0 ? card.signal : `${card.signal}30`}`,
                    fontWeight: i === 0 ? 500 : 400,
                  }}>
                    "{hook}"
                  </div>
                ))}
              </div>

              {/* Count badge */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                alignSelf: "flex-start",
                padding: "3px 8px", borderRadius: 4,
                background: `${card.signal}12`,
                border: `1px solid ${card.signal}25`,
              }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: card.signal }}>
                  {TEMPLATE_COUNTS[card.category] ?? "10+"} templates
                </span>
              </div>
            </div>
          ))}
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
        <Label step={2}>The workflow</Label>
        <h2 style={{
          fontSize: "clamp(24px, 3.5vw, 44px)",
          fontWeight: 800, letterSpacing: "-0.04em",
          lineHeight: 1.1, color: "var(--text)",
          margin: "0 0 48px",
        }}>
          From random thought to viral post.
        </h2>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(5, 1fr)",
          gap: 0, borderLeft: "1px solid var(--border)",
        }} className="steps-grid">
          {[
            { num: "01", title: "Capture", body: "Drop any idea into the Vault the moment it hits. Type, speak, or paste. AI scores and tags it instantly." },
            { num: "02", title: "Validate", body: "Open it in Studio. Check it against real YouTube and Google Trends data — opportunity score, trend direction, competition, untapped angles." },
            { num: "03", title: "Plan the script", body: "Go to Develop. Pick from 6 hook variants built on psychological triggers. A full script with beats and timestamps is built around your choice." },
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
        <Label step={3}>Built for every creator</Label>
        <h2 style={{
          fontSize: "clamp(24px, 3.5vw, 44px)",
          fontWeight: 800, letterSpacing: "-0.04em",
          lineHeight: 1.1, color: "var(--text)",
          margin: "0 0 48px",
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
        <Label step={4}>Why this works better</Label>
        <h2 style={{
          fontSize: "clamp(24px, 3.5vw, 44px)",
          fontWeight: 800, letterSpacing: "-0.04em",
          lineHeight: 1.1, color: "var(--text)",
          margin: "0 0 48px",
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
        <CompareRow left="One output — no angles, no choice" right="6 hook variants with named psychological triggers" />
        <CompareRow left="Sounds the same on every platform" right="Platform-native captions with real hashtag data" />
        <CompareRow left="Forgets everything after the chat" right="Conversation history saved — pick up any session" />
        <CompareRow left="No idea validation, just guesswork" right="Validates your idea against real YouTube and Google Trends data before you film" />
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
                background: "var(--accent)",
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
          .hooks-showcase-grid {
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
          .hooks-showcase-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
