import React, { useState } from "react";
import { Platform } from "../types/index";
import { PlatformCard } from "../components/PlatformCard";
import { useGenerationCtx } from "../App";
import { Navbar } from "../components/Navbar";
import { CaptureSlideOver } from "../components/CaptureSlideOver";
import { createIdea } from "../api/ideas";

const BANNER_DISMISSED_KEY = "vault-banner-dismissed";

const SparkleIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
  </svg>
);

interface ResultsScreenProps {
  onStartOver: () => void;
}

export function ResultsScreen({ onStartOver }: ResultsScreenProps) {
  const { generation, selectedPlatforms, regenerate } = useGenerationCtx();
  const successCount = selectedPlatforms.filter((p) => generation[p].status === "success").length;

  const [bannerVisible, setBannerVisible] = useState(
    () => sessionStorage.getItem(BANNER_DISMISSED_KEY) !== "true"
  );
  const [slideOverOpen, setSlideOverOpen] = useState(false);

  async function handleIdeaSubmit(text: string) {
    await createIdea(text);
    sessionStorage.setItem(BANNER_DISMISSED_KEY, "true");
    setBannerVisible(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", position: "relative" }} className="fade-in">

      {/* Same background glows as landing */}
      <div style={{
        position: "fixed", top: -200, right: -200, width: 600, height: 600,
        background: "radial-gradient(circle, rgba(13,148,136,0.06) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "fixed", bottom: -100, left: -100, width: 400, height: 400,
        background: "radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* Shared navbar — logo click goes back to home */}
      <Navbar onBack={onStartOver}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "4px 12px", borderRadius: 99,
          background: "var(--accent-subtle)", border: "1px solid rgba(13,148,136,0.2)",
          fontSize: 11, fontWeight: 700, color: "var(--accent-text)",
          letterSpacing: "0.04em",
        }}>
          <SparkleIcon /> {successCount} of {selectedPlatforms.length} ready
        </div>
        <button onClick={onStartOver} style={{
          padding: "7px 16px", fontSize: 13, fontWeight: 500,
          color: "var(--text-2)", background: "var(--bg-subtle)",
          border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
          cursor: "pointer", transition: "all var(--transition)",
        }}
        onMouseEnter={(e) => {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.background = "var(--bg-hover)"; b.style.borderColor = "var(--border-strong)";
        }}
        onMouseLeave={(e) => {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.background = "var(--bg-subtle)"; b.style.borderColor = "var(--border)";
        }}>
          ← New content
        </button>
      </Navbar>

      {/* Page content */}
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "48px 24px 80px", position: "relative", zIndex: 1 }}>

        {/* Page heading — same style as landing hero */}
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div className="fade-up" style={{
            animationDelay: "0ms",
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 14px", borderRadius: 99,
            background: "var(--accent-subtle)", border: "1px solid rgba(13,148,136,0.2)",
            fontSize: 11, fontWeight: 700, color: "var(--accent-text)",
            letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 20,
          }}>
            <SparkleIcon /> Content ready
          </div>
          <h1 className="fade-up" style={{
            animationDelay: "60ms",
            fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 700,
            letterSpacing: "-0.03em", color: "var(--text)",
            lineHeight: 1.1, marginBottom: 12,
          }}>
            Your posts are{" "}
            <span className="gradient-text">ready to copy.</span>
          </h1>
          <p className="fade-up" style={{
            animationDelay: "120ms",
            fontSize: 15, color: "var(--text-2)", maxWidth: 440, margin: "0 auto",
          }}>
            Copy any post directly — or hit Regenerate on any card for a different angle.
          </p>
        </div>

        {/* Vault banner */}
        {bannerVisible && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 12,
            padding: "12px 20px",
            marginBottom: 20,
            borderRadius: "var(--radius-md)",
            background: "var(--bg-card)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}>
            <span style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 500 }}>
              Got a new idea from this content?
            </span>
            <button
              onClick={() => setSlideOverOpen(true)}
              style={{
                fontSize: 13, fontWeight: 600,
                color: "var(--accent-text)",
                background: "var(--accent-subtle)",
                border: "1px solid rgba(13,148,136,0.2)",
                borderRadius: "var(--radius-sm)",
                padding: "6px 14px",
                cursor: "pointer",
                transition: "all var(--transition)",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(13,148,136,0.15)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-subtle)";
              }}
            >
              Capture to Vault →
            </button>
          </div>
        )}

        {/* Cards grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))",
          gap: 20,
        }}>
          {selectedPlatforms.map((platform, i) => (
            <div key={platform} className="fade-up" style={{ animationDelay: `${180 + i * 80}ms` }}>
              <PlatformCard platform={platform} state={generation[platform]} onRegenerate={regenerate} />
            </div>
          ))}
        </div>

        {/* Footer strip */}
        <div style={{
          marginTop: 56, paddingTop: 24,
          borderTop: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: 12,
        }}>
          <span style={{ fontSize: 13, color: "var(--text-4)" }}>
            Powered by Hookd · Groq / Llama 3.3 70B
          </span>
          <button onClick={onStartOver} style={{
            fontSize: 13, fontWeight: 600, color: "var(--accent-text)",
            background: "none", border: "none", cursor: "pointer", padding: 0,
            transition: "opacity var(--transition)",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.7"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}>
            Amplify another piece →
          </button>
        </div>
      </div>

      {/* Capture slide-over */}
      <CaptureSlideOver
        open={slideOverOpen}
        onClose={() => setSlideOverOpen(false)}
        onSubmit={handleIdeaSubmit}
      />
    </div>
  );
}
